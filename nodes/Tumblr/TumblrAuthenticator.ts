import { ICredentialsDecrypted, NodeApiError } from 'n8n-workflow';
import * as tumblr from 'tumblr.js';

export interface TumblrCredentials {
    clientId: string;
    clientSecret: string;
    accessToken: string;
    refreshToken?: string;
    tokenType: 'Bearer';
    expiresAt?: number;
    [key: string]: any; // Index signature for n8n compatibility
}

export interface TumblrClient {
    userInfo(): Promise<any>;
    blogInfo(blogName: string): Promise<any>;
    blogPosts(blogName: string, options?: any): Promise<any>;
    createTextPost(blogName: string, options: any): Promise<any>;
    createPhotoPost(blogName: string, options: any): Promise<any>;
    createQuotePost(blogName: string, options: any): Promise<any>;
    createLinkPost(blogName: string, options: any): Promise<any>;
    createChatPost(blogName: string, options: any): Promise<any>;
    createVideoPost(blogName: string, options: any): Promise<any>;
    createAudioPost(blogName: string, options: any): Promise<any>;
    editPost(blogName: string, postId: string, options: any): Promise<any>;
    deletePost(blogName: string, postId: string): Promise<any>;
    reblogPost(blogName: string, options: any): Promise<any>;
    likePost(postId: string, reblogKey: string): Promise<any>;
    unlikePost(postId: string, reblogKey: string): Promise<any>;
    followBlog(blogName: string): Promise<any>;
    unfollowBlog(blogName: string): Promise<any>;
    userDashboard(options?: any): Promise<any>;
    userLikes(options?: any): Promise<any>;
    userFollowing(options?: any): Promise<any>;
    blogQueue(blogName: string, options?: any): Promise<any>;
    blogDrafts(blogName: string, options?: any): Promise<any>;
    taggedPosts(tag: string, options?: any): Promise<any>;
}

export class TumblrAuthenticator {
    /**
     * Creates an authenticated Tumblr client
     */
    async authenticate(credentials: ICredentialsDecrypted): Promise<TumblrClient> {
        try {
            const credentialData = credentials.data;
            if (!credentialData) {
                throw new NodeApiError(
                    { message: 'Missing credential data' } as any,
                    { message: 'No credential data provided' }
                );
            }

            const { clientId, clientSecret, accessToken } = credentialData as unknown as TumblrCredentials;

            if (!clientId || !clientSecret || !accessToken) {
                throw new NodeApiError(
                    { message: 'Missing required credentials' } as any,
                    { message: 'Client ID, Client Secret, and Access Token are required' }
                );
            }

            // Create tumblr.js client with OAuth 2.0 credentials
            const client = tumblr.createClient({
                consumer_key: clientId,
                consumer_secret: clientSecret,
                token: accessToken,
                token_secret: '', // Not used in OAuth 2.0
            });

            // Wrap client methods to return promises and handle errors
            const wrappedClient = this.wrapClientMethods(client);

            // Validate credentials by making a test call
            await this.validateCredentials(wrappedClient);

            return wrappedClient;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeApiError(
                { message: 'Authentication failed' } as any,
                { message: `Failed to authenticate with Tumblr: ${errorMessage}` }
            );
        }
    }

    /**
     * Validates credentials by making a test API call
     */
    async validateCredentials(client: TumblrClient): Promise<boolean> {
        try {
            await client.userInfo();
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NodeApiError(
                { message: 'Credential validation failed' } as any,
                { message: `Invalid credentials: ${errorMessage}` }
            );
        }
    }

    /**
     * Wraps tumblr.js client methods to return promises and handle errors consistently
     */
    private wrapClientMethods(client: any): TumblrClient {
        const promisifyMethod = (method: Function) => {
            return (...args: any[]) => {
                return new Promise((resolve, reject) => {
                    const callback = (err: any, data: any) => {
                        if (err) {
                            reject(this.handleTumblrError(err));
                        } else {
                            resolve(data);
                        }
                    };
                    method.call(client, ...args, callback);
                });
            };
        };

        return {
            userInfo: promisifyMethod(client.userInfo),
            blogInfo: promisifyMethod(client.blogInfo),
            blogPosts: promisifyMethod(client.blogPosts),
            createTextPost: promisifyMethod(client.createTextPost),
            createPhotoPost: promisifyMethod(client.createPhotoPost),
            createQuotePost: promisifyMethod(client.createQuotePost),
            createLinkPost: promisifyMethod(client.createLinkPost),
            createChatPost: promisifyMethod(client.createChatPost),
            createVideoPost: promisifyMethod(client.createVideoPost),
            createAudioPost: promisifyMethod(client.createAudioPost),
            editPost: promisifyMethod(client.editPost),
            deletePost: promisifyMethod(client.deletePost),
            reblogPost: promisifyMethod(client.reblogPost),
            likePost: promisifyMethod(client.likePost),
            unlikePost: promisifyMethod(client.unlikePost),
            followBlog: promisifyMethod(client.followBlog),
            unfollowBlog: promisifyMethod(client.unfollowBlog),
            userDashboard: promisifyMethod(client.userDashboard),
            userLikes: promisifyMethod(client.userLikes),
            userFollowing: promisifyMethod(client.userFollowing),
            blogQueue: promisifyMethod(client.blogQueue),
            blogDrafts: promisifyMethod(client.blogDrafts),
            taggedPosts: promisifyMethod(client.taggedPosts),
        };
    }

    /**
     * Handles and formats Tumblr API errors
     */
    private handleTumblrError(error: any): NodeApiError {
        let message = 'Unknown Tumblr API error';
        let statusCode = 500;

        if (error.response) {
            statusCode = error.response.status || 500;

            if (error.response.data?.meta?.msg) {
                message = error.response.data.meta.msg;
            } else if (error.response.data?.errors) {
                message = Array.isArray(error.response.data.errors)
                    ? error.response.data.errors.join(', ')
                    : error.response.data.errors;
            } else if (error.message) {
                message = error.message;
            }

            // Handle specific error cases
            switch (statusCode) {
                case 401:
                    message = 'Authentication failed. Please check your credentials.';
                    break;
                case 403:
                    message = 'Access forbidden. Check your API permissions.';
                    break;
                case 429:
                    message = 'Rate limit exceeded. Please wait before making more requests.';
                    break;
                case 404:
                    message = 'Resource not found. Check blog name or post ID.';
                    break;
            }
        } else if (error.message) {
            message = error.message;
        }

        return new NodeApiError(
            { message: 'Tumblr API Error' } as any,
            {
                message,
                httpCode: statusCode.toString(),
                cause: error
            }
        );
    }

    /**
     * Refreshes expired access token (placeholder for future OAuth 2.0 refresh implementation)
     */
    async refreshToken(credentials: TumblrCredentials): Promise<TumblrCredentials> {
        // TODO: Implement token refresh logic when Tumblr supports it
        // For now, return the existing credentials
        return credentials;
    }
}