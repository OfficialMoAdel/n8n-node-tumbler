import { INodeListSearchItems, INodeListSearchResult, ICredentialsDecrypted } from 'n8n-workflow';
import { TumblrAuthenticator } from './TumblrAuthenticator';

/**
 * Search cache for storing search results to improve performance
 */
interface SearchCache {
    [key: string]: {
        data: INodeListSearchResult;
        timestamp: number;
        ttl: number;
    };
}

class ListSearchCache {
    private cache: SearchCache = {};
    private readonly DEFAULT_TTL = 2 * 60 * 1000; // 2 minutes for search results

    get(key: string): INodeListSearchResult | null {
        const cached = this.cache[key];
        if (!cached) return null;

        const now = Date.now();
        if (now > cached.timestamp + cached.ttl) {
            delete this.cache[key];
            return null;
        }

        return cached.data;
    }

    set(key: string, data: INodeListSearchResult, ttl: number = this.DEFAULT_TTL): void {
        this.cache[key] = {
            data,
            timestamp: Date.now(),
            ttl,
        };
    }

    clear(): void {
        this.cache = {};
    }
}

const searchCache = new ListSearchCache();

/**
 * Helper function to get authenticated client
 */
async function getAuthenticatedClient(context: any) {
    const credentials = await context.getCredentials('tumblrOAuth2Api');
    const authenticator = new TumblrAuthenticator();
    return await authenticator.authenticate({ data: credentials } as ICredentialsDecrypted);
}

/**
 * Search for blogs by name or title
 */
export async function searchBlogs(
    this: any,
    filter?: string,
    paginationToken?: string
): Promise<INodeListSearchResult> {
    const searchTerm = filter?.toLowerCase().trim() || '';
    const cacheKey = `blogs_${searchTerm}_${paginationToken || ''}`;

    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const client = await getAuthenticatedClient(this);

        // Get user's blogs first
        const userInfo = await client.userInfo();
        const userData = userInfo.response || userInfo;
        const userBlogs = userData.user?.blogs || [];

        // Get following blogs for broader search
        let followingBlogs: any[] = [];
        try {
            const following = await client.userFollowing({ limit: 100 });
            const followingData = following.response || following;
            followingBlogs = followingData.blogs || [];
        } catch (error) {
            console.warn('Could not load following blogs for search:', error);
        }

        // Combine all blogs
        const allBlogs = [...userBlogs, ...followingBlogs];

        // Filter blogs based on search term
        let filteredBlogs = allBlogs;
        if (searchTerm) {
            filteredBlogs = allBlogs.filter(blog => {
                const name = (blog.name || '').toLowerCase();
                const title = (blog.title || '').toLowerCase();
                const description = (blog.description || '').toLowerCase();

                return name.includes(searchTerm) ||
                    title.includes(searchTerm) ||
                    description.includes(searchTerm);
            });
        }

        // Remove duplicates based on blog name
        const uniqueBlogs = filteredBlogs.filter((blog, index, self) =>
            index === self.findIndex(b => b.name === blog.name)
        );

        // Sort by relevance (exact matches first, then partial matches)
        uniqueBlogs.sort((a, b) => {
            if (!searchTerm) return a.name.localeCompare(b.name);

            const aName = (a.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();
            const aTitle = (a.title || '').toLowerCase();
            const bTitle = (b.title || '').toLowerCase();

            // Exact name matches first
            if (aName === searchTerm && bName !== searchTerm) return -1;
            if (bName === searchTerm && aName !== searchTerm) return 1;

            // Name starts with search term
            if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1;
            if (bName.startsWith(searchTerm) && !aName.startsWith(searchTerm)) return 1;

            // Title exact matches
            if (aTitle === searchTerm && bTitle !== searchTerm) return -1;
            if (bTitle === searchTerm && aTitle !== searchTerm) return 1;

            // Title starts with search term
            if (aTitle.startsWith(searchTerm) && !bTitle.startsWith(searchTerm)) return -1;
            if (bTitle.startsWith(searchTerm) && !aTitle.startsWith(searchTerm)) return 1;

            // Alphabetical order for remaining
            return aName.localeCompare(bName);
        });

        // Implement pagination
        const pageSize = 20;
        const startIndex = paginationToken ? parseInt(paginationToken, 10) : 0;
        const endIndex = startIndex + pageSize;
        const paginatedBlogs = uniqueBlogs.slice(startIndex, endIndex);

        // Convert to search result format
        const results: INodeListSearchItems[] = paginatedBlogs.map(blog => {
            const title = blog.title || blog.name;
            const displayName = blog.name !== title ? `${title} (${blog.name})` : title;
            const description = blog.description ?
                (blog.description.length > 100 ?
                    `${blog.description.substring(0, 100)}...` :
                    blog.description) :
                `Blog with ${blog.posts || 0} posts`;

            return {
                name: displayName,
                value: blog.name,
                description,
                url: blog.url || `https://${blog.name}.tumblr.com`,
            };
        });

        const result: INodeListSearchResult = {
            results,
            paginationToken: endIndex < uniqueBlogs.length ? endIndex.toString() : undefined,
        };

        // Cache the results
        searchCache.set(cacheKey, result);

        return result;
    } catch (error) {
        console.error('Failed to search blogs:', error);
        return {
            results: [],
        };
    }
}

