import { OperationRouter, OperationConfig } from '../nodes/Tumblr/OperationRouter';
import { TumblrClient } from '../nodes/Tumblr/TumblrAuthenticator';
import { SearchOperations } from '../nodes/Tumblr/operations/SearchOperations';
import { NodeOperationError } from 'n8n-workflow';

// Mock SearchOperations
jest.mock('../nodes/Tumblr/operations/SearchOperations');

describe('OperationRouter', () => {
    let router: OperationRouter;
    let mockClient: jest.Mocked<TumblrClient>;

    beforeEach(() => {
        router = new OperationRouter();

        mockClient = {
            userInfo: jest.fn(),
            blogInfo: jest.fn(),
            blogPosts: jest.fn(),
            createTextPost: jest.fn(),
            createPhotoPost: jest.fn(),
            createQuotePost: jest.fn(),
            createLinkPost: jest.fn(),
            createChatPost: jest.fn(),
            createVideoPost: jest.fn(),
            createAudioPost: jest.fn(),
            editPost: jest.fn(),
            deletePost: jest.fn(),
            reblogPost: jest.fn(),
            likePost: jest.fn(),
            unlikePost: jest.fn(),
            followBlog: jest.fn(),
            unfollowBlog: jest.fn(),
            userDashboard: jest.fn(),
            userLikes: jest.fn(),
            userFollowing: jest.fn(),
            blogQueue: jest.fn(),
            blogDrafts: jest.fn(),
            taggedPosts: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('route', () => {
        it('should route blog operations correctly', async () => {
            const config: OperationConfig = {
                resource: 'blog',
                operation: 'getInfo',
                blogName: 'testblog',
                parameters: {},
            };

            mockClient.blogInfo.mockResolvedValue({ blog: { name: 'testblog' } });

            const result = await router.route(config, mockClient);

            expect(mockClient.blogInfo).toHaveBeenCalledWith('testblog');
            expect(result).toEqual({ blog: { name: 'testblog' } });
        });

        it('should route post operations correctly', async () => {
            const config: OperationConfig = {
                resource: 'post',
                operation: 'create',
                blogName: 'testblog',
                parameters: {
                    type: 'text',
                    title: 'Test Post',
                    body: 'Test content',
                },
            };

            mockClient.createTextPost.mockResolvedValue({ id: '12345' });

            const result = await router.route(config, mockClient);

            expect(mockClient.createTextPost).toHaveBeenCalledWith('testblog', expect.objectContaining({
                title: 'Test Post',
                body: 'Test content',
            }));
            expect(result).toEqual({ id: '12345' });
        });

        it('should route user operations correctly', async () => {
            const config: OperationConfig = {
                resource: 'user',
                operation: 'getInfo',
                parameters: {},
            };

            mockClient.userInfo.mockResolvedValue({ user: { name: 'testuser' } });

            const result = await router.route(config, mockClient);

            expect(mockClient.userInfo).toHaveBeenCalled();
            expect(result).toEqual({ user: { name: 'testuser' } });
        });

        it('should throw error for unknown resource', async () => {
            const config: OperationConfig = {
                resource: 'unknown' as any,
                operation: 'test',
                parameters: {},
            };

            await expect(router.route(config, mockClient)).rejects.toThrow(NodeOperationError);
        });
    });

    describe('blog operations', () => {
        it('should get blog info', async () => {
            const config: OperationConfig = {
                resource: 'blog',
                operation: 'getInfo',
                blogName: 'testblog.tumblr.com',
                parameters: {},
            };

            mockClient.blogInfo.mockResolvedValue({ blog: { name: 'testblog' } });

            await router.route(config, mockClient);

            expect(mockClient.blogInfo).toHaveBeenCalledWith('testblog');
        });

        it('should get blog posts with options', async () => {
            const config: OperationConfig = {
                resource: 'blog',
                operation: 'getPosts',
                blogName: 'testblog',
                parameters: {
                    limit: 10,
                    type: 'text',
                    tag: 'test',
                },
            };

            mockClient.blogPosts.mockResolvedValue({ posts: [] });

            await router.route(config, mockClient);

            expect(mockClient.blogPosts).toHaveBeenCalledWith('testblog', {
                limit: 10,
                offset: 0,
                type: 'text',
                tag: 'test',
                before: undefined,
                filter: 'text',
            });
        });

        it('should throw error when blog name is missing', async () => {
            const config: OperationConfig = {
                resource: 'blog',
                operation: 'getInfo',
                parameters: {},
            };

            await expect(router.route(config, mockClient)).rejects.toThrow('Blog name is required');
        });
    });

    describe('post operations', () => {
        it('should create text post', async () => {
            const config: OperationConfig = {
                resource: 'post',
                operation: 'create',
                blogName: 'testblog',
                parameters: {
                    type: 'text',
                    title: 'Test Title',
                    body: 'Test Body',
                    tags: ['test', 'post'],
                },
            };

            mockClient.createTextPost.mockResolvedValue({ id: '12345' });

            await router.route(config, mockClient);

            expect(mockClient.createTextPost).toHaveBeenCalledWith('testblog', {
                title: 'Test Title',
                body: 'Test Body',
                tags: ['test', 'post'],
                state: 'published',
                format: 'html',
                slug: undefined,
                date: undefined,
            });
        });

        it('should create photo post', async () => {
            const config: OperationConfig = {
                resource: 'post',
                operation: 'create',
                blogName: 'testblog',
                parameters: {
                    type: 'photo',
                    caption: 'Test Photo',
                    source: 'http://example.com/photo.jpg',
                },
            };

            mockClient.createPhotoPost.mockResolvedValue({ id: '12345' });

            await router.route(config, mockClient);

            expect(mockClient.createPhotoPost).toHaveBeenCalledWith('testblog', expect.objectContaining({
                caption: 'Test Photo',
                source: 'http://example.com/photo.jpg',
            }));
        });

        it('should update post', async () => {
            const config: OperationConfig = {
                resource: 'post',
                operation: 'update',
                blogName: 'testblog',
                parameters: {
                    postId: '12345',
                    title: 'Updated Title',
                },
            };

            mockClient.editPost.mockResolvedValue({ id: '12345' });

            await router.route(config, mockClient);

            expect(mockClient.editPost).toHaveBeenCalledWith('testblog', '12345', {
                postId: '12345',
                title: 'Updated Title',
            });
        });

        it('should delete post', async () => {
            const config: OperationConfig = {
                resource: 'post',
                operation: 'delete',
                blogName: 'testblog',
                parameters: {
                    postId: '12345',
                },
            };

            mockClient.deletePost.mockResolvedValue({ success: true });

            await router.route(config, mockClient);

            expect(mockClient.deletePost).toHaveBeenCalledWith('testblog', '12345');
        });

        it('should throw error when post ID is missing for update', async () => {
            const config: OperationConfig = {
                resource: 'post',
                operation: 'update',
                blogName: 'testblog',
                parameters: {},
            };

            await expect(router.route(config, mockClient)).rejects.toThrow('Post ID is required');
        });
    });

    describe('user operations', () => {
        it('should get user dashboard with options', async () => {
            const config: OperationConfig = {
                resource: 'user',
                operation: 'getDashboard',
                parameters: {
                    limit: 15,
                    type: 'photo',
                },
            };

            mockClient.userDashboard.mockResolvedValue({ posts: [] });

            await router.route(config, mockClient);

            expect(mockClient.userDashboard).toHaveBeenCalledWith({
                limit: 15,
                offset: 0,
                type: 'photo',
                since_id: undefined,
                reblog_info: false,
                notes_info: false,
            });
        });

        it('should get user likes', async () => {
            const config: OperationConfig = {
                resource: 'user',
                operation: 'getLikes',
                parameters: {
                    limit: 25,
                },
            };

            mockClient.userLikes.mockResolvedValue({ liked_posts: [] });

            await router.route(config, mockClient);

            expect(mockClient.userLikes).toHaveBeenCalledWith({
                limit: 25,
                offset: 0,
                before: undefined,
                after: undefined,
            });
        });
    });

    describe('queue operations', () => {
        it('should add post to queue', async () => {
            const config: OperationConfig = {
                resource: 'queue',
                operation: 'add',
                blogName: 'testblog',
                parameters: {
                    type: 'text',
                    title: 'Queued Post',
                    body: 'This will be queued',
                },
            };

            mockClient.createTextPost.mockResolvedValue({ id: '12345' });

            await router.route(config, mockClient);

            expect(mockClient.createTextPost).toHaveBeenCalledWith('testblog', expect.objectContaining({
                title: 'Queued Post',
                body: 'This will be queued',
                state: 'queue',
            }));
        });

        it('should get queue', async () => {
            const config: OperationConfig = {
                resource: 'queue',
                operation: 'get',
                blogName: 'testblog',
                parameters: {},
            };

            mockClient.blogQueue.mockResolvedValue({ posts: [] });

            await router.route(config, mockClient);

            expect(mockClient.blogQueue).toHaveBeenCalledWith('testblog', {
                limit: 20,
                offset: 0,
                filter: 'text',
            });
        });
    });

    describe('draft operations', () => {
        it('should create draft', async () => {
            const config: OperationConfig = {
                resource: 'draft',
                operation: 'create',
                blogName: 'testblog',
                parameters: {
                    type: 'text',
                    title: 'Draft Post',
                    body: 'This is a draft',
                },
            };

            mockClient.createTextPost.mockResolvedValue({ id: '12345' });

            await router.route(config, mockClient);

            expect(mockClient.createTextPost).toHaveBeenCalledWith('testblog', expect.objectContaining({
                title: 'Draft Post',
                body: 'This is a draft',
                state: 'draft',
            }));
        });

        it('should publish draft', async () => {
            const config: OperationConfig = {
                resource: 'draft',
                operation: 'publish',
                blogName: 'testblog',
                parameters: {
                    postId: '12345',
                },
            };

            mockClient.editPost.mockResolvedValue({ id: '12345' });

            await router.route(config, mockClient);

            expect(mockClient.editPost).toHaveBeenCalledWith('testblog', '12345', expect.objectContaining({
                state: 'published',
            }));
        });
    });

    describe('search operations', () => {
        let mockSearchOperations: jest.Mocked<typeof SearchOperations>;

        beforeEach(() => {
            mockSearchOperations = SearchOperations as jest.Mocked<typeof SearchOperations>;
        });

        it('should search by tag', async () => {
            const config: OperationConfig = {
                resource: 'search',
                operation: 'searchByTag',
                parameters: {
                    tag: 'photography',
                    options: { limit: 30 }
                },
            };

            const mockResult = {
                success: true,
                data: { posts: [], tag: 'photography' },
                metadata: { operation: 'searchByTag' }
            };

            mockSearchOperations.searchByTag.mockResolvedValue(mockResult);

            const result = await router.route(config, mockClient);

            expect(mockSearchOperations.searchByTag).toHaveBeenCalledWith(
                mockClient,
                'photography',
                { limit: 30 }
            );
            expect(result).toEqual(mockResult);
        });

        it('should get tag info', async () => {
            const config: OperationConfig = {
                resource: 'search',
                operation: 'getTagInfo',
                parameters: {
                    tag: 'art'
                },
            };

            const mockResult = {
                success: true,
                data: { tag: 'art', totalPosts: 1000 },
                metadata: { operation: 'getTagInfo' }
            };

            mockSearchOperations.getTagInfo.mockResolvedValue(mockResult);

            const result = await router.route(config, mockClient);

            expect(mockSearchOperations.getTagInfo).toHaveBeenCalledWith(mockClient, 'art');
            expect(result).toEqual(mockResult);
        });

        it('should get tag suggestions', async () => {
            const config: OperationConfig = {
                resource: 'search',
                operation: 'getTagSuggestions',
                parameters: {
                    partialTag: 'photo',
                    limit: 15
                },
            };

            const mockResult = {
                success: true,
                data: { suggestions: [] },
                metadata: { operation: 'getTagSuggestions' }
            };

            mockSearchOperations.getTagSuggestions.mockResolvedValue(mockResult);

            const result = await router.route(config, mockClient);

            expect(mockSearchOperations.getTagSuggestions).toHaveBeenCalledWith(
                mockClient,
                'photo',
                15
            );
            expect(result).toEqual(mockResult);
        });

        it('should get trending tags', async () => {
            const config: OperationConfig = {
                resource: 'search',
                operation: 'getTrendingTags',
                parameters: {
                    limit: 25
                },
            };

            const mockResult = {
                success: true,
                data: { trendingTags: [] },
                metadata: { operation: 'getTrendingTags' }
            };

            mockSearchOperations.getTrendingTags.mockResolvedValue(mockResult);

            const result = await router.route(config, mockClient);

            expect(mockSearchOperations.getTrendingTags).toHaveBeenCalledWith(mockClient, 25);
            expect(result).toEqual(mockResult);
        });

        it('should get trending content', async () => {
            const config: OperationConfig = {
                resource: 'search',
                operation: 'getTrending',
                parameters: {
                    options: {
                        timeframe: '24h',
                        limit: 15,
                        includeContent: true,
                        includeTags: true,
                        includeTopics: false
                    }
                },
            };

            const mockResult = {
                success: true,
                data: {
                    timeframe: '24h',
                    trendingPosts: [],
                    trendingTags: [],
                    summary: { totalTrendingItems: 0 }
                },
                metadata: { operation: 'getTrending' }
            };

            mockSearchOperations.getTrending.mockResolvedValue(mockResult);

            const result = await router.route(config, mockClient);

            expect(mockSearchOperations.getTrending).toHaveBeenCalledWith(
                mockClient,
                {
                    timeframe: '24h',
                    limit: 15,
                    includeContent: true,
                    includeTags: true,
                    includeTopics: false
                }
            );
            expect(result).toEqual(mockResult);
        });

        it('should throw error when tag is missing for searchByTag', async () => {
            const config: OperationConfig = {
                resource: 'search',
                operation: 'searchByTag',
                parameters: {},
            };

            await expect(router.route(config, mockClient)).rejects.toThrow('Tag is required');
        });

        it('should throw error when tag is missing for getTagInfo', async () => {
            const config: OperationConfig = {
                resource: 'search',
                operation: 'getTagInfo',
                parameters: {},
            };

            await expect(router.route(config, mockClient)).rejects.toThrow('Tag is required');
        });

        it('should throw error when partialTag is missing for getTagSuggestions', async () => {
            const config: OperationConfig = {
                resource: 'search',
                operation: 'getTagSuggestions',
                parameters: {},
            };

            await expect(router.route(config, mockClient)).rejects.toThrow('Partial tag is required');
        });

        it('should throw error for unknown search operation', async () => {
            const config: OperationConfig = {
                resource: 'search',
                operation: 'unknownOperation',
                parameters: {},
            };

            await expect(router.route(config, mockClient)).rejects.toThrow('Unknown search operation');
        });

        it('should use default values for optional parameters', async () => {
            const config: OperationConfig = {
                resource: 'search',
                operation: 'getTagSuggestions',
                parameters: {
                    partialTag: 'test'
                },
            };

            mockSearchOperations.getTagSuggestions.mockResolvedValue({
                success: true,
                data: { suggestions: [] },
                metadata: { operation: 'getTagSuggestions' }
            });

            await router.route(config, mockClient);

            expect(mockSearchOperations.getTagSuggestions).toHaveBeenCalledWith(
                mockClient,
                'test',
                10 // default limit
            );
        });

        it('should search by keyword', async () => {
            const config: OperationConfig = {
                resource: 'search',
                operation: 'searchByKeyword',
                parameters: {
                    keyword: 'photography',
                    options: { limit: 25, sortBy: 'notes' }
                },
            };

            const mockResult = {
                success: true,
                data: { posts: [], keyword: 'photography' },
                metadata: { operation: 'searchByKeyword' }
            };

            mockSearchOperations.searchByKeyword.mockResolvedValue(mockResult);

            const result = await router.route(config, mockClient);

            expect(mockSearchOperations.searchByKeyword).toHaveBeenCalledWith(
                mockClient,
                'photography',
                { limit: 25, sortBy: 'notes' }
            );
            expect(result).toEqual(mockResult);
        });

        it('should perform advanced search', async () => {
            const config: OperationConfig = {
                resource: 'search',
                operation: 'advancedSearch',
                parameters: {
                    keyword: 'art',
                    postType: 'photo',
                    minNotes: 50
                },
            };

            const mockResult = {
                success: true,
                data: { posts: [] },
                metadata: { operation: 'advancedSearch' }
            };

            mockSearchOperations.advancedSearch.mockResolvedValue(mockResult);

            const result = await router.route(config, mockClient);

            expect(mockSearchOperations.advancedSearch).toHaveBeenCalledWith(
                mockClient,
                { keyword: 'art', postType: 'photo', minNotes: 50 }
            );
            expect(result).toEqual(mockResult);
        });

        it('should throw error when keyword is missing for searchByKeyword', async () => {
            const config: OperationConfig = {
                resource: 'search',
                operation: 'searchByKeyword',
                parameters: {},
            };

            await expect(router.route(config, mockClient)).rejects.toThrow('Keyword is required');
        });
    });

    describe('utility methods', () => {
        it('should clean blog name by removing .tumblr.com suffix', async () => {
            const config: OperationConfig = {
                resource: 'blog',
                operation: 'getInfo',
                blogName: 'testblog.tumblr.com',
                parameters: {},
            };

            mockClient.blogInfo.mockResolvedValue({ blog: { name: 'testblog' } });

            await router.route(config, mockClient);

            expect(mockClient.blogInfo).toHaveBeenCalledWith('testblog');
        });

        it('should handle blog name without .tumblr.com suffix', async () => {
            const config: OperationConfig = {
                resource: 'blog',
                operation: 'getInfo',
                blogName: 'testblog',
                parameters: {},
            };

            mockClient.blogInfo.mockResolvedValue({ blog: { name: 'testblog' } });

            await router.route(config, mockClient);

            expect(mockClient.blogInfo).toHaveBeenCalledWith('testblog');
        });
    });
});