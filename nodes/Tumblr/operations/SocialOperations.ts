import { IDataObject, NodeOperationError } from 'n8n-workflow';
import { TumblrClient } from '../TumblrAuthenticator';

export class SocialOperations {
    /**
     * Like a post
     */
    async likePost(
        client: TumblrClient,
        postId: string,
        reblogKey: string
    ): Promise<IDataObject> {
        try {
            if (!postId || !reblogKey) {
                throw new NodeOperationError(
                    { message: 'Missing parameters' } as any,
                    'Post ID and reblog key are required to like a post'
                );
            }

            const response = await client.likePost(postId, reblogKey);

            return {
                success: true,
                operation: 'like',
                post_id: postId,
                reblog_key: reblogKey,
                timestamp: new Date().toISOString(),
                response: response,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to like post' } as any,
                `Could not like post ${postId}: ${errorMessage}`
            );
        }
    }

    /**
     * Unlike a post
     */
    async unlikePost(
        client: TumblrClient,
        postId: string,
        reblogKey: string
    ): Promise<IDataObject> {
        try {
            if (!postId || !reblogKey) {
                throw new NodeOperationError(
                    { message: 'Missing parameters' } as any,
                    'Post ID and reblog key are required to unlike a post'
                );
            }

            const response = await client.unlikePost(postId, reblogKey);

            return {
                success: true,
                operation: 'unlike',
                post_id: postId,
                reblog_key: reblogKey,
                timestamp: new Date().toISOString(),
                response: response,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to unlike post' } as any,
                `Could not unlike post ${postId}: ${errorMessage}`
            );
        }
    }