/**
 * Search for posts within a specific blog
 */
export async function searchBlogPosts(
    this: any,
    filter?: string,
    paginationToken?: string
): Promise<INodeListSearchResult> {
    const searchTerm = filter?.toLowerCase().trim() || '';

    try {
        const client = await getAuthenticatedClient(this);

        // Get the blog name from current parameters
        const blogName = this.getCurrentNodeParameter('blogName') as string;
        if (!blogName) {
            return { results: [] };
        }

        const cacheKey = `posts_${blogName}_${searchTerm}_${paginationToken || ''}`;

        // Check cache first
        const cached = searchCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Get posts from the blog
        const offset = paginationToken ? parseInt(paginationToken, 10) : 0;
        const posts = await client.blogPosts(blogName, {
            limit: 50,
            offset,
            filter: 'text' // Get text content for searching
        });
        const postsData = posts.response || posts;
        const blogPosts = postsData.posts || [];

        // Filter posts based on search term
        let filteredPosts = blogPosts;
        if (searchTerm) {
            filteredPosts = blogPosts.filter((post: any) => {
                const title = (post.title || '').toLowerCase();
                const body = (post.body || '').toLowerCase();
                const caption = (post.caption || '').toLowerCase();
                const summary = (post.summary || '').toLowerCase();
                const quote = (post.quote || '').toLowerCase();
                const source = (post.source || '').toLowerCase();
                const tags = (post.tags || []).join(' ').toLowerCase();

                return title.includes(searchTerm) ||
                    body.includes(searchTerm) ||
                    caption.includes(searchTerm) ||
                    summary.includes(searchTerm) ||
                    quote.includes(searchTerm) ||
                    source.includes(searchTerm) ||
                    tags.includes(searchTerm);
            });
        }

        // Sort by relevance and date
        filteredPosts.sort((a: any, b: any) => {
            if (!searchTerm) {
                // Sort by timestamp (newest first) if no search term
                return (b.timestamp || 0) - (a.timestamp || 0);
            }

            // Calculate relevance score
            const getRelevanceScore = (post: any): number => {
                let score = 0;
                const title = (post.title || '').toLowerCase();
                const body = (post.body || '').toLowerCase();
                const tags = (post.tags || []).join(' ').toLowerCase();

                // Title matches are most important
                if (title.includes(searchTerm)) score += 10;
                if (title.startsWith(searchTerm)) score += 5;

                // Tag matches are also important
                if (tags.includes(searchTerm)) score += 8;

                // Body matches
                if (body.includes(searchTerm)) score += 3;

                return score;
            };

            const scoreA = getRelevanceScore(a);
            const scoreB = getRelevanceScore(b);

            if (scoreA !== scoreB) {
                return scoreB - scoreA; // Higher score first
            }

            // If same relevance, sort by date (newest first)
            return (b.timestamp || 0) - (a.timestamp || 0);
        });

        // Convert to search result format
        const results: INodeListSearchItems[] = filteredPosts.map((post: any) => {
            const title = post.title || post.summary || `${post.type} post`;
            const truncatedTitle = title.length > 60 ? `${title.substring(0, 60)}...` : title;

            const date = post.date ? new Date(post.date).toLocaleDateString() : '';
            const displayName = `${truncatedTitle} (${post.type} • ${date})`;

            let description = '';
            if (post.body) {
                description = post.body.length > 150 ?
                    `${post.body.substring(0, 150)}...` :
                    post.body;
            } else if (post.caption) {
                description = post.caption.length > 150 ?
                    `${post.caption.substring(0, 150)}...` :
                    post.caption;
            } else if (post.quote) {
                description = `"${post.quote}"`;
            } else {
                description = `${post.type} post with ${post.note_count || 0} notes`;
            }

            return {
                name: displayName,
                value: post.id,
                description,
                url: post.post_url,
            };
        });

        const result: INodeListSearchResult = {
            results: results.slice(0, 20), // Limit to 20 results per page
            paginationToken: blogPosts.length === 50 ?
                (offset + 50).toString() : undefined,
        };

        // Cache the results
        searchCache.set(cacheKey, result);

        return result;
    } catch (error) {
        console.error('Failed to search blog posts:', error);
        return {
            results: [],
        };
    }
}

