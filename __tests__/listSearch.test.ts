import { INodeListSearchResult } from 'n8n-workflow';
import {
    searchBlogs,
    searchBlogPosts,
    searchTags,
    searchUsers,
    clearSearchCache,
    getSearchCacheStats,
} from '../nodes/Tumblr/listSearch';
import { TumblrAuthenticator } from '../nodes/Tumblr/TumblrAuthenticator';

// Mock the TumblrAuthenticator
jest.mock('../nodes/Tumblr/TumblrAuthenticator');

describe('ListSearch', () => {
    let mockContext: any;
    let mockClient: any;
    let mockAuthenticator: jest.Mocked<TumblrAuthenticator>;

    beforeEach(() => {
        // Clear cache before each test
        clearSearchCache();

        // Mock context (this)
        mockContext = {
            getCredentials: jest.fn(),
            getCurrentNodeParameter: jest.fn(),
        };

        // Mock Tumblr client
        mockClient = {
            userInfo: jest.fn(),
            blogPosts: jest.fn(),
            userFollowing: jest.fn(),
        };

        // Mock TumblrAuthenticator
        mockAuthenticator = new TumblrAuthenticator() as jest.Mocked<TumblrAuthenticator>;
        mockAuthenticator.authenticate = jest.fn().mockResolvedValue(mockClient);
        (TumblrAuthenticator as jest.Mock).mockImplementation(() => mockAuthenticator);

        // Mock credentials
        mockContext.getCredentials.mockResolvedValue({
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            accessToken: 'test-access-token',
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('searchBlogs', () => {
        it('should search blogs successfully', async () => {
            const mockUserInfo = {
                response: {
                    user: {
                        blogs: [
                            {
                                name: 'myblog',
                                title: 'My Photography Blog',
                                description: 'A blog about photography',
                                posts: 42,
                                url: 'https://myblog.tumblr.com',
                            },
                            {
                                name: 'anotherblog',
                                title: 'Another Blog',
                                description: 'Different content',
                                posts: 15,
                            },
                        ],
                    },
                },
            };

            const mockFollowing = {
                response: {
                    blogs: [
                        {
                            name: 'followedblog',
                            title: 'Photography Inspiration',
                            description: 'Great photography content',
                            posts: 100,
                        },
                    ],
                },
            };

            mockClient.userInfo.mockResolvedValue(mockUserInfo);
            mockClient.userFollowing.mockResolvedValue(mockFollowing);

            const result = await searchBlogs.call(mockContext, 'photography');

            expect(result.results).toHaveLength(2);
            // Results are sorted by relevance, so "Photography Inspiration" comes first due to title match
            expect(result.results[0]).toEqual({
                name: 'Photography Inspiration (followedblog)',
                value: 'followedblog',
                description: 'Great photography content',
                url: 'https://followedblog.tumblr.com',
            });
            expect(result.results[1]).toEqual({
                name: 'My Photography Blog (myblog)',
                value: 'myblog',
                description: 'A blog about photography',
                url: 'https://myblog.tumblr.com',
            });
        });

        it('should return all blogs when no filter provided', async () => {
            const mockUserInfo = {
                response: {
                    user: {
                        blogs: [
                            {
                                name: 'blog1',
                                title: 'Blog 1',
                                posts: 10,
                            },
                            {
                                name: 'blog2',
                                title: 'Blog 2',
                                posts: 20,
                            },
                        ],
                    },
                },
            };

            mockClient.userInfo.mockResolvedValue(mockUserInfo);
            mockClient.userFollowing.mockResolvedValue({ response: { blogs: [] } });

            const result = await searchBlogs.call(mockContext);

            expect(result.results).toHaveLength(2);
            expect(result.results[0].name).toBe('Blog 1 (blog1)');
            expect(result.results[1].name).toBe('Blog 2 (blog2)');
        });

        it('should handle pagination', async () => {
            const mockUserInfo = {
                response: {
                    user: {
                        blogs: Array.from({ length: 25 }, (_, i) => ({
                            name: `blog${i}`,
                            title: `Blog ${i}`,
                            posts: i,
                        })),
                    },
                },
            };

            mockClient.userInfo.mockResolvedValue(mockUserInfo);
            mockClient.userFollowing.mockResolvedValue({ response: { blogs: [] } });

            const result = await searchBlogs.call(mockContext);

            expect(result.results).toHaveLength(20); // Page size limit
            expect(result.paginationToken).toBe('20');
        });

        it('should remove duplicate blogs', async () => {
            const duplicateBlog = {
                name: 'sameblog',
                title: 'Same Blog',
                posts: 10,
            };

            const mockUserInfo = {
                response: {
                    user: {
                        blogs: [duplicateBlog],
                    },
                },
            };

            const mockFollowing = {
                response: {
                    blogs: [duplicateBlog], // Same blog in following
                },
            };

            mockClient.userInfo.mockResolvedValue(mockUserInfo);
            mockClient.userFollowing.mockResolvedValue(mockFollowing);

            const result = await searchBlogs.call(mockContext);

            expect(result.results).toHaveLength(1);
            expect(result.results[0].value).toBe('sameblog');
        });

        it('should return empty array on error', async () => {
            mockClient.userInfo.mockRejectedValue(new Error('API Error'));

            const result = await searchBlogs.call(mockContext, 'test');

            expect(result.results).toEqual([]);
        });

        it('should use cached results on second call', async () => {
            const mockUserInfo = {
                response: {
                    user: {
                        blogs: [{ name: 'myblog', title: 'My Blog', posts: 42 }],
                    },
                },
            };

            mockClient.userInfo.mockResolvedValue(mockUserInfo);
            mockClient.userFollowing.mockResolvedValue({ response: { blogs: [] } });

            // First call
            const result1 = await searchBlogs.call(mockContext, 'test');
            expect(mockClient.userInfo).toHaveBeenCalledTimes(1);

            // Second call should use cache
            const result2 = await searchBlogs.call(mockContext, 'test');
            expect(mockClient.userInfo).toHaveBeenCalledTimes(1); // Still only called once
            expect(result1).toEqual(result2);
        });
    });

    describe('searchBlogPosts', () => {
        it('should search blog posts successfully', async () => {
            mockContext.getCurrentNodeParameter.mockReturnValue('myblog');

            const mockPosts = {
                response: {
                    posts: [
                        {
                            id: '123',
                            type: 'text',
                            title: 'Photography Tips',
                            body: 'Great tips for photography',
                            date: '2022-01-01 12:00:00 GMT',
                            timestamp: 1640995200,
                            note_count: 10,
                            post_url: 'https://myblog.tumblr.com/post/123',
                        },
                        {
                            id: '456',
                            type: 'photo',
                            caption: 'Beautiful landscape photography',
                            date: '2022-01-02 12:00:00 GMT',
                            timestamp: 1641081600,
                            note_count: 25,
                            post_url: 'https://myblog.tumblr.com/post/456',
                        },
                    ],
                },
            };

            mockClient.blogPosts.mockResolvedValue(mockPosts);

            const result = await searchBlogPosts.call(mockContext, 'photography');

            expect(result.results).toHaveLength(2);
            expect(result.results[0]).toEqual({
                name: 'Photography Tips (text • 1/1/2022)',
                value: '123',
                description: 'Great tips for photography',
                url: 'https://myblog.tumblr.com/post/123',
            });
            expect(result.results[1]).toEqual({
                name: 'photo post (photo • 1/2/2022)',
                value: '456',
                description: 'Beautiful landscape photography',
                url: 'https://myblog.tumblr.com/post/456',
            });

            expect(mockClient.blogPosts).toHaveBeenCalledWith('myblog', {
                limit: 50,
                offset: 0,
                filter: 'text',
            });
        });

        it('should return empty array when no blog name provided', async () => {
            mockContext.getCurrentNodeParameter.mockReturnValue('');

            const result = await searchBlogPosts.call(mockContext, 'test');

            expect(result.results).toEqual([]);
            expect(mockClient.blogPosts).not.toHaveBeenCalled();
        });

        it('should sort posts by relevance when searching', async () => {
            mockContext.getCurrentNodeParameter.mockReturnValue('myblog');

            const mockPosts = {
                response: {
                    posts: [
                        {
                            id: '1',
                            type: 'text',
                            title: 'Random post',
                            body: 'Contains photography somewhere',
                            timestamp: 1640995200,
                        },
                        {
                            id: '2',
                            type: 'text',
                            title: 'Photography Guide',
                            body: 'Main content',
                            timestamp: 1640995100,
                        },
                        {
                            id: '3',
                            type: 'text',
                            title: 'Other post',
                            tags: ['photography', 'tips'],
                            timestamp: 1640995300,
                        },
                    ],
                },
            };

            mockClient.blogPosts.mockResolvedValue(mockPosts);

            const result = await searchBlogPosts.call(mockContext, 'photography');

            expect(result.results).toHaveLength(3);
            // Should be sorted by relevance: title match first, then tag match, then body match
            expect(result.results[0].value).toBe('2'); // Title match
            expect(result.results[1].value).toBe('3'); // Tag match
            expect(result.results[2].value).toBe('1'); // Body match
        });

        it('should handle pagination', async () => {
            mockContext.getCurrentNodeParameter.mockReturnValue('myblog');

            const mockPosts = {
                response: {
                    posts: Array.from({ length: 50 }, (_, i) => ({
                        id: i.toString(),
                        type: 'text',
                        title: `Post ${i}`,
                        timestamp: 1640995200 + i,
                    })),
                },
            };

            mockClient.blogPosts.mockResolvedValue(mockPosts);

            const result = await searchBlogPosts.call(mockContext);

            expect(result.results).toHaveLength(20); // Limited to 20 per page
            expect(result.paginationToken).toBe('50');
        });

        it('should return empty array on error', async () => {
            mockContext.getCurrentNodeParameter.mockReturnValue('myblog');
            mockClient.blogPosts.mockRejectedValue(new Error('API Error'));

            const result = await searchBlogPosts.call(mockContext, 'test');

            expect(result.results).toEqual([]);
        });
    });

    describe('searchTags', () => {
        it('should search tags from user posts', async () => {
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

            const result = await searchTags.call(mockContext, 'photo');

            expect(result.results.length).toBeGreaterThan(0);

            const photographyTag = result.results.find(tag => tag.value === 'photography');
            expect(photographyTag).toBeDefined();
            expect(photographyTag?.name).toBe('#photography');
            expect(photographyTag?.description).toContain('2 times');
            expect(photographyTag?.description).toContain('Used 2 times in your posts');
        });

        it('should include popular tags when few user tags match', async () => {
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

            const result = await searchTags.call(mockContext, 'art');

            expect(result.results.length).toBeGreaterThan(0);
            expect(result.results.some(tag => tag.value === 'art')).toBe(true);
        });

        it('should return fallback tags on error', async () => {
            mockClient.userInfo.mockRejectedValue(new Error('API Error'));

            const result = await searchTags.call(mockContext, 'photo');

            expect(result.results.length).toBeGreaterThan(0);
            expect(result.results[0]).toEqual({
                name: '#photography',
                value: 'photography',
                description: 'Popular tag suggestion',
            });
        });

        it('should sort tags by relevance and frequency', async () => {
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
                        { tags: ['art', 'photography'] },
                        { tags: ['art', 'creative'] },
                        { tags: ['art'] },
                        { tags: ['photography'] },
                    ],
                },
            };

            mockClient.userInfo.mockResolvedValue(mockUserInfo);
            mockClient.blogPosts.mockResolvedValue(mockPosts);

            const result = await searchTags.call(mockContext);

            expect(result.results[0].value).toBe('art'); // Most frequent (3 times)
            expect(result.results[1].value).toBe('photography'); // Second most frequent (2 times)
        });

        it('should handle pagination', async () => {
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
                    posts: Array.from({ length: 30 }, (_, i) => ({
                        tags: [`tag${i}`],
                    })),
                },
            };

            mockClient.userInfo.mockResolvedValue(mockUserInfo);
            mockClient.blogPosts.mockResolvedValue(mockPosts);

            const result = await searchTags.call(mockContext);

            expect(result.results.length).toBeLessThanOrEqual(20); // Page size limit
            if (result.results.length === 20) {
                expect(result.paginationToken).toBe('20');
            }
        });
    });

    describe('searchUsers', () => {
        it('should search users from following list', async () => {
            const mockFollowing = {
                response: {
                    blogs: [
                        {
                            name: 'photographer1',
                            title: 'Amazing Photography',
                            description: 'Professional photographer',
                            posts: 500,
                            url: 'https://photographer1.tumblr.com',
                        },
                        {
                            name: 'photographer2',
                            title: 'Digital Art',
                            description: 'Digital artist and photographer',
                            posts: 200,
                        },
                    ],
                },
            };

            mockClient.userFollowing.mockResolvedValue(mockFollowing);

            const result = await searchUsers.call(mockContext, 'photographer');

            expect(result.results).toHaveLength(2);
            expect(result.results[0]).toEqual({
                name: 'Amazing Photography (@photographer1)',
                value: 'photographer1',
                description: 'Professional photographer',
                url: 'https://photographer1.tumblr.com',
            });
            expect(result.results[1]).toEqual({
                name: 'Digital Art (@photographer2)',
                value: 'photographer2',
                description: 'Digital artist and photographer',
                url: 'https://photographer2.tumblr.com',
            });
        });

        it('should return empty array when no search term provided', async () => {
            const result = await searchUsers.call(mockContext);

            expect(result.results).toEqual([]);
            expect(mockClient.userFollowing).not.toHaveBeenCalled();
        });

        it('should sort users by relevance', async () => {
            const mockFollowing = {
                response: {
                    blogs: [
                        {
                            name: 'randomuser',
                            title: 'Random Blog',
                            description: 'Contains art somewhere',
                        },
                        {
                            name: 'art',
                            title: 'Art Blog',
                            description: 'Main content',
                        },
                        {
                            name: 'artlover',
                            title: 'Art Lover',
                            description: 'Loves art',
                        },
                    ],
                },
            };

            mockClient.userFollowing.mockResolvedValue(mockFollowing);

            const result = await searchUsers.call(mockContext, 'art');

            expect(result.results).toHaveLength(3);
            // Should be sorted by relevance: exact name match first
            expect(result.results[0].value).toBe('art');
            expect(result.results[1].value).toBe('artlover'); // Name starts with search term
            expect(result.results[2].value).toBe('randomuser'); // Description contains term
        });

        it('should handle pagination', async () => {
            const mockFollowing = {
                response: {
                    blogs: Array.from({ length: 20 }, (_, i) => ({
                        name: `user${i}`,
                        title: `User ${i}`,
                        description: 'test user',
                    })),
                },
            };

            mockClient.userFollowing.mockResolvedValue(mockFollowing);

            const result = await searchUsers.call(mockContext, 'user');

            expect(result.results).toHaveLength(15); // Page size limit for users
            expect(result.paginationToken).toBe('15');
        });

        it('should return empty array on error', async () => {
            mockClient.userFollowing.mockRejectedValue(new Error('API Error'));

            const result = await searchUsers.call(mockContext, 'test');

            expect(result.results).toEqual([]);
        });
    });

    describe('Cache functionality', () => {
        it('should clear search cache successfully', () => {
            clearSearchCache();
            const stats = getSearchCacheStats();
            expect(stats.size).toBe(0);
            expect(stats.keys).toEqual([]);
        });

        it('should track search cache statistics', async () => {
            const mockUserInfo = {
                response: {
                    user: {
                        blogs: [{ name: 'myblog', title: 'My Blog', posts: 42 }],
                    },
                },
            };

            mockClient.userInfo.mockResolvedValue(mockUserInfo);
            mockClient.userFollowing.mockResolvedValue({ response: { blogs: [] } });

            await searchBlogs.call(mockContext, 'test');

            const stats = getSearchCacheStats();
            expect(stats.size).toBe(1);
            expect(stats.keys.length).toBe(1);
            expect(stats.keys[0]).toContain('blogs_test');
        });
    });

    describe('Error handling', () => {
        it('should handle authentication errors gracefully', async () => {
            mockAuthenticator.authenticate.mockRejectedValue(new Error('Auth failed'));

            const result = await searchBlogs.call(mockContext, 'test');

            expect(result.results).toEqual([]);
        });

        it('should handle missing credentials gracefully', async () => {
            mockContext.getCredentials.mockRejectedValue(new Error('No credentials'));

            const result = await searchBlogs.call(mockContext, 'test');

            expect(result.results).toEqual([]);
        });

        it('should handle malformed API responses', async () => {
            mockClient.userInfo.mockResolvedValue({ invalid: 'response' });

            const result = await searchBlogs.call(mockContext, 'test');

            expect(result.results).toEqual([]);
        });
    });
});