    /**
     * Follow a blog
     */
    async followBlog(
        client: TumblrClient,
        blogName: string
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            if (!cleanBlogName) {
                throw new NodeOperationError(
                    { message: 'Missing blog name' } as any,
                    'Blog name is required to follow a blog'
                );
            }

            const response = await client.followBlog(cleanBlogName);

            return {
                success: true,
                operation: 'follow',
                blog_name: cleanBlogName,
                timestamp: new Date().toISOString(),
                response: response,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to follow blog' } as any,
                `Could not follow blog ${blogName}: ${errorMessage}`
            );
        }
    }

    /**
     * Unfollow a blog
     */
    async unfollowBlog(
        client: TumblrClient,
        blogName: string
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            if (!cleanBlogName) {
                throw new NodeOperationError(
                    { message: 'Missing blog name' } as any,
                    'Blog name is required to unfollow a blog'
                );
            }

            const response = await client.unfollowBlog(cleanBlogName);

            return {
                success: true,
                operation: 'unfollow',
                blog_name: cleanBlogName,
                timestamp: new Date().toISOString(),
                response: response,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to unfollow blog' } as any,
                `Could not unfollow blog ${blogName}: ${errorMessage}`
            );
        }
    }

    /**
     * Get user's liked posts
     */
    async getUserLikes(
        client: TumblrClient,
        options: IDataObject = {}
    ): Promise<IDataObject> {
        try {
            // Prepare likes options
            const likesOptions = {
                limit: Math.min(Number(options.limit) || 20, 50), // Tumblr API limit
                offset: Number(options.offset) || 0,
                before: options.before as string || undefined,
                after: options.after as string || undefined,
            };

            const response = await client.userLikes(likesOptions);

            // Extract likes data
            const responseData = response.response || response;
            const likedPosts = responseData.liked_posts || [];
            const likedCount = responseData.liked_count || likedPosts.length;

            return {
                liked_posts: likedPosts.map((post: any) => this.formatLikedPost(post)),
                liked_count: likedCount,
                pagination: {
                    limit: likesOptions.limit,
                    offset: likesOptions.offset,
                    has_more: likedPosts.length === likesOptions.limit,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to get user likes' } as any,
                `Could not retrieve user likes: ${errorMessage}`
            );
        }
    }

    /**
     * Get user's following list
     */
    async getUserFollowing(
        client: TumblrClient,
        options: IDataObject = {}
    ): Promise<IDataObject> {
        try {
            // Prepare following options
            const followingOptions = {
                limit: Math.min(Number(options.limit) || 20, 20), // Tumblr API limit for following
                offset: Number(options.offset) || 0,
            };

            const response = await client.userFollowing(followingOptions);

            // Extract following data
            const responseData = response.response || response;
            const blogs = responseData.blogs || [];
            const totalBlogs = responseData.total_blogs || blogs.length;

            return {
                following_blogs: blogs.map((blog: any) => this.formatFollowingBlog(blog)),
                total_blogs: totalBlogs,
                pagination: {
                    limit: followingOptions.limit,
                    offset: followingOptions.offset,
                    has_more: blogs.length === followingOptions.limit,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to get user following' } as any,
                `Could not retrieve user following list: ${errorMessage}`
            );
        }
    }

    /**
     * Get user dashboard
     */
    async getUserDashboard(
        client: TumblrClient,
        options: IDataObject = {}
    ): Promise<IDataObject> {
        try {
            // Prepare dashboard options
            const dashboardOptions = {
                limit: Math.min(Number(options.limit) || 20, 20), // Tumblr API limit
                offset: Number(options.offset) || 0,
                type: options.type as string || undefined,
                since_id: options.sinceId as string || undefined,
                reblog_info: Boolean(options.reblogInfo) || false,
                notes_info: Boolean(options.notesInfo) || false,
            };

            const response = await client.userDashboard(dashboardOptions);

            // Extract dashboard data
            const responseData = response.response || response;
            const posts = responseData.posts || [];

            return {
                dashboard_posts: posts.map((post: any) => this.formatDashboardPost(post)),
                total_posts: posts.length,
                pagination: {
                    limit: dashboardOptions.limit,
                    offset: dashboardOptions.offset,
                    has_more: posts.length === dashboardOptions.limit,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to get user dashboard' } as any,
                `Could not retrieve user dashboard: ${errorMessage}`
            );
        }
    }

    /**
     * Batch like multiple posts
     */
    async batchLikePosts(
        client: TumblrClient,
        posts: Array<{ postId: string; reblogKey: string }>
    ): Promise<IDataObject> {
        try {
            if (!posts || !Array.isArray(posts) || posts.length === 0) {
                throw new NodeOperationError(
                    { message: 'Invalid posts array' } as any,
                    'Array of posts with postId and reblogKey is required'
                );
            }

            const results = [];
            const errors = [];

            // Process each post
            for (const post of posts) {
                try {
                    const result = await this.likePost(client, post.postId, post.reblogKey);
                    results.push(result);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    errors.push({
                        post_id: post.postId,
                        error: errorMessage,
                    });
                }
            }

            return {
                success: true,
                operation: 'batchLike',
                total_posts: posts.length,
                successful: results.length,
                failed: errors.length,
                results: results,
                errors: errors,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to batch like posts' } as any,
                `Could not batch like posts: ${errorMessage}`
            );
        }
    }

    /**
     * Batch follow multiple blogs
     */
    async batchFollowBlogs(
        client: TumblrClient,
        blogNames: string[]
    ): Promise<IDataObject> {
        try {
            if (!blogNames || !Array.isArray(blogNames) || blogNames.length === 0) {
                throw new NodeOperationError(
                    { message: 'Invalid blog names array' } as any,
                    'Array of blog names is required'
                );
            }

            const results = [];
            const errors = [];

            // Process each blog
            for (const blogName of blogNames) {
                try {
                    const result = await this.followBlog(client, blogName);
                    results.push(result);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    errors.push({
                        blog_name: blogName,
                        error: errorMessage,
                    });
                }
            }

            return {
                success: true,
                operation: 'batchFollow',
                total_blogs: blogNames.length,
                successful: results.length,
                failed: errors.length,
                results: results,
                errors: errors,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to batch follow blogs' } as any,
                `Could not batch follow blogs: ${errorMessage}`
            );
        }
    }

    /**
     * Format liked post for consistent output
     */
    private formatLikedPost(post: any): IDataObject {
        return {
            id: post.id,
            type: post.type,
            blog_name: post.blog_name,
            post_url: post.post_url,
            liked_timestamp: post.liked_timestamp,
            tags: post.tags || [],

            // Content preview
            title: post.title,
            body: post.body ? post.body.substring(0, 200) + (post.body.length > 200 ? '...' : '') : undefined,
            caption: post.caption ? post.caption.substring(0, 200) + (post.caption.length > 200 ? '...' : '') : undefined,
            quote: post.quote,
            source: post.source,
            url: post.url,

            // Metadata
            note_count: post.note_count || 0,
            reblog_key: post.reblog_key,
        };
    }

    /**
     * Format following blog for consistent output
     */
    private formatFollowingBlog(blog: any): IDataObject {
        return {
            name: blog.name,
            title: blog.title,
            description: blog.description,
            url: blog.url,
            uuid: blog.uuid,
            updated: blog.updated,
            posts: blog.posts,
            followers: blog.followers,
            is_nsfw: blog.is_nsfw,
            share_likes: blog.share_likes,
            share_following: blog.share_following,
            can_be_followed: blog.can_be_followed,
        };
    }

    /**
     * Format dashboard post for consistent output
     */
    private formatDashboardPost(post: any): IDataObject {
        return {
            id: post.id,
            type: post.type,
            blog_name: post.blog_name,
            post_url: post.post_url,
            timestamp: post.timestamp,
            date: post.date,
            tags: post.tags || [],
            state: post.state,
            note_count: post.note_count || 0,

            // Content
            title: post.title,
            body: post.body,
            caption: post.caption,
            quote: post.quote,
            source: post.source,
            url: post.url,
            description: post.description,

            // Reblog information
            reblog_key: post.reblog_key,
            reblogged_from_name: post.reblogged_from_name,
            reblogged_from_title: post.reblogged_from_title,
            reblogged_root_name: post.reblogged_root_name,
            reblogged_root_title: post.reblogged_root_title,

            // Media indicators
            has_photos: Boolean(post.photos && post.photos.length > 0),
            has_video: Boolean(post.video_url),
            has_audio: Boolean(post.audio_url),
        };
    }

    /**
     * Clean blog name by removing .tumblr.com suffix if present
     */
    private cleanBlogName(blogName: string): string {
        return blogName.replace(/\.tumblr\.com$/, '');
    }
}