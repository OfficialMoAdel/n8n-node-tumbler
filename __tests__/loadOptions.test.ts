import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import {
    loadBlogs,
    loadPostTypes,
    loadPostStates,
    loadContentFormats,
    loadPopularTags,
    loadQueueIntervals,
    loadFollowingBlogs,
    loadDraftPosts,
    loadQueuePosts,
    clearOptionsCache,
    getCacheStats,
} from '../nodes/Tumblr/loadOptions';
import { TumblrAuthenticator } from '../nodes/Tumblr/TumblrAuthenticator';

// Mock the TumblrAuthenticator
jest.mock('../nodes/Tumblr/TumblrAuthenticator');

describe('LoadOptions', () => {
    let mockLoadOptionsFunctions: jest.Mocked<ILoadOptionsFunctions>;
    let mockClient: any;
    let mockAuthenticator: jest.Mocked<TumblrAuthenticator>;

    beforeEach(() => {
        // Clear cache before each test
        clearOptionsCache();

        // Mock ILoadOptionsFunctions
        mockLoadOptionsFunctions = {
            getCredentials: jest.fn(),
            getCurrentNodeParameter: jest.fn(),
        } as any;

        // Mock Tumblr client
        mockClient = {
            userInfo: jest.fn(),
            blogPosts: jest.fn(),
            userFollowing: jest.fn(),
            blogDrafts: jest.fn(),
            blogQueue: jest.fn(),
        };

        // Mock TumblrAuthenticator
        mockAuthenticator = new TumblrAuthenticator() as jest.Mocked<TumblrAuthenticator>;
        mockAuthenticator.authenticate = jest.fn().mockResolvedValue(mockClient);
        (TumblrAuthenticator as jest.Mock).mockImplementation(() => mockAuthenticator);

        // Mock credentials
        mockLoadOptionsFunctions.getCredentials.mockResolvedValue({
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            accessToken: 'test-access-token',
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('loadBlogs', () => {
        it('should load user blogs successfully', async () => {
            const mockUserInfo = {
                response: {
                    user: {
                        blogs: [
                            {
                                name: 'myblog',
                                title: 'My Blog',
                                description: 'A test blog',
                                posts: 42,
                            },
                            {
                                name: 'anotherblog',
                                title: 'Another Blog',
                                description: 'Another test blog with a very long description that should be truncated when displayed in the options',
                                posts: 15,
                            },
                        ],
                    },
                },
            };

            mockClient.userInfo.mockResolvedValue(mockUserInfo);

            const result = await loadBlogs.call(mockLoadOptionsFunctions);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                name: 'Another Blog (anotherblog)',
                value: 'anotherblog',
                description: 'Another test blog with a very long description that should be truncated when displayed in the option...',
            });
            expect(result[1]).toEqual({
                name: 'My Blog (myblog)',
                value: 'myblog',
                description: 'A test blog',
            });

            expect(mockLoadOptionsFunctions.getCredentials).toHaveBeenCalledWith('tumblrOAuth2Api');
            expect(mockAuthenticator.authenticate).toHaveBeenCalled();
            expect(mockClient.userInfo).toHaveBeenCalled();
        });

        it('should handle blogs without descriptions', async () => {
            const mockUserInfo = {
                response: {
                    user: {
                        blogs: [
                            {
                                name: 'myblog',
                                title: 'My Blog',
                                posts: 42,
                            },
                        ],
                    },
                },
            };

            mockClient.userInfo.mockResolvedValue(mockUserInfo);

            const result = await loadBlogs.call(mockLoadOptionsFunctions);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                name: 'My Blog (myblog)',
                value: 'myblog',
                description: 'Blog with 42 posts',
            });
        });

        it('should return empty array on error', async () => {
            mockClient.userInfo.mockRejectedValue(new Error('API Error'));

            const result = await loadBlogs.call(mockLoadOptionsFunctions);

            expect(result).toEqual([]);
        });

        it('should use cached results on second call', async () => {
            const mockUserInfo = {
                response: {
                    user: {
                        blogs: [
                            {
                                name: 'myblog',
                                title: 'My Blog',
                                description: 'A test blog',
                                posts: 42,
                            },
                        ],
                    },
                },
            };

            mockClient.userInfo.mockResolvedValue(mockUserInfo);

            // First call
            const result1 = await loadBlogs.call(mockLoadOptionsFunctions);
            expect(mockClient.userInfo).toHaveBeenCalledTimes(1);

            // Second call should use cache
            const result2 = await loadBlogs.call(mockLoadOptionsFunctions);
            expect(mockClient.userInfo).toHaveBeenCalledTimes(1); // Still only called once
            expect(result1).toEqual(result2);
        });
    });

    describe('loadPostTypes', () => {
        it('should return all post types', async () => {
            const result = await loadPostTypes.call(mockLoadOptionsFunctions);

            expect(result).toHaveLength(7);
            expect(result).toContainEqual({
                name: 'Text Post',
                value: 'text',
                description: 'Create a text-based post with title and body content',
            });
            expect(result).toContainEqual({
                name: 'Photo Post',
                value: 'photo',
                description: 'Create a post with images and optional caption',
            });
            expect(result).toContainEqual({
                name: 'Video Post',
                value: 'video',
                description: 'Create a post with video content or embed',
            });
        });
    });

    describe('loadPostStates', () => {
        it('should return all post states', async () => {
            const result = await loadPostStates.call(mockLoadOptionsFunctions);

            expect(result).toHaveLength(4);
            expect(result).toContainEqual({
                name: 'Published',
                value: 'published',
                description: 'Post is immediately published and visible to followers',
            });
            expect(result).toContainEqual({
                name: 'Draft',
                value: 'draft',
                description: 'Post is saved as a draft for later editing and publishing',
            });
        });
    });

    describe('loadContentFormats', () => {
        it('should return content formats', async () => {
            const result = await loadContentFormats.call(mockLoadOptionsFunctions);

            expect(result).toHaveLength(2);
            expect(result).toContainEqual({
                name: 'HTML',
                value: 'html',
                description: 'Content formatted as HTML with tags and styling',
            });
            expect(result).toContainEqual({
                name: 'Markdown',
                value: 'markdown',
                description: 'Content formatted using Markdown syntax',
            });
        });
    });

    describe('loadPopularTags', () => {
        it('should load tags from user posts', async () => {
            const mockUserInfo = {
                response: {
                    user: {
                        blogs: [
                            {
                                name: 'myblog',
                                title: 'My Blog',
                            },
                        ],
                    },
                },
            };

            const mockPosts = {
                response: {
                    posts: [
                        {
                            tags: ['photography', 'nature', 'art'],
                        },
                        {
                            tags: ['photography', 'landscape'],
                        },
                        {
                            tags: ['art', 'creative'],
                        },
                    ],
                },
            };

            mockClient.userInfo.mockResolvedValue(mockUserInfo);
            mockClient.blogPosts.mockResolvedValue(mockPosts);

            const result = await loadPopularTags.call(mockLoadOptionsFunctions);

            expect(result.length).toBeGreaterThan(0);

            // Check that photography (most frequent) is first
            const photographyTag = result.find(tag => tag.value === 'photography');
            expect(photographyTag).toBeDefined();
            expect(photographyTag?.name).toBe('#photography');
            expect(photographyTag?.description).toContain('2 times');
        });

        it('should return fallback tags on error', async () => {
            mockClient.userInfo.mockRejectedValue(new Error('API Error'));

            const result = await loadPopularTags.call(mockLoadOptionsFunctions);

            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toEqual({
                name: '#photography',
                value: 'photography',
                description: 'Popular tag suggestion',
            });
        });

        it('should add common tags if user has few tags', async () => {
            const mockUserInfo = {
                response: {
                    user: {
                        blogs: [
                            {
                                name: 'myblog',
                                title: 'My Blog',
                            },
                        ],
                    },
                },
            };

            const mockPosts = {
                response: {
                    posts: [
                        {
                            tags: ['mytag'],
                        },
                    ],
                },
            };

            mockClient.userInfo.mockResolvedValue(mockUserInfo);
            mockClient.blogPosts.mockResolvedValue(mockPosts);

            const result = await loadPopularTags.call(mockLoadOptionsFunctions);

            expect(result.length).toBeGreaterThan(5); // Should include common tags
            expect(result.some(tag => tag.value === 'photography')).toBe(true);
            expect(result.some(tag => tag.value === 'art')).toBe(true);
        });
    });

    describe('loadQueueIntervals', () => {
        it('should return queue intervals', async () => {
            const result = await loadQueueIntervals.call(mockLoadOptionsFunctions);

            expect(result).toHaveLength(8);
            expect(result).toContainEqual({
                name: 'Every 15 minutes',
                value: '15m',
                description: 'Publish queued posts every 15 minutes',
            });
            expect(result).toContainEqual({
                name: 'Daily',
                value: '24h',
                description: 'Publish queued posts once per day',
            });
        });
    });

    describe('loadFollowingBlogs', () => {
        it('should load following blogs successfully', async () => {
            const mockFollowing = {
                response: {
                    blogs: [
                        {
                            name: 'followedblog1',
                            title: 'Followed Blog 1',
                            description: 'A blog I follow',
                            posts: 100,
                        },
                        {
                            name: 'followedblog2',
                            title: 'Followed Blog 2',
                            posts: 50,
                        },
                    ],
                },
            };

            mockClient.userFollowing.mockResolvedValue(mockFollowing);

            const result = await loadFollowingBlogs.call(mockLoadOptionsFunctions);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                name: 'Followed Blog 1 (followedblog1)',
                value: 'followedblog1',
                description: 'A blog I follow',
            });
            expect(result[1]).toEqual({
                name: 'Followed Blog 2 (followedblog2)',
                value: 'followedblog2',
                description: 'Following blog with 50 posts',
            });
        });

        it('should return empty array on error', async () => {
            mockClient.userFollowing.mockRejectedValue(new Error('API Error'));

            const result = await loadFollowingBlogs.call(mockLoadOptionsFunctions);

            expect(result).toEqual([]);
        });
    });

    describe('loadDraftPosts', () => {
        it('should load draft posts successfully', async () => {
            mockLoadOptionsFunctions.getCurrentNodeParameter.mockReturnValue('myblog');

            const mockDrafts = {
                response: {
                    posts: [
                        {
                            id: '123',
                            type: 'text',
                            title: 'Draft Post 1',
                            timestamp: 1640995200, // 2022-01-01
                        },
                        {
                            id: '456',
                            type: 'photo',
                            summary: 'A photo post draft',
                            timestamp: 1640995200,
                        },
                    ],
                },
            };

            mockClient.blogDrafts.mockResolvedValue(mockDrafts);

            const result = await loadDraftPosts.call(mockLoadOptionsFunctions);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                name: 'Draft Post 1 (text)',
                value: '123',
                description: 'Draft text post created on 1/1/2022',
            });
            expect(result[1]).toEqual({
                name: 'A photo post draft (photo)',
                value: '456',
                description: 'Draft photo post created on 1/1/2022',
            });

            expect(mockClient.blogDrafts).toHaveBeenCalledWith('myblog', { limit: 50 });
        });

        it('should return empty array when no blog name provided', async () => {
            mockLoadOptionsFunctions.getCurrentNodeParameter.mockReturnValue('');

            const result = await loadDraftPosts.call(mockLoadOptionsFunctions);

            expect(result).toEqual([]);
            expect(mockClient.blogDrafts).not.toHaveBeenCalled();
        });

        it('should return empty array on error', async () => {
            mockLoadOptionsFunctions.getCurrentNodeParameter.mockReturnValue('myblog');
            mockClient.blogDrafts.mockRejectedValue(new Error('API Error'));

            const result = await loadDraftPosts.call(mockLoadOptionsFunctions);

            expect(result).toEqual([]);
        });
    });

    describe('loadQueuePosts', () => {
        it('should load queue posts successfully', async () => {
            mockLoadOptionsFunctions.getCurrentNodeParameter.mockReturnValue('myblog');

            const mockQueue = {
                response: {
                    posts: [
                        {
                            id: '789',
                            type: 'text',
                            title: 'Queued Post 1',
                            scheduled_publish_time: 1640995200, // 2022-01-01
                        },
                        {
                            id: '101112',
                            type: 'photo',
                            summary: 'A queued photo post',
                        },
                    ],
                },
            };

            mockClient.blogQueue.mockResolvedValue(mockQueue);

            const result = await loadQueuePosts.call(mockLoadOptionsFunctions);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                name: 'Queued Post 1 (text)',
                value: '789',
                description: expect.stringContaining('Queued text post - scheduled for'),
            });
            expect(result[1]).toEqual({
                name: 'A queued photo post (photo)',
                value: '101112',
                description: 'Queued photo post - scheduled for Not scheduled',
            });

            expect(mockClient.blogQueue).toHaveBeenCalledWith('myblog', { limit: 50 });
        });

        it('should return empty array when no blog name provided', async () => {
            mockLoadOptionsFunctions.getCurrentNodeParameter.mockReturnValue('');

            const result = await loadQueuePosts.call(mockLoadOptionsFunctions);

            expect(result).toEqual([]);
            expect(mockClient.blogQueue).not.toHaveBeenCalled();
        });

        it('should return empty array on error', async () => {
            mockLoadOptionsFunctions.getCurrentNodeParameter.mockReturnValue('myblog');
            mockClient.blogQueue.mockRejectedValue(new Error('API Error'));

            const result = await loadQueuePosts.call(mockLoadOptionsFunctions);

            expect(result).toEqual([]);
        });
    });

    describe('Cache functionality', () => {
        it('should clear cache successfully', () => {
            clearOptionsCache();
            const stats = getCacheStats();
            expect(stats.size).toBe(0);
            expect(stats.keys).toEqual([]);
        });

        it('should track cache statistics', async () => {
            // Load some data to populate cache
            const mockUserInfo = {
                response: {
                    user: {
                        blogs: [{ name: 'myblog', title: 'My Blog', posts: 42 }],
                    },
                },
            };

            mockClient.userInfo.mockResolvedValue(mockUserInfo);
            await loadBlogs.call(mockLoadOptionsFunctions);

            const stats = getCacheStats();
            expect(stats.size).toBe(1);
            expect(stats.keys).toContain('user_blogs');
        });
    });

    describe('Error handling', () => {
        it('should handle authentication errors gracefully', async () => {
            mockAuthenticator.authenticate.mockRejectedValue(new Error('Auth failed'));

            const result = await loadBlogs.call(mockLoadOptionsFunctions);

            expect(result).toEqual([]);
        });

        it('should handle missing credentials gracefully', async () => {
            mockLoadOptionsFunctions.getCredentials.mockRejectedValue(new Error('No credentials'));

            const result = await loadBlogs.call(mockLoadOptionsFunctions);

            expect(result).toEqual([]);
        });

        it('should handle malformed API responses', async () => {
            mockClient.userInfo.mockResolvedValue({ invalid: 'response' });

            const result = await loadBlogs.call(mockLoadOptionsFunctions);

            expect(result).toEqual([]);
        });
    });
});