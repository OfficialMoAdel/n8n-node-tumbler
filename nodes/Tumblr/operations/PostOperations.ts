import { IDataObject, NodeOperationError } from 'n8n-workflow';
import { TumblrClient } from '../TumblrAuthenticator';

export interface PostCreationParams {
    blogName: string;
    type: 'text' | 'photo' | 'quote' | 'link' | 'chat' | 'video' | 'audio';
    title?: string;
    body?: string;
    caption?: string;
    tags?: string[];
    state?: 'published' | 'draft' | 'queue' | 'private';
    format?: 'html' | 'markdown';
    publishOn?: string;
    slug?: string;
    // Type-specific fields
    photos?: Array<{ url: string; caption?: string; altText?: string }>;
    quote?: string;
    source?: string;
    url?: string;
    description?: string;
    conversation?: Array<{ name: string; label: string; phrase: string }>;
    videoUrl?: string;
    audioUrl?: string;
    externalUrl?: string;
    data?: any; // For file uploads
}

export class PostOperations {
    /**
     * Create a text post
     */
    async createTextPost(
        client: TumblrClient,
        blogName: string,
        params: IDataObject
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            // Validate required fields for text posts
            if (!params.title && !params.body) {
                throw new NodeOperationError(
                    { message: 'Missing content' } as any,
                    'Text posts require either a title or body content'
                );
            }

            // Prepare text post parameters
            const textPostParams = {
                title: params.title as string || '',
                body: params.body as string || '',
                tags: this.formatTags(params.tags),
                state: params.state as string || 'published',
                format: params.format as string || 'html',
                slug: params.slug as string || undefined,
                date: params.publishOn as string || undefined,
            };

            // Validate content length
            this.validateTextContent(textPostParams.title, textPostParams.body);

            const response = await client.createTextPost(cleanBlogName, textPostParams);

            return this.formatPostResponse(response, 'text');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to create text post' } as any,
                `Could not create text post: ${errorMessage}`
            );
        }
    }

    /**
     * Update an existing post
     */
    async updatePost(
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
                    'Post ID is required for update operation'
                );
            }

            // Prepare update parameters (only include provided fields)
            const updateParams: IDataObject = {};

            if (params.title !== undefined) updateParams.title = params.title;
            if (params.body !== undefined) updateParams.body = params.body;
            if (params.caption !== undefined) updateParams.caption = params.caption;
            if (params.tags !== undefined) updateParams.tags = this.formatTags(params.tags);
            if (params.state !== undefined) updateParams.state = params.state;
            if (params.format !== undefined) updateParams.format = params.format;
            if (params.slug !== undefined) updateParams.slug = params.slug;
            if (params.publishOn !== undefined) updateParams.date = params.publishOn;

            // Type-specific fields
            if (params.quote !== undefined) updateParams.quote = params.quote;
            if (params.source !== undefined) updateParams.source = params.source;
            if (params.url !== undefined) updateParams.url = params.url;
            if (params.description !== undefined) updateParams.description = params.description;
            if (params.conversation !== undefined) updateParams.conversation = params.conversation;

            const response = await client.editPost(cleanBlogName, postId, updateParams);

            return this.formatPostResponse(response, 'update');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to update post' } as any,
                `Could not update post ${postId}: ${errorMessage}`
            );
        }
    }

    /**
     * Delete a post
     */
    async deletePost(
        client: TumblrClient,
        blogName: string,
        postId: string
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            if (!postId) {
                throw new NodeOperationError(
                    { message: 'Missing post ID' } as any,
                    'Post ID is required for delete operation'
                );
            }

            const response = await client.deletePost(cleanBlogName, postId);

            return {
                success: true,
                message: 'Post deleted successfully',
                post_id: postId,
                blog_name: cleanBlogName,
                timestamp: new Date().toISOString(),
                response: response,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to delete post' } as any,
                `Could not delete post ${postId}: ${errorMessage}`
            );
        }
    }

    /**
     * Get a specific post
     */
    async getPost(
        client: TumblrClient,
        blogName: string,
        postId: string,
        options: IDataObject = {}
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            if (!postId) {
                throw new NodeOperationError(
                    { message: 'Missing post ID' } as any,
                    'Post ID is required for get operation'
                );
            }

            // Use blogPosts with ID filter since tumblr.js doesn't have direct getPost
            const postOptions = {
                id: postId,
                notes_info: Boolean(options.notesInfo) || false,
                reblog_info: Boolean(options.reblogInfo) || false,
            };

            const response = await client.blogPosts(cleanBlogName, postOptions);
            const responseData = response.response || response;
            const posts = responseData.posts || [];

            if (posts.length === 0) {
                throw new NodeOperationError(
                    { message: 'Post not found' } as any,
                    `Post with ID ${postId} not found in blog ${cleanBlogName}`
                );
            }

            return {
                post: this.formatPost(posts[0]),
                blog: responseData.blog || { name: cleanBlogName },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to get post' } as any,
                `Could not retrieve post ${postId}: ${errorMessage}`
            );
        }
    }

    /**
     * Reblog a post
     */
    async reblogPost(
        client: TumblrClient,
        blogName: string,
        params: IDataObject
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            if (!params.id || !params.reblogKey) {
                throw new NodeOperationError(
                    { message: 'Missing reblog parameters' } as any,
                    'Post ID and reblog key are required for reblogging'
                );
            }

            const reblogParams = {
                id: params.id as string,
                reblog_key: params.reblogKey as string,
                comment: params.comment as string || '',
                tags: this.formatTags(params.tags),
            };

            const response = await client.reblogPost(cleanBlogName, reblogParams);

            return this.formatPostResponse(response, 'reblog');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to reblog post' } as any,
                `Could not reblog post: ${errorMessage}`
            );
        }
    }

    /**
     * Create a photo post
     */
    async createPhotoPost(
        client: TumblrClient,
        blogName: string,
        params: IDataObject
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            // Validate photo post requirements
            if (!params.source && !params.data && !params.photos) {
                throw new NodeOperationError(
                    { message: 'Missing photo content' } as any,
                    'Photo posts require either a source URL, file data, or photos array'
                );
            }

            // Prepare photo post parameters
            const photoPostParams = {
                caption: params.caption as string || '',
                link: params.link as string || undefined,
                source: params.source as string || undefined,
                data: params.data || undefined, // For file uploads
                tags: this.formatTags(params.tags),
                state: params.state as string || 'published',
                format: params.format as string || 'html',
                slug: params.slug as string || undefined,
                date: params.publishOn as string || undefined,
            };

            // Handle multiple photos if provided
            if (params.photos && Array.isArray(params.photos)) {
                photoPostParams.data = params.photos;
            }

            const response = await client.createPhotoPost(cleanBlogName, photoPostParams);

            return this.formatPostResponse(response, 'photo');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to create photo post' } as any,
                `Could not create photo post: ${errorMessage}`
            );
        }
    }

    /**
     * Create a quote post
     */
    async createQuotePost(
        client: TumblrClient,
        blogName: string,
        params: IDataObject
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            // Validate quote post requirements
            if (!params.quote) {
                throw new NodeOperationError(
                    { message: 'Missing quote content' } as any,
                    'Quote posts require quote text'
                );
            }

            // Prepare quote post parameters
            const quotePostParams = {
                quote: params.quote as string,
                source: params.source as string || '',
                tags: this.formatTags(params.tags),
                state: params.state as string || 'published',
                format: params.format as string || 'html',
                slug: params.slug as string || undefined,
                date: params.publishOn as string || undefined,
            };

            const response = await client.createQuotePost(cleanBlogName, quotePostParams);

            return this.formatPostResponse(response, 'quote');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to create quote post' } as any,
                `Could not create quote post: ${errorMessage}`
            );
        }
    }

    /**
     * Create a link post
     */
    async createLinkPost(
        client: TumblrClient,
        blogName: string,
        params: IDataObject
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            // Validate link post requirements
            if (!params.url) {
                throw new NodeOperationError(
                    { message: 'Missing URL' } as any,
                    'Link posts require a URL'
                );
            }

            // Validate URL format
            this.validateUrl(params.url as string);

            // Prepare link post parameters
            const linkPostParams = {
                title: params.title as string || '',
                url: params.url as string,
                description: params.description as string || '',
                tags: this.formatTags(params.tags),
                state: params.state as string || 'published',
                format: params.format as string || 'html',
                slug: params.slug as string || undefined,
                date: params.publishOn as string || undefined,
            };

            const response = await client.createLinkPost(cleanBlogName, linkPostParams);

            return this.formatPostResponse(response, 'link');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to create link post' } as any,
                `Could not create link post: ${errorMessage}`
            );
        }
    }

    /**
     * Create a chat post
     */
    async createChatPost(
        client: TumblrClient,
        blogName: string,
        params: IDataObject
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            // Validate chat post requirements
            if (!params.conversation) {
                throw new NodeOperationError(
                    { message: 'Missing conversation content' } as any,
                    'Chat posts require conversation content'
                );
            }

            // Prepare chat post parameters
            const chatPostParams = {
                title: params.title as string || '',
                conversation: this.formatConversation(params.conversation),
                tags: this.formatTags(params.tags),
                state: params.state as string || 'published',
                format: params.format as string || 'html',
                slug: params.slug as string || undefined,
                date: params.publishOn as string || undefined,
            };

            const response = await client.createChatPost(cleanBlogName, chatPostParams);

            return this.formatPostResponse(response, 'chat');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to create chat post' } as any,
                `Could not create chat post: ${errorMessage}`
            );
        }
    }

    /**
     * Create a video post
     */
    async createVideoPost(
        client: TumblrClient,
        blogName: string,
        params: IDataObject
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            // Validate video post requirements
            if (!params.embed && !params.data && !params.videoUrl) {
                throw new NodeOperationError(
                    { message: 'Missing video content' } as any,
                    'Video posts require either embed code, file data, or video URL'
                );
            }

            // Prepare video post parameters
            const videoPostParams = {
                caption: params.caption as string || '',
                embed: params.embed as string || undefined,
                data: params.data || undefined, // For file uploads
                tags: this.formatTags(params.tags),
                state: params.state as string || 'published',
                format: params.format as string || 'html',
                slug: params.slug as string || undefined,
                date: params.publishOn as string || undefined,
            };

            const response = await client.createVideoPost(cleanBlogName, videoPostParams);

            return this.formatPostResponse(response, 'video');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to create video post' } as any,
                `Could not create video post: ${errorMessage}`
            );
        }
    }

    /**
     * Create an audio post
     */
    async createAudioPost(
        client: TumblrClient,
        blogName: string,
        params: IDataObject
    ): Promise<IDataObject> {
        try {
            const cleanBlogName = this.cleanBlogName(blogName);

            // Validate audio post requirements
            if (!params.externalUrl && !params.data) {
                throw new NodeOperationError(
                    { message: 'Missing audio content' } as any,
                    'Audio posts require either external URL or file data'
                );
            }

            // Prepare audio post parameters
            const audioPostParams = {
                caption: params.caption as string || '',
                external_url: params.externalUrl as string || undefined,
                data: params.data || undefined, // For file uploads
                tags: this.formatTags(params.tags),
                state: params.state as string || 'published',
                format: params.format as string || 'html',
                slug: params.slug as string || undefined,
                date: params.publishOn as string || undefined,
            };

            const response = await client.createAudioPost(cleanBlogName, audioPostParams);

            return this.formatPostResponse(response, 'audio');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Failed to create audio post' } as any,
                `Could not create audio post: ${errorMessage}`
            );
        }
    }

    /**
     * Validate text content length
     */
    private validateTextContent(title: string, body: string): void {
        const titleLength = title?.length || 0;
        const bodyLength = body?.length || 0;

        // Tumblr limits (approximate)
        if (titleLength > 300) {
            throw new NodeOperationError(
                { message: 'Title too long' } as any,
                'Post title cannot exceed 300 characters'
            );
        }

        if (bodyLength > 4096) {
            throw new NodeOperationError(
                { message: 'Body too long' } as any,
                'Post body cannot exceed 4096 characters'
            );
        }
    }

    /**
     * Format tags for Tumblr API
     */
    private formatTags(tags: any): string[] {
        if (!tags) return [];

        if (typeof tags === 'string') {
            // Split by comma and clean up
            return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }

        if (Array.isArray(tags)) {
            return tags.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
        }

        return [];
    }

    /**
     * Format post response for consistent output
     */
    private formatPostResponse(response: any, operation: string): IDataObject {
        const responseData = response.response || response;

        return {
            success: true,
            operation,
            post_id: responseData.id || responseData.post_id,
            post_url: responseData.post_url,
            timestamp: new Date().toISOString(),
            response: responseData,
        };
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
     * Validate URL format
     */
    private validateUrl(url: string): void {
        try {
            new URL(url);
        } catch (error) {
            throw new NodeOperationError(
                { message: 'Invalid URL' } as any,
                'Please provide a valid URL'
            );
        }
    }

    /**
     * Format conversation for chat posts
     */
    private formatConversation(conversation: any): string {
        if (typeof conversation === 'string') {
            return conversation;
        }

        if (Array.isArray(conversation)) {
            // Convert array of conversation objects to string format
            return conversation.map((item: any) => {
                if (typeof item === 'string') return item;
                if (item.name && item.phrase) {
                    return `${item.name}: ${item.phrase}`;
                }
                return String(item);
            }).join('\n');
        }

        return String(conversation);
    }

    /**
     * Clean blog name by removing .tumblr.com suffix if present
     */
    private cleanBlogName(blogName: string): string {
        return blogName.replace(/\.tumblr\.com$/, '');
    }
}