import { BlogOperations } from '../nodes/Tumblr/operations/BlogOperations';
import { TumblrClient } from '../nodes/Tumblr/TumblrAuthenticator';
import { NodeOperationError } from 'n8n-workflow';

describe('BlogOperations', () => {
    let blogOps: BlogOperations;
    let mockClient: jest.Mocked<TumblrClient>;

    beforeEach(() => {
        blogOps = new BlogOperations();

        mockClient = {
            blogInfo: jest.fn(),
            blogPosts: jest.fn(),
        } as any;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getBlogInfo', () => {
        it('should get blog information successfully', async () => {
            const mockBlogInfo = {
                response: {
                    blog: {
                        name: 'testblog',
                        title: 'Test Blog',
                        description: 'A test blog',
                        url: 'https://testblog.tumblr.com',
                        uuid: 'test-uuid',
                        updated: 1234567890,
                        posts: 100,
                        total_posts: 100,
                        followers: 50,
                        share_likes: true,
                        share_following: false,
                        can_be_followed: true,
                        is_nsfw: false,
                        theme: { background_color: '#ffffff' },
                        avatar: [{ url: 'https://example.com/avatar.jpg' }],
                    },
                },
            };

            mockClient.blogInfo.mockResolvedValue(mockBlogInfo);

            const result = await blogOps.getBlogInfo(mockClient, 'testblog.tumblr.com');

            expect(mockClient.blogInfo).toHaveBeenCalledWith('testblog');
            expect(result).toEqual({
                name: 'testblog',
                title: 'Test Blog',
                description: 'A test blog',
                url: 'https://testblog.tumblr.com',
                uuid: 'test-uuid',
                updated: 1234567890,
                posts: 100,
                total_posts: 100,
                followers: 50,
                share_likes: true,
                share_following: false,
                can_be_followed: true,
                is_nsfw: false,
                theme: { background_color: '#ffffff' },
                avatar: [{ url: 'https://example.com/avatar.jpg' }],
            });
        });

        it('should handle blog info without response wrapper', async () => {
            const mockBlogInfo = {
                blog: {
                    name: 'testblog',
                    title: 'Test Blog',
                    description: 'A test blog',
                },
            };

            mockClient.blogInfo.mockResolvedValue(mockBlogInfo);

            const result = await blogOps.getBlogInfo(mockClient, 'testblog');

            expect(result.name).toBe('testblog');
            expect(result.title).toBe('Test Blog');
        });

        it('should throw error when blog info fails', async () => {
            mockClient.blogInfo.mockRejectedValue(new Error('Blog not found'));

            await expect(blogOps.getBlogInfo(mockClient, 'nonexistent')).rejects.toThrow(NodeOperationError);
        });

        it('should clean blog name by removing .tumblr.com suffix', async () => {
            const mockBlogInfo = { blog: { name: 'testblog' } };
            mockClient.blogInfo.mockResolvedValue(mockBlogInfo);

            await blogOps.getBlogInfo(mockClient, 'testblog.tumblr.com');

            expect(mockClient.blogInfo).toHaveBeenCalledWith('testblog');
        });
    });

    describe('getBlogPosts', () => {
        it('should get blog posts with default options', async () => {
            const mockPosts = {
                response: {
                    posts: [
                        {
                            id: '12345',
                            type: 'text',
                            blog_name: 'testblog',
                            title: 'Test Post',
                            body: 'Test content',
                            tags: ['test'],
                            timestamp: 1234567890,
                        },
                    ],
                    total_posts: 1,
                    blog: { name: 'testblog' },
                },
            };

            mockClient.blogPosts.mockResolvedValue(mockPosts);

            const result = await blogOps.getBlogPosts(mockClient, 'testblog');

            expect(mockClient.blogPosts).toHaveBeenCalledWith('testblog', {
                limit: 20,
                offset: 0,
                type: undefined,
                tag: undefined,
                before: undefined,
                filter: 'text',
                reblog_info: false,
                notes_info: false,
            });

            expect(result.posts).toBeDefined();
            expect(Array.isArray(result.posts)).toBe(true);
            expect(result.posts).toHaveLength(1);
            expect((result.posts as any[])[0]).toEqual(expect.objectContaining({
                id: '12345',
                type: 'text',
                title: 'Test Post',
                body: 'Test content',
            }));
            expect(result.total_posts).toBe(1);
        });

        it('should get blog posts with custom options', async () => {
            const mockPosts = {
                response: {
                    posts: [],
                    total_posts: 0,
                },
            };

            mockClient.blogPosts.mockResolvedValue(mockPosts);

            const options = {
                limit: 10,
                offset: 5,
                type: 'photo',
                tag: 'nature',
                filter: 'raw',
                reblogInfo: true,
                notesInfo: true,
            };

            await blogOps.getBlogPosts(mockClient, 'testblog', options);

            expect(mockClient.blogPosts).toHaveBeenCalledWith('testblog', {
                limit: 10,
                offset: 5,
                type: 'photo',
                tag: 'nature',
                before: undefined,
                filter: 'raw',
                reblog_info: true,
                notes_info: true,
            });
        });

        it('should limit posts to maximum of 50', async () => {
            const mockPosts = { response: { posts: [], total_posts: 0 } };
            mockClient.blogPosts.mockResolvedValue(mockPosts);

            await blogOps.getBlogPosts(mockClient, 'testblog', { limit: 100 });

            expect(mockClient.blogPosts).toHaveBeenCalledWith('testblog', expect.objectContaining({
                limit: 50,
            }));
        });

        it('should handle posts without response wrapper', async () => {
            const mockPosts = {
                posts: [{ id: '12345', type: 'text' }],
                total_posts: 1,
            };

            mockClient.blogPosts.mockResolvedValue(mockPosts);

            const result = await blogOps.getBlogPosts(mockClient, 'testblog');

            expect(result.posts).toHaveLength(1);
            expect(result.total_posts).toBe(1);
        });

        it('should throw error when getting posts fails', async () => {
            mockClient.blogPosts.mockRejectedValue(new Error('API error'));

            await expect(blogOps.getBlogPosts(mockClient, 'testblog')).rejects.toThrow(NodeOperationError);
        });
    });

    describe('getBlogFollowers', () => {
        it('should get blog follower information', async () => {
            const mockBlogInfo = {
                response: {
                    blog: {
                        name: 'testblog',
                        followers: 100,
                    },
                },
            };

            mockClient.blogInfo.mockResolvedValue(mockBlogInfo);

            const result = await blogOps.getBlogFollowers(mockClient, 'testblog');

            expect(result).toEqual({
                blog_name: 'testblog',
                follower_count: 100,
                message: 'Follower list access may be restricted. Only follower count is available.',
                followers: [],
            });
        });

        it('should handle blog without follower count', async () => {
            const mockBlogInfo = {
                blog: { name: 'testblog' },
            };

            mockClient.blogInfo.mockResolvedValue(mockBlogInfo);

            const result = await blogOps.getBlogFollowers(mockClient, 'testblog');

            expect(result.follower_count).toBe(0);
        });
    });

    describe('searchBlogPosts', () => {
        it('should search posts by query', async () => {
            const mockPosts = {
                response: {
                    posts: [
                        {
                            id: '1',
                            title: 'Test Post About Cats',
                            body: 'This is about cats',
                            tags: ['cats', 'pets'],
                        },
                        {
                            id: '2',
                            title: 'Dog Training',
                            body: 'This is about dogs',
                            tags: ['dogs', 'training'],
                        },
                        {
                            id: '3',
                            caption: 'Beautiful cat photo',
                            tags: ['cats', 'photography'],
                        },
                    ],
                    blog: { name: 'testblog' },
                },
            };

            mockClient.blogPosts.mockResolvedValue(mockPosts);

            const result = await blogOps.searchBlogPosts(mockClient, 'testblog', 'cats');

            expect(result.posts).toBeDefined();
            expect(Array.isArray(result.posts)).toBe(true);
            expect(result.posts).toHaveLength(2); // Should find posts 1 and 3
            expect(result.total_found).toBe(2);
            expect(result.query).toBe('cats');
            expect((result.posts as any[])[0].id).toBe('1');
            expect((result.posts as any[])[1].id).toBe('3');
        });

        it('should perform case-insensitive search', async () => {
            const mockPosts = {
                response: {
                    posts: [
                        {
                            id: '1',
                            title: 'CATS ARE GREAT',
                            body: 'Cats are amazing pets',
                        },
                    ],
                },
            };

            mockClient.blogPosts.mockResolvedValue(mockPosts);

            const result = await blogOps.searchBlogPosts(mockClient, 'testblog', 'cats');

            expect(result.posts).toBeDefined();
            expect(Array.isArray(result.posts)).toBe(true);
            expect(result.posts).toHaveLength(1);
            expect((result.posts as any[])[0].id).toBe('1');
        });

        it('should return empty results when no matches found', async () => {
            const mockPosts = {
                response: {
                    posts: [
                        {
                            id: '1',
                            title: 'Dog Training',
                            body: 'This is about dogs',
                        },
                    ],
                },
            };

            mockClient.blogPosts.mockResolvedValue(mockPosts);

            const result = await blogOps.searchBlogPosts(mockClient, 'testblog', 'cats');

            expect(result.posts).toHaveLength(0);
            expect(result.total_found).toBe(0);
        });

        it('should throw error when search fails', async () => {
            mockClient.blogPosts.mockRejectedValue(new Error('API error'));

            await expect(blogOps.searchBlogPosts(mockClient, 'testblog', 'query')).rejects.toThrow(NodeOperationError);
        });
    });

    describe('formatPost', () => {
        it('should format post with all fields', () => {
            const rawPost = {
                id: '12345',
                type: 'text',
                blog_name: 'testblog',
                post_url: 'https://testblog.tumblr.com/post/12345',
                timestamp: 1234567890,
                date: '2023-01-01 12:00:00 GMT',
                tags: ['test', 'post'],
                state: 'published',
                format: 'html',
                title: 'Test Post',
                body: 'Test content',
                note_count: 5,
            };

            const blogOps = new BlogOperations();
            const formatted = (blogOps as any).formatPost(rawPost);

            expect(formatted).toEqual(expect.objectContaining({
                id: '12345',
                type: 'text',
                blog_name: 'testblog',
                title: 'Test Post',
                body: 'Test content',
                tags: ['test', 'post'],
                note_count: 5,
            }));
        });

        it('should handle posts with missing optional fields', () => {
            const rawPost = {
                id: '12345',
                type: 'text',
                blog_name: 'testblog',
            };

            const blogOps = new BlogOperations();
            const formatted = (blogOps as any).formatPost(rawPost);

            expect(formatted.id).toBe('12345');
            expect(formatted.tags).toEqual([]);
            expect(formatted.note_count).toBe(0);
        });
    });
});