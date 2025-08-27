import { IDataObject, NodeOperationError } from 'n8n-workflow';
import { TumblrClient } from '../TumblrAuthenticator';

export class BlogOperations {
    /**
     * Get blog information including statistics and configuration
     */
    async getBlogInfo(client: TumblrClient, blogName: string): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);
            const response = await client.blogInfo(cleanBlogName);

            // Extract and format blog information
            const blogInfo = response.response?.blog || response.blog || response;

            return {
                name: blogInfo.name,
                title: blogInfo.title,
                description: blogInfo.description,
                url: blogInfo.url,
                uuid: blogInfo.uuid,
                updated: blogInfo.updated,
                posts: blogInfo.posts,
                total_posts: blogInfo.total_posts,
                followers: blogInfo.followers,
                share_likes: blogInfo.share_likes,
                share_following: blogInfo.share_following,
                can_be_followed: blogInfo.can_be_followed,
                is_nsfw: blogInfo.is_nsfw,
                theme: blogInfo.theme,
                avatar: blogInfo.avatar,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to get blog info' } as any,
                `Could not retrieve blog information for ${blogName}: ${errorMessage}`
            );
        }
    }

    /**
     * Get blog posts with filtering and pagination options
     */
    async getBlogPosts(
        client: TumblrClient,
        blogName: string,
        options: IDataObject = {}
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            // Prepare options with defaults
            const postOptions = {
                limit: Math.min(Number(options.limit) || 20, 50), // Tumblr API limit is 50
                offset: Number(options.offset) || 0,
                type: options.type as string || undefined,
                tag: options.tag as string || undefined,
                before: options.before as string || undefined,
                filter: options.filter as string || 'text',
                reblog_info: Boolean(options.reblogInfo) || false,
                notes_info: Boolean(options.notesInfo) || false,
            };

            const response = await client.blogPosts(cleanBlogName, postOptions);

            // Extract posts and metadata
            const responseData = response.response || response;
            const posts = responseData.posts || [];
            const totalPosts = responseData.total_posts || posts.length;

            return {
                posts: posts.map((post: any) => this.formatPost(post)),
                total_posts: totalPosts,
                blog: responseData.blog || { name: cleanBlogName },
                pagination: {
                    limit: postOptions.limit,
                    offset: postOptions.offset,
                    has_more: posts.length === postOptions.limit,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to get blog posts' } as any,
                `Could not retrieve posts for blog ${blogName}: ${errorMessage}`
            );
        }
    }

    /**
     * Get blog followers (if available and permitted)
     */
    async getBlogFollowers(
        client: TumblrClient,
        blogName: string,
        options: IDataObject = {}
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            // Note: Blog followers endpoint may not be available for all blogs
            // This is a placeholder implementation
            const followerOptions = {
                limit: Math.min(Number(options.limit) || 20, 20), // API limit
                offset: Number(options.offset) || 0,
            };

            // Since tumblr.js might not have a direct followers method,
            // we'll need to make a custom API call or return blog info with follower count
            const blogInfo = await this.getBlogInfo(client, cleanBlogName);

            return {
                blog_name: cleanBlogName,
                follower_count: blogInfo.followers || 0,
                message: 'Follower list access may be restricted. Only follower count is available.',
                followers: [], // Actual follower list would require special permissions
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to get blog followers' } as any,
                `Could not retrieve followers for blog ${blogName}: ${errorMessage}`
            );
        }
    }

    /**
     * Search posts within a specific blog
     */
    async searchBlogPosts(
        client: TumblrClient,
        blogName: string,
        query: string,
        options: IDataObject = {}
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            // Get posts and filter by query (client-side filtering)
            // Note: Tumblr API doesn't have built-in blog-specific search
            const postOptions = {
                limit: Math.min(Number(options.limit) || 50, 50),
                offset: Number(options.offset) || 0,
                filter: 'text', // Get full text for searching
            };

            const response = await client.blogPosts(cleanBlogName, postOptions);
            const responseData = response.response || response;
            const allPosts = responseData.posts || [];

            // Filter posts by query (case-insensitive search in title, body, caption, etc.)
            const filteredPosts = allPosts.filter((post: any) => {
                const searchableText = [
                    post.title,
                    post.body,
                    post.caption,
                    post.summary,
                    post.quote,
                    post.source,
                    ...(post.tags || []),
                ].filter(Boolean).join(' ').toLowerCase();

                return searchableText.includes(query.toLowerCase());
            });

            return {
                posts: filteredPosts.map((post: any) => this.formatPost(post)),
                total_found: filteredPosts.length,
                query,
                blog: responseData.blog || { name: cleanBlogName },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to search blog posts' } as any,
                `Could not search posts in blog ${blogName}: ${errorMessage}`
            );
        }
    }

    /**
     * Format post data for consistent output
     */
    private formatPost(post: any): IDataObject {
        return {
            id: post.id,
            type: post.type,
            blog_name: post.blog_name,
            post_url: post.post_url,
            timestamp: post.timestamp,
            date: post.date,
            tags: post.tags || [],
            state: post.state,
            format: post.format,
            reblog_key: post.reblog_key,
            slug: post.slug,
            summary: post.summary,
            note_count: post.note_count || 0,

            // Type-specific fields
            title: post.title,
            body: post.body,
            caption: post.caption,
            photos: post.photos,
            quote: post.quote,
            source: post.source,
            url: post.url,
            description: post.description,
            conversation: post.conversation,
            video_url: post.video_url,
            audio_url: post.audio_url,
            audio_source_url: post.audio_source_url,
            track_name: post.track_name,
            artist: post.artist,
            album: post.album,

            // Reblog information
            reblogged_from_id: post.reblogged_from_id,
            reblogged_from_url: post.reblogged_from_url,
            reblogged_from_name: post.reblogged_from_name,
            reblogged_from_title: post.reblogged_from_title,
            reblogged_root_id: post.reblogged_root_id,
            reblogged_root_url: post.reblogged_root_url,
            reblogged_root_name: post.reblogged_root_name,
            reblogged_root_title: post.reblogged_root_title,
        };
    }

    /**
     * Clean blog name by removing .tumblr.com suffix if present
     */
    private cleanBlogName(blogName: string): string {
        return blogName.replace(/\.tumblr\.com$/, '');
    }
}