/**
 * Search for tags with autocomplete functionality
 */
export async function searchTags(
    this: any,
    filter?: string,
    paginationToken?: string
): Promise<INodeListSearchResult> {
    const searchTerm = filter?.toLowerCase().trim() || '';
    const cacheKey = `tags_${searchTerm}_${paginationToken || ''}`;

    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const client = await getAuthenticatedClient(this);

        // Get user's blogs to extract tags
        const userInfo = await client.userInfo();
        const userData = userInfo.response || userInfo;
        const blogs = userData.user?.blogs || [];

        const tagCounts: { [tag: string]: number } = {};
        const tagPosts: { [tag: string]: any[] } = {};

        // Collect tags from user's blogs
        for (const blog of blogs.slice(0, 3)) { // Limit to first 3 blogs for performance
            try {
                const posts = await client.blogPosts(blog.name, { limit: 100 });
                const postsData = posts.response || posts;
                const blogPosts = postsData.posts || [];

                blogPosts.forEach((post: any) => {
                    if (post.tags && Array.isArray(post.tags)) {
                        post.tags.forEach((tag: string) => {
                            const normalizedTag = tag.toLowerCase().trim();
                            if (normalizedTag.length > 0) {
                                tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
                                if (!tagPosts[normalizedTag]) {
                                    tagPosts[normalizedTag] = [];
                                }
                                tagPosts[normalizedTag].push(post);
                            }
                        });
                    }
                });
            } catch (error) {
                console.warn(`Failed to load posts from blog ${blog.name}:`, error);
            }
        }

        // Filter tags based on search term
        let filteredTags = Object.keys(tagCounts);
        if (searchTerm) {
            filteredTags = filteredTags.filter(tag =>
                tag.includes(searchTerm) || tag.startsWith(searchTerm)
            );
        }

        // Sort by relevance and frequency
        filteredTags.sort((a, b) => {
            if (searchTerm) {
                // Exact matches first
                if (a === searchTerm && b !== searchTerm) return -1;
                if (b === searchTerm && a !== searchTerm) return 1;

                // Starts with search term
                if (a.startsWith(searchTerm) && !b.startsWith(searchTerm)) return -1;
                if (b.startsWith(searchTerm) && !a.startsWith(searchTerm)) return 1;
            }

            // Sort by frequency (most used first)
            return tagCounts[b] - tagCounts[a];
        });

        // Add popular general tags if search term is provided but few results found
        if (searchTerm && filteredTags.length < 5) {
            const popularTags = [
                'photography', 'art', 'aesthetic', 'nature', 'music', 'fashion',
                'design', 'inspiration', 'creative', 'lifestyle', 'travel', 'food',
                'vintage', 'minimalist', 'dark academia', 'cottagecore', 'anime',
                'books', 'poetry', 'quotes', 'motivation', 'selfcare', 'mental health'
            ];

            popularTags.forEach(tag => {
                if (tag.includes(searchTerm) && !filteredTags.includes(tag)) {
                    filteredTags.push(tag);
                }
            });
        }

        // Implement pagination
        const pageSize = 20;
        const startIndex = paginationToken ? parseInt(paginationToken, 10) : 0;
        const endIndex = startIndex + pageSize;
        const paginatedTags = filteredTags.slice(startIndex, endIndex);

        // Convert to search result format
        const results: INodeListSearchItems[] = paginatedTags.map(tag => {
            const count = tagCounts[tag] || 0;
            const isUserTag = count > 0;

            return {
                name: `#${tag}`,
                value: tag,
                description: isUserTag ?
                    `Used ${count} time${count !== 1 ? 's' : ''} in your posts` :
                    'Popular tag suggestion',
            };
        });

        const result: INodeListSearchResult = {
            results,
            paginationToken: endIndex < filteredTags.length ? endIndex.toString() : undefined,
        };

        // Cache the results
        searchCache.set(cacheKey, result);

        return result;
    } catch (error) {
        console.error('Failed to search tags:', error);

        // Return popular tags as fallback
        const fallbackTags = [
            'photography', 'art', 'aesthetic', 'nature', 'music', 'fashion',
            'design', 'inspiration', 'creative', 'lifestyle'
        ];

        const filteredFallback = searchTerm ?
            fallbackTags.filter(tag => tag.includes(searchTerm)) :
            fallbackTags;

        return {
            results: filteredFallback.map(tag => ({
                name: `#${tag}`,
                value: tag,
                description: 'Popular tag suggestion',
            })),
        };
    }
}

