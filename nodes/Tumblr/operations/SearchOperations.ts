import { IDataObject, NodeOperationError } from 'n8n-workflow';
import { TumblrClient } from '../TumblrAuthenticator';

export class SearchOperations {
    /**
     * Search posts by tag with filtering options
     */
    static async searchByTag(
        client: TumblrClient,
        tag: string,
        options: IDataObject = {}
    ): Promise<IDataObject> {
        try {
            const params: IDataObject = {
                limit: options.limit || 20,
            };

            // Add optional filtering parameters
            if (options.before) {
                params.before = options.before;
            }
            if (options.filter) {
                params.filter = options.filter;
            }

            const response = await client.taggedPosts(tag, params);

            return {
                success: true,
                data: {
                    posts: response.posts || [],
                    totalPosts: response.total_posts || 0,
                    tag: tag,
                    ...response
                },
                metadata: {
                    operation: 'searchByTag',
                    tag: tag,
                    timestamp: new Date().toISOString(),
                    resultCount: response.posts?.length || 0
                }
            };
        } catch (error: any) {
            throw new NodeOperationError(
                {} as any,
                `Failed to search posts by tag "${tag}": ${error.message}`,
                { description: 'Check that the tag exists and your credentials are valid' }
            );
        }
    }

    /**
     * Get tag information including popularity metrics
     */
    static async getTagInfo(
        client: TumblrClient,
        tag: string
    ): Promise<IDataObject> {
        try {
            // Get tagged posts to analyze popularity
            const taggedResponse = await client.taggedPosts(tag, { limit: 1 });

            // Get recent posts with this tag for trending analysis
            const recentResponse = await client.taggedPosts(tag, {
                limit: 50,
                filter: 'text'
            });

            const posts = recentResponse.posts || [];
            const totalPosts = taggedResponse.total_posts || 0;

            // Calculate basic popularity metrics
            const recentActivity = posts.length;
            const avgNotes = posts.length > 0
                ? posts.reduce((sum: number, post: any) => sum + (post.note_count || 0), 0) / posts.length
                : 0;

            return {
                success: true,
                data: {
                    tag: tag,
                    totalPosts: totalPosts,
                    recentActivity: recentActivity,
                    averageNotes: Math.round(avgNotes),
                    isPopular: totalPosts > 1000,
                    isTrending: recentActivity > 10 && avgNotes > 50,
                    lastUpdated: new Date().toISOString()
                },
                metadata: {
                    operation: 'getTagInfo',
                    tag: tag,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error: any) {
            throw new NodeOperationError(
                {} as any,
                `Failed to get tag information for "${tag}": ${error.message}`,
                { description: 'Check that the tag exists and your credentials are valid' }
            );
        }
    }

    /**
     * Get tag suggestions based on a partial tag name
     */
    static async getTagSuggestions(
        client: TumblrClient,
        partialTag: string,
        limit: number = 10
    ): Promise<IDataObject> {
        try {
            // Since Tumblr API doesn't have a direct tag suggestion endpoint,
            // we'll search for posts with the partial tag and extract related tags
            const response = await client.taggedPosts(partialTag, {
                limit: 50
            });

            const posts = response.posts || [];
            const tagCounts: { [key: string]: number } = {};

            // Extract and count all tags from the posts
            posts.forEach((post: any) => {
                if (post.tags && Array.isArray(post.tags)) {
                    post.tags.forEach((tag: string) => {
                        const lowerTag = tag.toLowerCase();
                        if (lowerTag.includes(partialTag.toLowerCase())) {
                            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                        }
                    });
                }
            });

            // Sort tags by frequency and take top suggestions
            const suggestions = Object.entries(tagCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, limit)
                .map(([tag, count]) => ({
                    tag,
                    frequency: count,
                    similarity: this.calculateSimilarity(partialTag, tag)
                }));

            return {
                success: true,
                data: {
                    query: partialTag,
                    suggestions: suggestions,
                    totalSuggestions: suggestions.length
                },
                metadata: {
                    operation: 'getTagSuggestions',
                    query: partialTag,
                    timestamp: new Date().toISOString(),
                    suggestionCount: suggestions.length
                }
            };
        } catch (error: any) {
            throw new NodeOperationError(
                {} as any,
                `Failed to get tag suggestions for "${partialTag}": ${error.message}`,
                { description: 'Check your credentials and try a different search term' }
            );
        }
    }

    /**
     * Get trending tags based on recent activity
     */
    static async getTrendingTags(
        client: TumblrClient,
        limit: number = 20
    ): Promise<IDataObject> {
        try {
            // Get recent posts from dashboard to analyze trending tags
            const response = await client.userDashboard({ limit: 100 });
            const posts = response.posts || [];

            const tagCounts: { [key: string]: { count: number; totalNotes: number; posts: number } } = {};

            // Analyze tags from recent posts
            posts.forEach((post: any) => {
                if (post.tags && Array.isArray(post.tags)) {
                    post.tags.forEach((tag: string) => {
                        if (!tagCounts[tag]) {
                            tagCounts[tag] = { count: 0, totalNotes: 0, posts: 0 };
                        }
                        tagCounts[tag].count += 1;
                        tagCounts[tag].totalNotes += post.note_count || 0;
                        tagCounts[tag].posts += 1;
                    });
                }
            });

            // Calculate trending score and sort
            const trendingTags = Object.entries(tagCounts)
                .map(([tag, stats]) => ({
                    tag,
                    frequency: stats.count,
                    averageNotes: Math.round(stats.totalNotes / stats.posts),
                    trendingScore: stats.count * (stats.totalNotes / stats.posts),
                    posts: stats.posts
                }))
                .sort((a, b) => b.trendingScore - a.trendingScore)
                .slice(0, limit);

            return {
                success: true,
                data: {
                    trendingTags: trendingTags,
                    totalAnalyzed: Object.keys(tagCounts).length,
                    analysisDate: new Date().toISOString()
                },
                metadata: {
                    operation: 'getTrendingTags',
                    timestamp: new Date().toISOString(),
                    trendingCount: trendingTags.length
                }
            };
        } catch (error: any) {
            throw new NodeOperationError(
                {} as any,
                `Failed to get trending tags: ${error.message}`,
                { description: 'Check your credentials and ensure you have dashboard access' }
            );
        }
    }

    /**
     * Get comprehensive trending content including popular posts, tags, and topics
     */
    static async getTrending(
        client: TumblrClient,
        options: IDataObject = {}
    ): Promise<IDataObject> {
        try {
            const limit = typeof options.limit === 'number' ? options.limit : 20;
            const timeframe = typeof options.timeframe === 'string' ? options.timeframe : '24h';
            const includeContent = typeof options.includeContent === 'boolean' ? options.includeContent : true;
            const includeTags = typeof options.includeTags === 'boolean' ? options.includeTags : true;
            const includeTopics = typeof options.includeTopics === 'boolean' ? options.includeTopics : true;

            // Calculate time threshold based on timeframe
            const now = Date.now();
            let timeThreshold = now;
            switch (timeframe) {
                case '1h':
                    timeThreshold = now - (1 * 60 * 60 * 1000);
                    break;
                case '6h':
                    timeThreshold = now - (6 * 60 * 60 * 1000);
                    break;
                case '24h':
                    timeThreshold = now - (24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    timeThreshold = now - (7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    timeThreshold = now - (30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    timeThreshold = now - (24 * 60 * 60 * 1000); // Default to 24h
            }

            // Get recent posts for analysis
            const response = await client.userDashboard({ limit: 200 });
            const allPosts = response.posts || [];

            // Filter posts by timeframe
            const recentPosts = allPosts.filter((post: any) => {
                const postTime = post.timestamp ? post.timestamp * 1000 : (post.date ? new Date(post.date).getTime() : Date.now());
                return postTime >= timeThreshold;
            });

            const result: IDataObject = {
                timeframe,
                analysisDate: new Date().toISOString(),
                totalPostsAnalyzed: recentPosts.length,
                timeThreshold: new Date(timeThreshold).toISOString()
            };

            // Analyze trending content (popular posts)
            if (includeContent) {
                const trendingPosts = recentPosts
                    .map((post: any) => ({
                        ...post,
                        trendingScore: this.calculateTrendingScore(post, timeThreshold)
                    }))
                    .sort((a: any, b: any) => b.trendingScore - a.trendingScore)
                    .slice(0, limit)
                    .map((post: any) => ({
                        id: post.id,
                        type: post.type,
                        blog_name: post.blog_name,
                        post_url: post.post_url,
                        timestamp: post.timestamp,
                        note_count: post.note_count || 0,
                        trendingScore: post.trendingScore,
                        title: post.title || '',
                        summary: post.summary || '',
                        tags: post.tags || []
                    }));

                result.trendingPosts = trendingPosts;
            }

            // Analyze trending tags
            if (includeTags) {
                const tagStats: { [key: string]: { count: number; totalNotes: number; posts: number; avgEngagement: number } } = {};

                recentPosts.forEach((post: any) => {
                    if (post.tags && Array.isArray(post.tags)) {
                        const noteCount = post.note_count || 0;
                        post.tags.forEach((tag: string) => {
                            if (!tagStats[tag]) {
                                tagStats[tag] = { count: 0, totalNotes: 0, posts: 0, avgEngagement: 0 };
                            }
                            tagStats[tag].count += 1;
                            tagStats[tag].totalNotes += noteCount;
                            tagStats[tag].posts += 1;
                        });
                    }
                });

                // Calculate trending tags with engagement metrics
                const trendingTags = Object.entries(tagStats)
                    .map(([tag, stats]) => {
                        const avgEngagement = stats.posts > 0 ? stats.totalNotes / stats.posts : 0;
                        return {
                            tag,
                            frequency: stats.count,
                            totalNotes: stats.totalNotes,
                            averageEngagement: Math.round(avgEngagement),
                            trendingScore: stats.count * avgEngagement,
                            posts: stats.posts
                        };
                    })
                    .filter(item => item.frequency >= 2) // Only include tags used multiple times
                    .sort((a: any, b: any) => b.trendingScore - a.trendingScore)
                    .slice(0, limit);

                result.trendingTags = trendingTags;
            }

            // Analyze trending topics (content themes)
            if (includeTopics) {
                const topics = this.extractTopics(recentPosts);
                const trendingTopics = topics
                    .sort((a: any, b: any) => b.score - a.score)
                    .slice(0, Math.min(limit, 10)); // Limit topics to 10

                result.trendingTopics = trendingTopics;
            }

            // Add summary statistics
            result.summary = {
                totalTrendingItems: (Array.isArray(result.trendingPosts) ? result.trendingPosts.length : 0) +
                    (Array.isArray(result.trendingTags) ? result.trendingTags.length : 0) +
                    (Array.isArray(result.trendingTopics) ? result.trendingTopics.length : 0),
                averageEngagement: recentPosts.length > 0
                    ? Math.round(recentPosts.reduce((sum: number, post: any) => sum + (post.note_count || 0), 0) / recentPosts.length)
                    : 0,
                mostActivePostType: this.getMostActivePostType(recentPosts),
                peakActivity: this.calculatePeakActivity(recentPosts, timeThreshold)
            };

            return {
                success: true,
                data: result,
                metadata: {
                    operation: 'getTrending',
                    timestamp: new Date().toISOString(),
                    timeframe,
                    analysisScope: {
                        totalPosts: allPosts.length,
                        recentPosts: recentPosts.length,
                        timeThreshold: new Date(timeThreshold).toISOString()
                    }
                }
            };
        } catch (error: any) {
            throw new NodeOperationError(
                {} as any,
                `Failed to get trending content: ${error.message}`,
                {
                    description: 'Check your credentials and try adjusting the timeframe. Ensure you have dashboard access and sufficient recent activity to analyze.'
                }
            );
        }
    }

    /**
     * Calculate trending score for a post based on engagement and recency
     */
    private static calculateTrendingScore(post: any, timeThreshold: number): number {
        const noteCount = post.note_count || 0;
        const postTime = post.timestamp ? post.timestamp * 1000 : new Date(post.date).getTime();

        // Recency factor (more recent posts get higher scores)
        const timeSinceThreshold = Date.now() - timeThreshold;
        const postAge = Date.now() - postTime;
        const recencyFactor = Math.max(0, 1 - (postAge / timeSinceThreshold));

        // Engagement factor
        const engagementFactor = Math.log(noteCount + 1); // Log scale to prevent outliers from dominating

        // Content type bonus (some types tend to be more engaging)
        const typeBonus = this.getPostTypeBonus(post.type);

        return (engagementFactor * recencyFactor * typeBonus);
    }

    /**
     * Get bonus multiplier for different post types
     */
    private static getPostTypeBonus(postType: string): number {
        const bonuses: { [key: string]: number } = {
            'photo': 1.2,
            'video': 1.3,
            'audio': 1.1,
            'text': 1.0,
            'quote': 1.1,
            'link': 0.9,
            'chat': 0.8
        };
        return bonuses[postType] || 1.0;
    }

    /**
     * Extract trending topics from posts based on content analysis
     */
    private static extractTopics(posts: any[]): Array<{ topic: string; score: number; posts: number; keywords: string[] }> {
        const topicKeywords: { [key: string]: string[] } = {
            'art': ['art', 'drawing', 'painting', 'sketch', 'artwork', 'artist', 'creative', 'design'],
            'photography': ['photo', 'photography', 'camera', 'shot', 'picture', 'photographer'],
            'music': ['music', 'song', 'album', 'artist', 'band', 'concert', 'audio', 'sound'],
            'fashion': ['fashion', 'style', 'outfit', 'clothing', 'dress', 'shoes', 'accessories'],
            'food': ['food', 'recipe', 'cooking', 'eat', 'delicious', 'meal', 'restaurant'],
            'travel': ['travel', 'trip', 'vacation', 'journey', 'explore', 'adventure', 'destination'],
            'technology': ['tech', 'technology', 'computer', 'software', 'app', 'digital', 'internet'],
            'gaming': ['game', 'gaming', 'gamer', 'play', 'video game', 'console', 'pc'],
            'movies': ['movie', 'film', 'cinema', 'actor', 'director', 'hollywood', 'tv show'],
            'books': ['book', 'reading', 'author', 'novel', 'literature', 'story', 'writing']
        };

        const topicScores: { [key: string]: { score: number; posts: number; matchedKeywords: Set<string> } } = {};

        posts.forEach((post: any) => {
            const content = [
                post.title || '',
                post.body || '',
                post.caption || '',
                post.summary || '',
                ...(post.tags || [])
            ].join(' ').toLowerCase();

            Object.entries(topicKeywords).forEach(([topic, keywords]) => {
                const matches = keywords.filter(keyword => content.includes(keyword));
                if (matches.length > 0) {
                    if (!topicScores[topic]) {
                        topicScores[topic] = { score: 0, posts: 0, matchedKeywords: new Set() };
                    }

                    // Score based on number of keyword matches and post engagement
                    const keywordScore = matches.length;
                    const engagementScore = Math.log((post.note_count || 0) + 1);
                    topicScores[topic].score += keywordScore * (1 + engagementScore);
                    topicScores[topic].posts += 1;

                    matches.forEach(keyword => topicScores[topic].matchedKeywords.add(keyword));
                }
            });
        });

        return Object.entries(topicScores).map(([topic, data]) => ({
            topic,
            score: Math.round(data.score * 100) / 100,
            posts: data.posts,
            keywords: Array.from(data.matchedKeywords)
        }));
    }

    /**
     * Search user content within specific blogs or timeframes
     */
    static async searchUserContent(
        client: TumblrClient,
        searchParams: IDataObject
    ): Promise<IDataObject> {
        try {
            // Type-safe parameter extraction
            const blogName = typeof searchParams.blogName === 'string' ? searchParams.blogName : undefined;
            const keyword = typeof searchParams.keyword === 'string' ? searchParams.keyword : undefined;
            const tags = Array.isArray(searchParams.tags) ? searchParams.tags :
                (typeof searchParams.tags === 'string' && searchParams.tags ? searchParams.tags.split(',').map(t => t.trim()) : undefined);
            const postType = typeof searchParams.postType === 'string' ? searchParams.postType : undefined;
            const dateFrom = typeof searchParams.dateFrom === 'string' ? searchParams.dateFrom : undefined;
            const dateTo = typeof searchParams.dateTo === 'string' ? searchParams.dateTo : undefined;
            const minNotes = typeof searchParams.minNotes === 'number' ? searchParams.minNotes : undefined;
            const maxNotes = typeof searchParams.maxNotes === 'number' ? searchParams.maxNotes : undefined;
            const limit = typeof searchParams.limit === 'number' ? searchParams.limit : 50;
            const offset = typeof searchParams.offset === 'number' ? searchParams.offset : 0;
            const sortBy = typeof searchParams.sortBy === 'string' ? searchParams.sortBy : 'timestamp';
            const sortOrder = typeof searchParams.sortOrder === 'string' ? searchParams.sortOrder : 'desc';
            const page = typeof searchParams.page === 'number' ? searchParams.page : 1;
            const pageSize = typeof searchParams.pageSize === 'number' ? searchParams.pageSize : 20;

            let allPosts: any[] = [];

            // If blogName is specified, search within that specific blog
            if (blogName) {
                try {
                    // Get posts from the specific blog
                    const blogResponse = await client.blogPosts(blogName, {
                        limit,
                        offset,
                        type: postType
                    });
                    allPosts = blogResponse.posts || [];
                } catch (blogError: any) {
                    // If blog-specific search fails, provide helpful error message
                    throw new NodeOperationError(
                        {} as any,
                        `Failed to search content in blog "${blogName}": ${blogError.message}`,
                        {
                            description: `Check that the blog "${blogName}" exists and is accessible. You may need to follow the blog or ensure it's public. Try searching without specifying a blog name to search across your dashboard.`
                        }
                    );
                }
            } else {
                // Search across user's dashboard/following
                const dashboardResponse = await client.userDashboard({
                    limit,
                    offset,
                    type: postType
                });
                allPosts = dashboardResponse.posts || [];
            }

            // Apply content filters
            let filteredPosts = allPosts.filter((post: any) => {
                // Keyword filter - search across multiple fields
                if (keyword) {
                    const searchText = keyword.toLowerCase();
                    const searchableContent = [
                        post.title,
                        post.body,
                        post.caption,
                        post.summary,
                        post.source_title,
                        post.source_url,
                        post.quote,
                        post.description
                    ].filter(field => field && typeof field === 'string')
                        .join(' ')
                        .toLowerCase();

                    const hasKeywordInContent = searchableContent.includes(searchText);
                    const hasKeywordInTags = post.tags && Array.isArray(post.tags) &&
                        post.tags.some((tag: string) =>
                            typeof tag === 'string' && tag.toLowerCase().includes(searchText)
                        );

                    if (!hasKeywordInContent && !hasKeywordInTags) {
                        return false;
                    }
                }

                // Tags filter - must contain all specified tags
                if (tags && Array.isArray(tags) && tags.length > 0) {
                    const postTags = post.tags || [];
                    const hasAllTags = tags.every((searchTag: string) => {
                        return postTags.some((postTag: string) =>
                            typeof postTag === 'string' &&
                            postTag.toLowerCase().includes(searchTag.toLowerCase())
                        );
                    });
                    if (!hasAllTags) return false;
                }

                // Date range filter
                if (dateFrom || dateTo) {
                    const postDate = new Date(post.date || post.timestamp * 1000);
                    if (dateFrom && postDate < new Date(dateFrom)) return false;
                    if (dateTo && postDate > new Date(dateTo)) return false;
                }

                // Notes count filter
                const noteCount = post.note_count || 0;
                if (minNotes && noteCount < minNotes) return false;
                if (maxNotes && noteCount > maxNotes) return false;

                return true;
            });

            // Apply sorting
            filteredPosts = this.sortPosts(filteredPosts, sortBy, sortOrder);

            // Apply pagination
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

            // Calculate additional metadata for user content search
            const blogStats = this.calculateBlogStats(filteredPosts);
            const contentAnalysis = this.analyzeUserContent(filteredPosts);

            return {
                success: true,
                data: {
                    posts: paginatedPosts,
                    totalResults: filteredPosts.length,
                    searchScope: blogName ? `blog:${blogName}` : 'user_dashboard',
                    page: page,
                    pageSize: pageSize,
                    totalPages: Math.ceil(filteredPosts.length / pageSize),
                    hasNextPage: endIndex < filteredPosts.length,
                    hasPreviousPage: page > 1,
                    blogStats: blogStats,
                    contentAnalysis: contentAnalysis
                },
                metadata: {
                    operation: 'searchUserContent',
                    timestamp: new Date().toISOString(),
                    resultCount: paginatedPosts.length,
                    totalMatches: filteredPosts.length,
                    searchParams: {
                        blogName,
                        keyword,
                        tags,
                        postType,
                        dateFrom,
                        dateTo,
                        minNotes,
                        maxNotes,
                        limit,
                        offset,
                        sortBy,
                        sortOrder,
                        page,
                        pageSize
                    }
                }
            };
        } catch (error: any) {
            // Check if it's already a NodeOperationError (from blog-specific search)
            if (error instanceof NodeOperationError) {
                throw error;
            }

            // Provide helpful error messages and alternative suggestions
            let errorMessage = `Failed to search user content: ${error.message}`;
            let suggestions = 'Try adjusting your search parameters or check your credentials.';

            // Provide specific suggestions based on error type
            if (error.message.includes('rate limit') || error.message.includes('429')) {
                suggestions = 'Rate limit reached. Wait a few minutes before trying again, or reduce the search scope by specifying a blog name or smaller date range.';
            } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
                suggestions = 'Authentication failed. Check your Tumblr credentials and ensure they have the necessary permissions.';
            } else if (error.message.includes('not found') || error.message.includes('404')) {
                suggestions = 'Content not found. If searching a specific blog, verify the blog name is correct and the blog is accessible.';
            } else if (error.message.includes('network') || error.message.includes('timeout')) {
                suggestions = 'Network error occurred. Check your internet connection and try again. Consider reducing the search scope for better performance.';
            }

            throw new NodeOperationError(
                {} as any,
                errorMessage,
                { description: suggestions }
            );
        }
    }

    /**
     * Calculate statistics about blogs in the search results
     */
    private static calculateBlogStats(posts: any[]): IDataObject {
        const blogCounts: { [blogName: string]: number } = {};
        const blogEngagement: { [blogName: string]: { totalNotes: number; posts: number } } = {};

        posts.forEach((post: any) => {
            const blogName = post.blog_name || 'unknown';
            blogCounts[blogName] = (blogCounts[blogName] || 0) + 1;

            if (!blogEngagement[blogName]) {
                blogEngagement[blogName] = { totalNotes: 0, posts: 0 };
            }
            blogEngagement[blogName].totalNotes += post.note_count || 0;
            blogEngagement[blogName].posts += 1;
        });

        const topBlogs = Object.entries(blogCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([blogName, postCount]) => ({
                blogName,
                postCount,
                averageEngagement: blogEngagement[blogName] ?
                    Math.round(blogEngagement[blogName].totalNotes / blogEngagement[blogName].posts) : 0
            }));

        return {
            totalBlogs: Object.keys(blogCounts).length,
            topBlogs: topBlogs,
            averagePostsPerBlog: Object.keys(blogCounts).length > 0 ?
                Math.round(posts.length / Object.keys(blogCounts).length) : 0
        };
    }

    /**
     * Analyze content patterns in user search results
     */
    private static analyzeUserContent(posts: any[]): IDataObject {
        const postTypes: { [type: string]: number } = {};
        const tagFrequency: { [tag: string]: number } = {};
        const timeDistribution: { [hour: string]: number } = {};
        let totalEngagement = 0;

        posts.forEach((post: any) => {
            // Post type distribution
            const type = post.type || 'unknown';
            postTypes[type] = (postTypes[type] || 0) + 1;

            // Tag frequency
            if (post.tags && Array.isArray(post.tags)) {
                post.tags.forEach((tag: string) => {
                    if (typeof tag === 'string') {
                        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
                    }
                });
            }

            // Time distribution
            const postDate = new Date(post.date || post.timestamp * 1000);
            const hour = postDate.getHours().toString().padStart(2, '0');
            timeDistribution[hour] = (timeDistribution[hour] || 0) + 1;

            // Engagement
            totalEngagement += post.note_count || 0;
        });

        // Get top tags
        const topTags = Object.entries(tagFrequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([tag, count]) => ({ tag, count }));

        // Get most active hours
        const activeHours = Object.entries(timeDistribution)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([hour, count]) => ({ hour: `${hour}:00`, count }));

        return {
            postTypeDistribution: postTypes,
            topTags: topTags,
            activeHours: activeHours,
            averageEngagement: posts.length > 0 ? Math.round(totalEngagement / posts.length) : 0,
            totalEngagement: totalEngagement,
            contentDiversity: Object.keys(postTypes).length,
            tagDiversity: Object.keys(tagFrequency).length
        };
    }

    /**
     * Get the most active post type in the analyzed period
     */
    private static getMostActivePostType(posts: any[]): string {
        const typeCounts: { [key: string]: number } = {};

        posts.forEach((post: any) => {
            const type = post.type || 'unknown';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        return Object.entries(typeCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';
    }

    /**
     * Calculate peak activity period within the timeframe
     */
    private static calculatePeakActivity(posts: any[], timeThreshold: number): { hour: number; count: number } {
        const hourCounts: { [key: number]: number } = {};

        posts.forEach((post: any) => {
            const postTime = post.timestamp ? post.timestamp * 1000 : new Date(post.date).getTime();
            const hour = new Date(postTime).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const peakHour = Object.entries(hourCounts)
            .sort(([, a], [, b]) => b - a)[0];

        return {
            hour: peakHour ? parseInt(peakHour[0]) : 0,
            count: peakHour ? peakHour[1] : 0
        };
    }

    /**
     * Search posts by keyword with full-text search
     */
    static async searchByKeyword(
        client: TumblrClient,
        keyword: string,
        options: IDataObject = {}
    ): Promise<IDataObject> {
        try {
            // Type-safe option extraction with defaults
            const limit = typeof options.limit === 'number' ? options.limit : 50;
            const offset = typeof options.offset === 'number' ? options.offset : 0;
            const type = typeof options.type === 'string' ? options.type : undefined;
            const sortBy = typeof options.sortBy === 'string' ? options.sortBy : undefined;
            const sortOrder = typeof options.sortOrder === 'string' ? options.sortOrder : 'desc';
            const page = typeof options.page === 'number' ? options.page : 1;
            const pageSize = typeof options.pageSize === 'number' ? options.pageSize : 20;

            // Since Tumblr API doesn't have a direct keyword search endpoint,
            // we'll use the dashboard and filter posts by keyword
            const dashboardOptions: IDataObject = {
                limit,
                offset,
            };

            if (type) {
                dashboardOptions.type = type;
            }

            const response = await client.userDashboard(dashboardOptions);
            const allPosts = response.posts || [];

            // Filter posts by keyword in title, body, caption, or tags
            const filteredPosts = allPosts.filter((post: any) => {
                const searchText = keyword.toLowerCase();

                // Search in title
                if (post.title && typeof post.title === 'string' && post.title.toLowerCase().includes(searchText)) {
                    return true;
                }

                // Search in body
                if (post.body && typeof post.body === 'string' && post.body.toLowerCase().includes(searchText)) {
                    return true;
                }

                // Search in caption
                if (post.caption && typeof post.caption === 'string' && post.caption.toLowerCase().includes(searchText)) {
                    return true;
                }

                // Search in tags
                if (post.tags && Array.isArray(post.tags)) {
                    return post.tags.some((tag: string) =>
                        typeof tag === 'string' && tag.toLowerCase().includes(searchText)
                    );
                }

                // Search in summary
                if (post.summary && typeof post.summary === 'string' && post.summary.toLowerCase().includes(searchText)) {
                    return true;
                }

                return false;
            });

            // Apply sorting if specified
            let sortedPosts = filteredPosts;
            if (sortBy) {
                sortedPosts = this.sortPosts(filteredPosts, sortBy, sortOrder);
            }

            // Apply pagination
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedPosts = sortedPosts.slice(startIndex, endIndex);

            return {
                success: true,
                data: {
                    posts: paginatedPosts,
                    totalResults: filteredPosts.length,
                    keyword: keyword,
                    page: page,
                    pageSize: pageSize,
                    totalPages: Math.ceil(filteredPosts.length / pageSize),
                    hasNextPage: endIndex < filteredPosts.length,
                    hasPreviousPage: page > 1
                },
                metadata: {
                    operation: 'searchByKeyword',
                    keyword: keyword,
                    timestamp: new Date().toISOString(),
                    resultCount: paginatedPosts.length,
                    totalMatches: filteredPosts.length,
                    searchOptions: {
                        limit,
                        offset,
                        type,
                        sortBy,
                        sortOrder,
                        page,
                        pageSize
                    }
                }
            };
        } catch (error: any) {
            throw new NodeOperationError(
                {} as any,
                `Failed to search posts by keyword "${keyword}": ${error.message}`,
                { description: 'Check your credentials and try a different search term' }
            );
        }
    }

    /**
     * Search posts with advanced filtering options
     */
    static async advancedSearch(
        client: TumblrClient,
        searchParams: IDataObject
    ): Promise<IDataObject> {
        try {
            // Type-safe parameter extraction
            const keyword = typeof searchParams.keyword === 'string' ? searchParams.keyword : undefined;
            const tags = Array.isArray(searchParams.tags) ? searchParams.tags : undefined;
            const postType = typeof searchParams.postType === 'string' ? searchParams.postType : undefined;
            const dateFrom = typeof searchParams.dateFrom === 'string' ? searchParams.dateFrom : undefined;
            const dateTo = typeof searchParams.dateTo === 'string' ? searchParams.dateTo : undefined;
            const minNotes = typeof searchParams.minNotes === 'number' ? searchParams.minNotes : undefined;
            const maxNotes = typeof searchParams.maxNotes === 'number' ? searchParams.maxNotes : undefined;
            const limit = typeof searchParams.limit === 'number' ? searchParams.limit : 50;
            const sortBy = typeof searchParams.sortBy === 'string' ? searchParams.sortBy : 'timestamp';
            const sortOrder = typeof searchParams.sortOrder === 'string' ? searchParams.sortOrder : 'desc';

            // Get posts from dashboard
            const response = await client.userDashboard({ limit: limit * 2 }); // Get more to filter
            const allPosts = response.posts || [];

            // Apply filters
            let filteredPosts = allPosts.filter((post: any) => {
                // Keyword filter
                if (keyword) {
                    const searchText = keyword.toLowerCase();
                    const hasKeyword = [post.title, post.body, post.caption, post.summary]
                        .some(field => field && typeof field === 'string' && field.toLowerCase().includes(searchText));

                    if (!hasKeyword && post.tags && Array.isArray(post.tags)) {
                        const hasKeywordInTags = post.tags.some((tag: string) =>
                            typeof tag === 'string' && tag.toLowerCase().includes(searchText)
                        );
                        if (!hasKeywordInTags) return false;
                    } else if (!hasKeyword) {
                        return false;
                    }
                }

                // Post type filter
                if (postType && post.type !== postType) {
                    return false;
                }

                // Tags filter
                if (tags && Array.isArray(tags)) {
                    const postTags = post.tags || [];
                    const hasAllTags = tags.every((tag: any) => {
                        if (typeof tag !== 'string') return false;
                        return postTags.some((postTag: string) =>
                            typeof postTag === 'string' && postTag.toLowerCase().includes(tag.toLowerCase())
                        );
                    });
                    if (!hasAllTags) return false;
                }

                // Date range filter
                if (dateFrom || dateTo) {
                    const postDate = new Date(post.date || post.timestamp * 1000);
                    if (dateFrom && postDate < new Date(dateFrom)) return false;
                    if (dateTo && postDate > new Date(dateTo)) return false;
                }

                // Notes count filter
                const noteCount = post.note_count || 0;
                if (minNotes && noteCount < minNotes) return false;
                if (maxNotes && noteCount > maxNotes) return false;

                return true;
            });

            // Sort results
            filteredPosts = this.sortPosts(filteredPosts, sortBy, sortOrder);

            // Limit results
            filteredPosts = filteredPosts.slice(0, limit);

            return {
                success: true,
                data: {
                    posts: filteredPosts,
                    totalResults: filteredPosts.length,
                    searchParams: {
                        keyword,
                        tags,
                        postType,
                        dateFrom,
                        dateTo,
                        minNotes,
                        maxNotes,
                        limit,
                        sortBy,
                        sortOrder
                    }
                },
                metadata: {
                    operation: 'advancedSearch',
                    timestamp: new Date().toISOString(),
                    resultCount: filteredPosts.length
                }
            };
        } catch (error: any) {
            throw new NodeOperationError(
                {} as any,
                `Failed to perform advanced search: ${error.message}`,
                { description: 'Check your search parameters and credentials' }
            );
        }
    }

    /**
     * Sort posts by specified criteria
     */
    private static sortPosts(posts: any[], sortBy: string, sortOrder: string = 'desc'): any[] {
        return posts.sort((a: any, b: any) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'timestamp':
                case 'date':
                    aValue = new Date(a.date || a.timestamp * 1000).getTime();
                    bValue = new Date(b.date || b.timestamp * 1000).getTime();
                    break;
                case 'notes':
                case 'note_count':
                    aValue = a.note_count || 0;
                    bValue = b.note_count || 0;
                    break;
                case 'title':
                    aValue = (a.title || '').toLowerCase();
                    bValue = (b.title || '').toLowerCase();
                    break;
                case 'type':
                    aValue = a.type || '';
                    bValue = b.type || '';
                    break;
                default:
                    aValue = a[sortBy] || '';
                    bValue = b[sortBy] || '';
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            }
        });
    }

    /**
     * Calculate similarity between two strings (simple implementation)
     */
    private static calculateSimilarity(str1: string, str2: string): number {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) {
            return 1.0;
        }

        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    private static levenshteinDistance(str1: string, str2: string): number {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }
}