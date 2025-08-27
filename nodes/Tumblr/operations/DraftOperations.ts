import { IDataObject, NodeOperationError } from 'n8n-workflow';
import { TumblrClient } from '../TumblrAuthenticator';
import { PostOperations } from './PostOperations';

export class DraftOperations {
    private postOps: PostOperations;

    constructor() {
        this.postOps = new PostOperations();
    }

    /**
     * Create a draft post
     */
    async createDraft(
        client: TumblrClient,
        blogName: string,
        params: IDataObject
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            // Prepare draft parameters by setting state to 'draft'
            const draftParams = {
                ...params,
                state: 'draft',
            };

            // Determine post type and create accordingly
            const postType = params.type as string || 'text';

            let response: IDataObject;

            switch (postType) {
                case 'text':
                    response = await this.postOps.createTextPost(client, cleanBlogName, draftParams);
                    break;
                case 'photo':
                    response = await this.postOps.createPhotoPost(client, cleanBlogName, draftParams);
                    break;
                case 'quote':
                    response = await this.postOps.createQuotePost(client, cleanBlogName, draftParams);
                    break;
                case 'link':
                    response = await this.postOps.createLinkPost(client, cleanBlogName, draftParams);
                    break;
                case 'chat':
                    response = await this.postOps.createChatPost(client, cleanBlogName, draftParams);
                    break;
                case 'video':
                    response = await this.postOps.createVideoPost(client, cleanBlogName, draftParams);
                    break;
                case 'audio':
                    response = await this.postOps.createAudioPost(client, cleanBlogName, draftParams);
                    break;
                default:
                    throw new NodeOperationError(
                        { message: 'Invalid post type' } as any,
                        `Unknown post type: ${postType}`
                    );
            }

            return {
                ...response,
                operation: 'createDraft',
                draft_status: 'created',
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to create draft' } as any,
                `Could not create draft: ${errorMessage}`
            );
        }
    }

    /**
     * Get draft posts
     */
    async getDrafts(
        client: TumblrClient,
        blogName: string,
        options: IDataObject = {}
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            // Prepare draft options
            const draftOptions = {
                limit: Math.min(Number(options.limit) || 20, 50), // Tumblr API limit
                offset: Number(options.offset) || 0,
                filter: options.filter as string || 'text',
            };

            const response = await client.blogDrafts(cleanBlogName, draftOptions);

            // Extract draft data
            const responseData = response.response || response;
            const posts = responseData.posts || [];

            return {
                draft_posts: posts.map((post: any) => this.formatDraftPost(post)),
                total_drafts: posts.length,
                blog: responseData.blog || { name: cleanBlogName },
                pagination: {
                    limit: draftOptions.limit,
                    offset: draftOptions.offset,
                    has_more: posts.length === draftOptions.limit,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to get drafts' } as any,
                `Could not retrieve drafts for blog ${blogName}: ${errorMessage}`
            );
        }
    }

    /**
     * Update a draft post
     */
    async updateDraft(
        client: TumblrClient,
        blogName: string,
        postId: string,
        params: IDataObject
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            if (!postId) {
                throw new NodeOperationError(
                    { message: 'Missing post ID' } as any,
                    'Post ID is required to update draft'
                );
            }

            // Ensure the post remains a draft unless explicitly changed
            const updateParams = {
                ...params,
                state: params.state || 'draft',
            };

            const response = await this.postOps.updatePost(client, cleanBlogName, postId, updateParams);

            return {
                ...response,
                operation: 'updateDraft',
                draft_status: 'updated',
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to update draft' } as any,
                `Could not update draft ${postId}: ${errorMessage}`
            );
        }
    }

    /**
     * Delete a draft post
     */
    async deleteDraft(
        client: TumblrClient,
        blogName: string,
        postId: string
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            if (!postId) {
                throw new NodeOperationError(
                    { message: 'Missing post ID' } as any,
                    'Post ID is required to delete draft'
                );
            }

            const response = await this.postOps.deletePost(client, cleanBlogName, postId);

            return {
                ...response,
                operation: 'deleteDraft',
                draft_status: 'deleted',
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to delete draft' } as any,
                `Could not delete draft ${postId}: ${errorMessage}`
            );
        }
    }

    /**
     * Publish a draft post
     */
    async publishDraft(
        client: TumblrClient,
        blogName: string,
        postId: string,
        publishOptions: IDataObject = {}
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            if (!postId) {
                throw new NodeOperationError(
                    { message: 'Missing post ID' } as any,
                    'Post ID is required to publish draft'
                );
            }

            // Prepare publish parameters
            const publishParams = {
                state: 'published',
                date: publishOptions.publishOn as string || undefined,
                tags: publishOptions.tags || undefined,
            };

            // Remove undefined values
            Object.keys(publishParams).forEach(key => {
                if (publishParams[key as keyof typeof publishParams] === undefined) {
                    delete publishParams[key as keyof typeof publishParams];
                }
            });

            const response = await this.postOps.updatePost(client, cleanBlogName, postId, publishParams);

            return {
                ...response,
                operation: 'publishDraft',
                draft_status: 'published',
                published_at: publishParams.date || new Date().toISOString(),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to publish draft' } as any,
                `Could not publish draft ${postId}: ${errorMessage}`
            );
        }
    }

    /**
     * Get a specific draft
     */
    async getDraft(
        client: TumblrClient,
        blogName: string,
        postId: string
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            if (!postId) {
                throw new NodeOperationError(
                    { message: 'Missing post ID' } as any,
                    'Post ID is required to get draft'
                );
            }

            // Get the specific draft using post operations
            const response = await this.postOps.getPost(client, cleanBlogName, postId);

            // Verify it's actually a draft
            const post = response.post as any;
            if (post.state !== 'draft') {
                throw new NodeOperationError(
                    { message: 'Not a draft' } as any,
                    `Post ${postId} is not a draft (state: ${post.state})`
                );
            }

            return {
                draft: this.formatDraftPost(post),
                blog: response.blog,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to get draft' } as any,
                `Could not retrieve draft ${postId}: ${errorMessage}`
            );
        }
    }

    /**
     * Duplicate a draft
     */
    async duplicateDraft(
        client: TumblrClient,
        blogName: string,
        postId: string,
        modifications: IDataObject = {}
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            if (!postId) {
                throw new NodeOperationError(
                    { message: 'Missing post ID' } as any,
                    'Post ID is required to duplicate draft'
                );
            }

            // Get the original draft
            const originalDraft = await this.getDraft(client, cleanBlogName, postId);
            const draftData = originalDraft.draft as any;

            // Prepare new draft parameters
            const newDraftParams = {
                type: draftData.type,
                title: modifications.title || draftData.title,
                body: modifications.body || draftData.body,
                caption: modifications.caption || draftData.caption,
                quote: modifications.quote || draftData.quote,
                source: modifications.source || draftData.source,
                url: modifications.url || draftData.url,
                description: modifications.description || draftData.description,
                conversation: modifications.conversation || draftData.conversation,
                tags: modifications.tags || draftData.tags,
                format: modifications.format || draftData.format,
                ...modifications,
            };

            // Remove undefined values
            Object.keys(newDraftParams).forEach(key => {
                if (newDraftParams[key as keyof typeof newDraftParams] === undefined) {
                    delete newDraftParams[key as keyof typeof newDraftParams];
                }
            });

            // Create the duplicate draft
            const response = await this.createDraft(client, cleanBlogName, newDraftParams);

            return {
                ...response,
                operation: 'duplicateDraft',
                original_post_id: postId,
                draft_status: 'duplicated',
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to duplicate draft' } as any,
                `Could not duplicate draft ${postId}: ${errorMessage}`
            );
        }
    }

    /**
     * Get draft statistics
     */
    async getDraftStats(
        client: TumblrClient,
        blogName: string
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            // Get all drafts to calculate statistics
            const draftsResponse = await this.getDrafts(client, cleanBlogName, { limit: 50 });
            const drafts = draftsResponse.draft_posts as any[] || [];

            // Calculate statistics
            const stats = {
                total_drafts: drafts.length,
                by_type: this.calculatePostTypeStats(drafts),
                oldest_draft: this.getOldestDraft(drafts),
                newest_draft: this.getNewestDraft(drafts),
                blog_name: cleanBlogName,
                timestamp: new Date().toISOString(),
            };

            return stats;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to get draft stats' } as any,
                `Could not retrieve draft statistics: ${errorMessage}`
            );
        }
    }

    /**
     * Format draft post for consistent output
     */
    private formatDraftPost(post: any): IDataObject {
        return {
            id: post.id,
            type: post.type,
            blog_name: post.blog_name,
            state: post.state,
            created_at: post.timestamp ? new Date(post.timestamp * 1000).toISOString() : undefined,
            tags: post.tags || [],

            // Type-specific content
            title: post.title,
            body: post.body,
            caption: post.caption,
            quote: post.quote,
            source: post.source,
            url: post.url,
            description: post.description,
            conversation: post.conversation,

            // Metadata
            format: post.format,
            slug: post.slug,
            summary: post.summary,

            // Media content indicators
            has_photos: Boolean(post.photos && post.photos.length > 0),
            has_video: Boolean(post.video_url || post.embed),
            has_audio: Boolean(post.audio_url || post.audio_source_url),
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
     * Get oldest draft
     */
    private getOldestDraft(drafts: any[]): IDataObject | null {
        if (drafts.length === 0) return null;

        const oldest = drafts.reduce((prev, current) => {
            const prevTime = new Date(prev.created_at || 0).getTime();
            const currentTime = new Date(current.created_at || 0).getTime();
            return currentTime < prevTime ? current : prev;
        });

        return {
            id: oldest.id,
            type: oldest.type,
            created_at: oldest.created_at,
            title: oldest.title || oldest.caption || 'Untitled',
        };
    }

    /**
     * Get newest draft
     */
    private getNewestDraft(drafts: any[]): IDataObject | null {
        if (drafts.length === 0) return null;

        const newest = drafts.reduce((prev, current) => {
            const prevTime = new Date(prev.created_at || 0).getTime();
            const currentTime = new Date(current.created_at || 0).getTime();
            return currentTime > prevTime ? current : prev;
        });

        return {
            id: newest.id,
            type: newest.type,
            created_at: newest.created_at,
            title: newest.title || newest.caption || 'Untitled',
        };
    }

    /**
     * Clean blog name by removing .tumblr.com suffix if present
     */
    private cleanBlogName(blogName: string): string {
        return blogName.replace(/\.tumblr\.com$/, '');
    }
}