/**
 * Search for users/blogs to follow
 */
export async function searchUsers(
    this: any,
    filter?: string,
    paginationToken?: string
): Promise<INodeListSearchResult> {
    const searchTerm = filter?.toLowerCase().trim() || '';

    if (!searchTerm) {
        return { results: [] };
    }

    const cacheKey = `users_${searchTerm}_${paginationToken || ''}`;

    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const client = await getAuthenticatedClient(this);

        // Get user's following list to search within
        const following = await client.userFollowing({ limit: 200 });
        const followingData = following.response || following;
        const followingBlogs = followingData.blogs || [];

        // Filter blogs based on search term
        const filteredBlogs = followingBlogs.filter((blog: any) => {
            const name = (blog.name || '').toLowerCase();
            const title = (blog.title || '').toLowerCase();
            const description = (blog.description || '').toLowerCase();

            return name.includes(searchTerm) ||
                title.includes(searchTerm) ||
                description.includes(searchTerm);
        });

        // Sort by relevance
        filteredBlogs.sort((a: any, b: any) => {
            const aName = (a.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();
            const aTitle = (a.title || '').toLowerCase();
            const bTitle = (b.title || '').toLowerCase();

            // Exact matches first
            if (aName === searchTerm && bName !== searchTerm) return -1;
            if (bName === searchTerm && aName !== searchTerm) return 1;

            // Name starts with search term
            if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1;
            if (bName.startsWith(searchTerm) && !aName.startsWith(searchTerm)) return 1;

            // Title matches
            if (aTitle.includes(searchTerm) && !bTitle.includes(searchTerm)) return -1;
            if (bTitle.includes(searchTerm) && !aTitle.includes(searchTerm)) return 1;

            return aName.localeCompare(bName);
        });

        // Implement pagination
        const pageSize = 15;
        const startIndex = paginationToken ? parseInt(paginationToken, 10) : 0;
        const endIndex = startIndex + pageSize;
        const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex);

        // Convert to search result format
        const results: INodeListSearchItems[] = paginatedBlogs.map((blog: any) => {
            const title = blog.title || blog.name;
            const displayName = blog.name !== title ? `${title} (@${blog.name})` : title;
            const description = blog.description ?
                (blog.description.length > 120 ?
                    `${blog.description.substring(0, 120)}...` :
                    blog.description) :
                `${blog.posts || 0} posts`;

            return {
                name: displayName,
                value: blog.name,
                description,
                url: blog.url || `https://${blog.name}.tumblr.com`,
            };
        });

        const result: INodeListSearchResult = {
            results,
            paginationToken: endIndex < filteredBlogs.length ? endIndex.toString() : undefined,
        };

        // Cache the results
        searchCache.set(cacheKey, result);

        return result;
    } catch (error) {
        console.error('Failed to search users:', error);
        return {
            results: [],
        };
    }
}

/**
 * Clear search cache (useful for testing or manual cache invalidation)
 */
export function clearSearchCache(): void {
    searchCache.clear();
}

/**
 * Get search cache statistics for monitoring
 */
export function getSearchCacheStats(): { keys: string[]; size: number } {
    const cache = (searchCache as any).cache;
    return {
        keys: Object.keys(cache),
        size: Object.keys(cache).length,
    };
}