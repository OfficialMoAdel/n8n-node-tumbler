import { TumblrAuthenticator, TumblrCredentials } from '../nodes/Tumblr/TumblrAuthenticator';
import { ICredentialsDecrypted, NodeApiError } from 'n8n-workflow';

// Mock tumblr.js
jest.mock('tumblr.js', () => ({
    createClient: jest.fn(),
}));

describe('TumblrAuthenticator', () => {
    let authenticator: TumblrAuthenticator;
    let mockTumblrClient: any;
    let mockCredentials: ICredentialsDecrypted;

    beforeEach(() => {
        authenticator = new TumblrAuthenticator();

        mockTumblrClient = {
            userInfo: jest.fn(),
            blogInfo: jest.fn(),
            blogPosts: jest.fn(),
            createTextPost: jest.fn(),
            editPost: jest.fn(),
            deletePost: jest.fn(),
        };

        mockCredentials = {
            id: 'test-id',
            name: 'tumblrOAuth2Api',
            type: 'tumblrOAuth2Api',
            data: {
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                accessToken: 'test-access-token',
            } as TumblrCredentials,
        };

        const tumblr = require('tumblr.js');
        tumblr.createClient.mockReturnValue(mockTumblrClient);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('authenticate', () => {
        it('should create authenticated client with valid credentials', async () => {
            mockTumblrClient.userInfo.mockImplementation((callback: Function) => {
                callback(null, { user: { name: 'testuser' } });
            });

            const client = await authenticator.authenticate(mockCredentials);

            expect(client).toBeDefined();
            expect(typeof client.userInfo).toBe('function');
        });

        it('should throw error with missing credentials', async () => {
            const invalidCredentials = {
                ...mockCredentials,
                data: {
                    clientId: '',
                    clientSecret: 'test-secret',
                    accessToken: 'test-token',
                },
            };

            await expect(authenticator.authenticate(invalidCredentials)).rejects.toThrow(NodeApiError);
        });

        it('should validate credentials during authentication', async () => {
            mockTumblrClient.userInfo.mockImplementation((callback: Function) => {
                callback(null, { user: { name: 'testuser' } });
            });

            await authenticator.authenticate(mockCredentials);

            expect(mockTumblrClient.userInfo).toHaveBeenCalled();
        });

        it('should throw error when credential validation fails', async () => {
            mockTumblrClient.userInfo.mockImplementation((callback: Function) => {
                callback(new Error('Invalid credentials'), null);
            });

            await expect(authenticator.authenticate(mockCredentials)).rejects.toThrow(NodeApiError);
        });
    });

    describe('validateCredentials', () => {
        it('should return true for valid credentials', async () => {
            const mockClient = {
                userInfo: jest.fn().mockResolvedValue({ user: { name: 'testuser' } }),
            } as any;

            const result = await authenticator.validateCredentials(mockClient);

            expect(result).toBe(true);
            expect(mockClient.userInfo).toHaveBeenCalled();
        });

        it('should throw error for invalid credentials', async () => {
            const mockClient = {
                userInfo: jest.fn().mockRejectedValue(new Error('Unauthorized')),
            } as any;

            await expect(authenticator.validateCredentials(mockClient)).rejects.toThrow(NodeApiError);
        });
    });

    describe('wrapped client methods', () => {
        it('should promisify callback-based methods', async () => {
            mockTumblrClient.userInfo.mockImplementation((callback: Function) => {
                callback(null, { user: { name: 'testuser' } });
            });

            const client = await authenticator.authenticate(mockCredentials);
            const result = await client.userInfo();

            expect(result).toEqual({ user: { name: 'testuser' } });
        });

        it('should handle errors in promisified methods', async () => {
            mockTumblrClient.userInfo.mockImplementation((callback: Function) => {
                callback(null, { user: { name: 'testuser' } });
            });

            mockTumblrClient.blogInfo.mockImplementation((blogName: string, callback: Function) => {
                callback(new Error('Blog not found'), null);
            });

            const client = await authenticator.authenticate(mockCredentials);

            await expect(client.blogInfo('nonexistent')).rejects.toThrow(NodeApiError);
        });
    });

    describe('error handling', () => {
        it('should handle 401 authentication errors', async () => {
            const error = {
                response: {
                    status: 401,
                    data: { meta: { msg: 'Unauthorized' } },
                },
            };

            mockTumblrClient.userInfo.mockImplementation((callback: Function) => {
                callback(error, null);
            });

            await expect(authenticator.authenticate(mockCredentials)).rejects.toThrow('Failed to authenticate with Tumblr');
        });

        it('should handle 429 rate limit errors', async () => {
            const error = {
                response: {
                    status: 429,
                    data: { meta: { msg: 'Rate limit exceeded' } },
                },
            };

            mockTumblrClient.userInfo.mockImplementation((callback: Function) => {
                callback(error, null);
            });

            await expect(authenticator.authenticate(mockCredentials)).rejects.toThrow('Failed to authenticate with Tumblr');
        });

        it('should handle 404 not found errors', async () => {
            const error = {
                response: {
                    status: 404,
                    data: { meta: { msg: 'Not found' } },
                },
            };

            mockTumblrClient.userInfo.mockImplementation((callback: Function) => {
                callback(error, null);
            });

            await expect(authenticator.authenticate(mockCredentials)).rejects.toThrow('Failed to authenticate with Tumblr');
        });
    });

    describe('refreshToken', () => {
        it('should return existing credentials (placeholder implementation)', async () => {
            const credentials: TumblrCredentials = {
                clientId: 'test-id',
                clientSecret: 'test-secret',
                accessToken: 'test-token',
                tokenType: 'Bearer',
            };

            const result = await authenticator.refreshToken(credentials);

            expect(result).toEqual(credentials);
        });
    });
});