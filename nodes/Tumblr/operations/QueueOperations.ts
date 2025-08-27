import { IDataObject, NodeOperationError } from 'n8n-workflow';
import { TumblrClient } from '../TumblrAuthenticator';
import { PostOperations } from './PostOperations';

export class QueueOperations {
    private postOps: PostOperations;

    constructor() {
        this.postOps = new PostOperations();
    }

    /**
     * Add a post to the queue
     */
    async addToQueue(
        client: TumblrClient,
        blogName: string,
        params: IDataObject
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            // Prepare queue parameters by setting state to 'queue'
            const queueParams = {
                ...params,
                state: 'queue',
                publishOn: params.publishOn || params.scheduleTime || undefined,
            };

            // Determine post type and create accordingly
            const postType = params.type as string || 'text';

            let response: IDataObject;

            switch (postType) {
                case 'text':
                    response = await this.postOps.createTextPost(client, cleanBlogName, queueParams);
                    break;
                case 'photo':
                    response = await this.postOps.createPhotoPost(client, cleanBlogName, queueParams);
                    break;
                case 'quote':
                    response = await this.postOps.createQuotePost(client, cleanBlogName, queueParams);
                    break;
                case 'link':
                    response = await this.postOps.createLinkPost(client, cleanBlogName, queueParams);
                    break;
                case 'chat':
                    response = await this.postOps.createChatPost(client, cleanBlogName, queueParams);
                    break;
                case 'video':
                    response = await this.postOps.createVideoPost(client, cleanBlogName, queueParams);
                    break;
                case 'audio':
                    response = await this.postOps.createAudioPost(client, cleanBlogName, queueParams);
                    break;
                default:
                    throw new NodeOperationError(
                        { message: 'Invalid post type' } as any,
                        `Unknown post type: ${postType}`
                    );
            }

            return {
                ...response,
                operation: 'addToQueue',
                queue_status: 'added',
                scheduled_time: queueParams.publishOn || null,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to add to queue' } as any,
                `Could not add post to queue: ${errorMessage}`
            );
        }
    }

    /**
     * Get queue posts
     */
    async getQueue(
        client: TumblrClient,
        blogName: string,
        options: IDataObject = {}
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            // Prepare queue options
            const queueOptions = {
                limit: Math.min(Number(options.limit) || 20, 50), // Tumblr API limit
                offset: Number(options.offset) || 0,
                filter: options.filter as string || 'text',
            };

            const response = await client.blogQueue(cleanBlogName, queueOptions);

            // Extract queue data
            const responseData = response.response || response;
            const posts = responseData.posts || [];

            return {
                queue_posts: posts.map((post: any) => this.formatQueuePost(post)),
                total_posts: posts.length,
                blog: responseData.blog || { name: cleanBlogName },
                pagination: {
                    limit: queueOptions.limit,
                    offset: queueOptions.offset,
                    has_more: posts.length === queueOptions.limit,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to get queue' } as any,
                `Could not retrieve queue for blog ${blogName}: ${errorMessage}`
            );
        }
    }

    /**
     * Remove a post from the queue (delete queued post)
     */
    async removeFromQueue(
        client: TumblrClient,
        blogName: string,
        postId: string
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            if (!postId) {
                throw new NodeOperationError(
                    { message: 'Missing post ID' } as any,
                    'Post ID is required to remove from queue'
                );
            }

            // Use the post operations delete method
            const response = await this.postOps.deletePost(client, cleanBlogName, postId);

            return {
                ...response,
                operation: 'removeFromQueue',
                queue_status: 'removed',
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to remove from queue' } as any,
                `Could not remove post ${postId} from queue: ${errorMessage}`
            );
        }
    }

    /**
     * Reorder queue posts
     */
    async reorderQueue(
        client: TumblrClient,
        blogName: string,
        postIds: string[]
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
                throw new NodeOperationError(
                    { message: 'Invalid post IDs' } as any,
                    'Array of post IDs is required for reordering'
                );
            }

            // Note: Tumblr API doesn't have a direct reorder endpoint
            // This would typically require updating each post's publish time
            // For now, we'll return a placeholder response

            return {
                success: true,
                operation: 'reorderQueue',
                message: 'Queue reordering is not directly supported by Tumblr API. Consider updating individual post publish times.',
                blog_name: cleanBlogName,
                post_ids: postIds,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to reorder queue' } as any,
                `Could not reorder queue: ${errorMessage}`
            );
        }
    }

    /**
     * Update queue post scheduling
     */
    async updateQueueSchedule(
        client: TumblrClient,
        blogName: string,
        postId: string,
        scheduleTime: string
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            if (!postId) {
                throw new NodeOperationError(
                    { message: 'Missing post ID' } as any,
                    'Post ID is required to update schedule'
                );
            }

            if (!scheduleTime) {
                throw new NodeOperationError(
                    { message: 'Missing schedule time' } as any,
                    'Schedule time is required'
                );
            }

            // Update the post with new schedule time
            const updateParams = {
                date: scheduleTime,
                state: 'queue', // Ensure it stays in queue
            };

            const response = await this.postOps.updatePost(client, cleanBlogName, postId, updateParams);

            return {
                ...response,
                operation: 'updateQueueSchedule',
                scheduled_time: scheduleTime,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to update queue schedule' } as any,
                `Could not update schedule for post ${postId}: ${errorMessage}`
            );
        }
    }

    /**
     * Get queue statistics
     */
    async getQueueStats(
        client: TumblrClient,
        blogName: string
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            // Get queue posts to calculate statistics
            const queueResponse = await this.getQueue(client, cleanBlogName, { limit: 50 });
            const posts = queueResponse.queue_posts as any[] || [];

            // Calculate statistics
            const stats = {
                total_queued: posts.length,
                by_type: this.calculatePostTypeStats(posts),
                next_scheduled: this.getNextScheduledPost(posts),
                blog_name: cleanBlogName,
                timestamp: new Date().toISOString(),
            };

            return stats;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to get queue stats' } as any,
                `Could not retrieve queue statistics: ${errorMessage}`
            );
        }
    }

    /**
     * Format queue post for consistent output
     */
    private formatQueuePost(post: any): IDataObject {
        return {
            id: post.id,
            type: post.type,
            blog_name: post.blog_name,
            state: post.state,
            scheduled_publish_time: post.scheduled_publish_time || post.date,
            tags: post.tags || [],

            // Type-specific content preview
            title: post.title,
            body: post.body ? post.body.substring(0, 200) + (post.body.length > 200 ? '...' : '') : undefined,
            caption: post.caption ? post.caption.substring(0, 200) + (post.caption.length > 200 ? '...' : '') : undefined,
            quote: post.quote,
            source: post.source,
            url: post.url,
            description: post.description,

            // Metadata
            timestamp: post.timestamp,
            format: post.format,
            slug: post.slug,
        };
    }

    /**
     * Calculate post type statistics
     */
    private calculatePostTypeStats(posts: any[]): IDataObject {
        const stats: IDataObject = {};

        posts.forEach(post => {
            const type = post.type || 'unknown';
            stats[type] = (stats[type] as number || 0) + 1;
        });

        return stats;
    }

    /**
     * Get next scheduled post
     */
    private getNextScheduledPost(posts: any[]): IDataObject | null {
        const scheduledPosts = posts
            .filter(post => post.scheduled_publish_time)
            .sort((a, b) => new Date(a.scheduled_publish_time).getTime() - new Date(b.scheduled_publish_time).getTime());

        if (scheduledPosts.length === 0) {
            return null;
        }

        const nextPost = scheduledPosts[0];
        return {
            id: nextPost.id,
            type: nextPost.type,
            scheduled_time: nextPost.scheduled_publish_time,
            title: nextPost.title || nextPost.caption || 'Untitled',
        };
    }

    /**
     * Clean blog name by removing .tumblr.com suffix if present
     */
    private cleanBlogName(blogName: string): string {
        return blogName.replace(/\.tumblr\.com$/, '');
    }
}