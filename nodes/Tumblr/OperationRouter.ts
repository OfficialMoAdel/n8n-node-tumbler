import { IDataObject, NodeOperationError } from 'n8n-workflow';
import { TumblrClient } from './TumblrAuthenticator';
import { SearchOperations } from './operations/SearchOperations';

export interface OperationConfig {
    resource: 'blog' | 'post' | 'user' | 'queue' | 'draft' | 'search';
    operation: string;
    blogName?: string;
    parameters: IDataObject;
}

export class OperationRouter {
    /**
     * Routes operations to appropriate handlers based on resource and operation
     */
    async route(config: OperationConfig, client: TumblrClient): Promise<IDataObject> {
        const { resource, operation } = config;

        try {
            switch (resource) {
                case 'blog':
                    return await this.executeBlogOperation(operation, config, client);
                case 'post':
                    return await this.executePostOperation(operation, config, client);
                case 'user':
                    return await this.executeUserOperation(operation, config, client);
                case 'queue':
                    return await this.executeQueueOperation(operation, config, client);
                case 'draft':
                    return await this.executeDraftOperation(operation, config, client);
                case 'search':
                    return await this.executeSearchOperation(operation, config, client);
                default:
                    throw new NodeOperationError(
                        { message: 'Invalid resource' } as any,
                        `Unknown resource: ${resource}`
                    );
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeOperationError(
                { message: 'Operation failed' } as any,
                `Failed to execute ${resource}:${operation} - ${errorMessage}`
            );
        }
    }

    /**
     * Executes blog-related operations
     */
    private async executeBlogOperation(
        operation: string,
        config: OperationConfig,
        client: TumblrClient
    ): Promise<IDataObject> {
        const { blogName, parameters } = config;

        if (!blogName) {
            throw new NodeOperationError(
                { message: 'Missing blog name' } as any,
                'Blog name is required for blog operations'
            );
        }

        const cleanBlogName = this.cleanBlogName(blogName);

        switch (operation) {
            case 'getInfo':
                return await client.blogInfo(cleanBlogName);

            case 'getPosts':
                const postOptions = {
                    limit: parameters.limit || 20,
                    offset: parameters.offset || 0,
                    type: parameters.type || undefined,
                    tag: parameters.tag || undefined,
                    before: parameters.before || undefined,
                    filter: parameters.filter || 'text',
                };
                return await client.blogPosts(cleanBlogName, postOptions);

            default:
                throw new NodeOperationError(
                    { message: 'Invalid blog operation' } as any,
                    `Unknown blog operation: ${operation}`
                );
        }
    }

    /**
     * Executes post-related operations
     */
    private async executePostOperation(
        operation: string,
        config: OperationConfig,
        client: TumblrClient
    ): Promise<IDataObject> {
        const { blogName, parameters } = config;

        if (!blogName) {
            throw new NodeOperationError(
                { message: 'Missing blog name' } as any,
                'Blog name is required for post operations'
            );
        }

        const cleanBlogName = this.cleanBlogName(blogName);

        switch (operation) {
            case 'create':
                return await this.createPost(cleanBlogName, parameters, client);

            case 'update':
                if (!parameters.postId) {
                    throw new NodeOperationError(
                        { message: 'Missing post ID' } as any,
                        'Post ID is required for update operation'
                    );
                }
                return await client.editPost(cleanBlogName, parameters.postId as string, parameters);

            case 'delete':
                if (!parameters.postId) {
                    throw new NodeOperationError(
                        { message: 'Missing post ID' } as any,
                        'Post ID is required for delete operation'
                    );
                }
                return await client.deletePost(cleanBlogName, parameters.postId as string);

            case 'get':
                if (!parameters.postId) {
                    throw new NodeOperationError(
                        { message: 'Missing post ID' } as any,
                        'Post ID is required for get operation'
                    );
                }
                // Note: tumblr.js doesn't have a direct getPost method, we'll use blogPosts with ID filter
                const postOptions = {
                    id: parameters.postId,
                    notes_info: parameters.notesInfo || false,
                };
                return await client.blogPosts(cleanBlogName, postOptions);

            default:
                throw new NodeOperationError(
                    { message: 'Invalid post operation' } as any,
                    `Unknown post operation: ${operation}`
                );
        }
    }

    /**
     * Executes user-related operations
     */
    private async executeUserOperation(
        operation: string,
        config: OperationConfig,
        client: TumblrClient
    ): Promise<IDataObject> {
        const { parameters } = config;

        switch (operation) {
            case 'getInfo':
                return await client.userInfo();

            case 'getDashboard':
                const dashboardOptions = {
                    limit: parameters.limit || 20,
                    offset: parameters.offset || 0,
                    type: parameters.type || undefined,
                    since_id: parameters.sinceId || undefined,
                    reblog_info: parameters.reblogInfo || false,
                    notes_info: parameters.notesInfo || false,
                };
                return await client.userDashboard(dashboardOptions);

            case 'getLikes':
                const likesOptions = {
                    limit: parameters.limit || 20,
                    offset: parameters.offset || 0,
                    before: parameters.before || undefined,
                    after: parameters.after || undefined,
                };
                return await client.userLikes(likesOptions);

            default:
                throw new NodeOperationError(
                    { message: 'Invalid user operation' } as any,
                    `Unknown user operation: ${operation}`
                );
        }
    }

    /**
     * Executes queue-related operations
     */
    private async executeQueueOperation(
        operation: string,
        config: OperationConfig,
        client: TumblrClient
    ): Promise<IDataObject> {
        const { blogName, parameters } = config;

        if (!blogName) {
            throw new NodeOperationError(
                { message: 'Missing blog name' } as any,
                'Blog name is required for queue operations'
            );
        }

        const cleanBlogName = this.cleanBlogName(blogName);

        switch (operation) {
            case 'add':
                // Add post to queue - this is essentially creating a post with state: 'queue'
                const queueParams = {
                    ...parameters,
                    state: 'queue',
                };
                return await this.createPost(cleanBlogName, queueParams, client);

            case 'get':
                const queueOptions = {
                    limit: parameters.limit || 20,
                    offset: parameters.offset || 0,
                    filter: parameters.filter || 'text',
                };
                return await client.blogQueue(cleanBlogName, queueOptions);

            case 'remove':
                if (!parameters.postId) {
                    throw new NodeOperationError(
                        { message: 'Missing post ID' } as any,
                        'Post ID is required for remove operation'
                    );
                }
                // Remove from queue is essentially deleting the post
                return await client.deletePost(cleanBlogName, parameters.postId as string);

            default:
                throw new NodeOperationError(
                    { message: 'Invalid queue operation' } as any,
                    `Unknown queue operation: ${operation}`
                );
        }
    }

    /**
     * Executes draft-related operations
     */
    private async executeDraftOperation(
        operation: string,
        config: OperationConfig,
        client: TumblrClient
    ): Promise<IDataObject> {
        const { blogName, parameters } = config;

        if (!blogName) {
            throw new NodeOperationError(
                { message: 'Missing blog name' } as any,
                'Blog name is required for draft operations'
            );
        }

        const cleanBlogName = this.cleanBlogName(blogName);

        switch (operation) {
            case 'create':
                // Create draft - this is essentially creating a post with state: 'draft'
                const draftParams = {
                    ...parameters,
                    state: 'draft',
                };
                return await this.createPost(cleanBlogName, draftParams, client);

            case 'get':
                const draftOptions = {
                    limit: parameters.limit || 20,
                    offset: parameters.offset || 0,
                    filter: parameters.filter || 'text',
                };
                return await client.blogDrafts(cleanBlogName, draftOptions);

            case 'update':
                if (!parameters.postId) {
                    throw new NodeOperationError(
                        { message: 'Missing post ID' } as any,
                        'Post ID is required for update operation'
                    );
                }
                return await client.editPost(cleanBlogName, parameters.postId as string, parameters);

            case 'delete':
                if (!parameters.postId) {
                    throw new NodeOperationError(
                        { message: 'Missing post ID' } as any,
                        'Post ID is required for delete operation'
                    );
                }
                return await client.deletePost(cleanBlogName, parameters.postId as string);

            case 'publish':
                if (!parameters.postId) {
                    throw new NodeOperationError(
                        { message: 'Missing post ID' } as any,
                        'Post ID is required for publish operation'
                    );
                }
                // Publish draft by updating state to 'published'
                const publishParams = {
                    ...parameters,
                    state: 'published',
                };
                return await client.editPost(cleanBlogName, parameters.postId as string, publishParams);

            default:
                throw new NodeOperationError(
                    { message: 'Invalid draft operation' } as any,
                    `Unknown draft operation: ${operation}`
                );
        }
    }

    /**
     * Creates a post based on type and parameters
     */
    private async createPost(
        blogName: string,
        parameters: IDataObject,
        client: TumblrClient
    ): Promise<IDataObject> {
        const postType = parameters.type as string || 'text';

        // Common parameters for all post types
        const commonParams = {
            tags: parameters.tags || [],
            state: parameters.state || 'published',
            format: parameters.format || 'html',
            slug: parameters.slug || undefined,
            date: parameters.date || undefined,
        };

        switch (postType) {
            case 'text':
                return await client.createTextPost(blogName, {
                    ...commonParams,
                    title: parameters.title || '',
                    body: parameters.body || '',
                });

            case 'photo':
                return await client.createPhotoPost(blogName, {
                    ...commonParams,
                    caption: parameters.caption || '',
                    link: parameters.link || undefined,
                    source: parameters.source || undefined,
                    data: parameters.data || undefined, // For file uploads
                });

            case 'quote':
                return await client.createQuotePost(blogName, {
                    ...commonParams,
                    quote: parameters.quote || '',
                    source: parameters.source || '',
                });

            case 'link':
                return await client.createLinkPost(blogName, {
                    ...commonParams,
                    title: parameters.title || '',
                    url: parameters.url || '',
                    description: parameters.description || '',
                });

            case 'chat':
                return await client.createChatPost(blogName, {
                    ...commonParams,
                    title: parameters.title || '',
                    conversation: parameters.conversation || '',
                });

            case 'video':
                return await client.createVideoPost(blogName, {
                    ...commonParams,
                    caption: parameters.caption || '',
                    embed: parameters.embed || undefined,
                    data: parameters.data || undefined, // For file uploads
                });

            case 'audio':
                return await client.createAudioPost(blogName, {
                    ...commonParams,
                    caption: parameters.caption || '',
                    external_url: parameters.externalUrl || undefined,
                    data: parameters.data || undefined, // For file uploads
                });

            default:
                throw new NodeOperationError(
                    { message: 'Invalid post type' } as any,
                    `Unknown post type: ${postType}`
                );
        }
    }

    /**
     * Executes search-related operations
     */
    private async executeSearchOperation(
        operation: string,
        config: OperationConfig,
        client: TumblrClient
    ): Promise<IDataObject> {
        const { parameters } = config;

        switch (operation) {
            case 'searchByTag':
                if (!parameters.tag) {
                    throw new NodeOperationError(
                        { message: 'Missing tag' } as any,
                        'Tag is required for tag search operation'
                    );
                }
                return await SearchOperations.searchByTag(
                    client,
                    parameters.tag as string,
                    parameters.options as IDataObject || {}
                );

            case 'getTagInfo':
                if (!parameters.tag) {
                    throw new NodeOperationError(
                        { message: 'Missing tag' } as any,
                        'Tag is required for tag info operation'
                    );
                }
                return await SearchOperations.getTagInfo(client, parameters.tag as string);

            case 'getTagSuggestions':
                if (!parameters.partialTag) {
                    throw new NodeOperationError(
                        { message: 'Missing partial tag' } as any,
                        'Partial tag is required for tag suggestions operation'
                    );
                }
                return await SearchOperations.getTagSuggestions(
                    client,
                    parameters.partialTag as string,
                    parameters.limit as number || 10
                );

            case 'getTrendingTags':
                return await SearchOperations.getTrendingTags(
                    client,
                    parameters.limit as number || 20
                );

            case 'searchByKeyword':
                if (!parameters.keyword) {
                    throw new NodeOperationError(
                        { message: 'Missing keyword' } as any,
                        'Keyword is required for keyword search operation'
                    );
                }
                return await SearchOperations.searchByKeyword(
                    client,
                    parameters.keyword as string,
                    parameters.options as IDataObject || {}
                );

            case 'advancedSearch':
                return await SearchOperations.advancedSearch(client, parameters);

            case 'getTrending':
                return await SearchOperations.getTrending(
                    client,
                    parameters.options as IDataObject || {}
                );

            case 'searchUserContent':
                return await SearchOperations.searchUserContent(
                    client,
                    parameters.searchParams as IDataObject || {}
                );

            default:
                throw new NodeOperationError(
                    { message: 'Invalid search operation' } as any,
                    `Unknown search operation: ${operation}`
                );
        }
    }

    /**
     * Cleans blog name by removing .tumblr.com suffix if present
     */
    private cleanBlogName(blogName: string): string {
        return blogName.replace(/\.tumblr\.com$/, '');
    }
}