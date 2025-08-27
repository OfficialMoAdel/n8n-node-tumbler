import { PostOperations } from '../nodes/Tumblr/operations/PostOperations';
import { TumblrClient } from '../nodes/Tumblr/TumblrAuthenticator';
import { NodeOperationError } from 'n8n-workflow';

describe('PostOperations', () => {
    let postOps: PostOperations;
    let mockClient: jest.Mocked<TumblrClient>;

    beforeEach(() => {
        postOps = new PostOperations();

        mockClient = {
            createTextPost: jest.fn(),
            editPost: jest.fn(),
            deletePost: jest.fn(),
            blogPosts: jest.fn(),
            reblogPost: jest.fn(),
        } as any;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createTextPost', () => {
        it('should create text post with title and body', async () => {
            const mockResponse = {
                response: {
                    id: '12345',
                    post_url: 'https://testblog.tumblr.com/post/12345',
                },
            };

            mockClient.createTextPost.mockResolvedValue(mockResponse);

            const params = {
                title: 'Test Post',
                body: 'This is a test post',
                tags: ['test', 'post'],
                state: 'published',
            };

            const result = await postOps.createTextPost(mockClient, 'testblog.tumblr.com', params);

            expect(mockClient.createTextPost).toHaveBeenCalledWith('testblog', {
                title: 'Test Post',
                body: 'This is a test post',
                tags: ['test', 'post'],
                state: 'published',
                format: 'html',
                slug: undefined,
                date: undefined,
            });

            expect(result).toEqual({
                success: true,
                operation: 'text',
                post_id: '12345',
                post_url: 'https://testblog.tumblr.com/post/12345',
                timestamp: expect.any(String),
                response: mockResponse.response,
            });
        });

        it('should create text post with only title', async () => {
            const mockResponse = { response: { id: '12345' } };
            mockClient.createTextPost.mockResolvedValue(mockResponse);

            const params = { title: 'Title Only Post' };

            await postOps.createTextPost(mockClient, 'testblog', params);

            expect(mockClient.createTextPost).toHaveBeenCalledWith('testblog', expect.objectContaining({
                title: 'Title Only Post',
                body: '',
            }));
        });

        it('should create text post with only body', async () => {
            const mockResponse = { response: { id: '12345' } };
            mockClient.createTextPost.mockResolvedValue(mockResponse);

            const params = { body: 'Body only content' };

            await postOps.createTextPost(mockClient, 'testblog', params);

            expect(mockClient.createTextPost).toHaveBeenCalledWith('testblog', expect.objectContaining({
                title: '',
                body: 'Body only content',
            }));
        });

        it('should throw error when both title and body are missing', async () => {
            const params = { tags: ['test'] };

            await expect(postOps.createTextPost(mockClient, 'testblog', params))
                .rejects.toThrow('Text posts require either a title or body content');
        });

        it('should handle string tags by splitting on comma', async () => {
            const mockResponse = { response: { id: '12345' } };
            mockClient.createTextPost.mockResolvedValue(mockResponse);

            const params = {
                title: 'Test Post',
                tags: 'tag1, tag2, tag3',
            };

            await postOps.createTextPost(mockClient, 'testblog', params);

            expect(mockClient.createTextPost).toHaveBeenCalledWith('testblog', expect.objectContaining({
                tags: ['tag1', 'tag2', 'tag3'],
            }));
        });

        it('should handle array tags', async () => {
            const mockResponse = { response: { id: '12345' } };
            mockClient.createTextPost.mockResolvedValue(mockResponse);

            const params = {
                title: 'Test Post',
                tags: ['tag1', 'tag2', 'tag3'],
            };

            await postOps.createTextPost(mockClient, 'testblog', params);

            expect(mockClient.createTextPost).toHaveBeenCalledWith('testblog', expect.objectContaining({
                tags: ['tag1', 'tag2', 'tag3'],
            }));
        });

        it('should validate title length', async () => {
            const longTitle = 'a'.repeat(301); // Exceeds 300 character limit
            const params = { title: longTitle };

            await expect(postOps.createTextPost(mockClient, 'testblog', params))
                .rejects.toThrow('Post title cannot exceed 300 characters');
        });

        it('should validate body length', async () => {
            const longBody = 'a'.repeat(4097); // Exceeds 4096 character limit
            const params = { body: longBody };

            await expect(postOps.createTextPost(mockClient, 'testblog', params))
                .rejects.toThrow('Post body cannot exceed 4096 characters');
        });

        it('should handle API errors', async () => {
            mockClient.createTextPost.mockRejectedValue(new Error('API Error'));

            const params = { title: 'Test Post' };

            await expect(postOps.createTextPost(mockClient, 'testblog', params))
                .rejects.toThrow(NodeOperationError);
        });
    });

    describe('updatePost', () => {
        it('should update post with provided fields', async () => {
            const mockResponse = { response: { id: '12345' } };
            mockClient.editPost.mockResolvedValue(mockResponse);

            const params = {
                title: 'Updated Title',
                body: 'Updated body',
                tags: ['updated', 'post'],
            };

            const result = await postOps.updatePost(mockClient, 'testblog', '12345', params);

            expect(mockClient.editPost).toHaveBeenCalledWith('testblog', '12345', {
                title: 'Updated Title',
                body: 'Updated body',
                tags: ['updated', 'post'],
            });

            expect(result.success).toBe(true);
            expect(result.operation).toBe('update');
        });

        it('should only include provided fields in update', async () => {
            const mockResponse = { response: { id: '12345' } };
            mockClient.editPost.mockResolvedValue(mockResponse);

            const params = { title: 'New Title' }; // Only title provided

            await postOps.updatePost(mockClient, 'testblog', '12345', params);

            expect(mockClient.editPost).toHaveBeenCalledWith('testblog', '12345', {
                title: 'New Title',
            });
        });

        it('should throw error when post ID is missing', async () => {
            const params = { title: 'Updated Title' };

            await expect(postOps.updatePost(mockClient, 'testblog', '', params))
                .rejects.toThrow('Post ID is required for update operation');
        });

        it('should handle API errors', async () => {
            mockClient.editPost.mockRejectedValue(new Error('Post not found'));

            const params = { title: 'Updated Title' };

            await expect(postOps.updatePost(mockClient, 'testblog', '12345', params))
                .rejects.toThrow(NodeOperationError);
        });
    });

    describe('deletePost', () => {
        it('should delete post successfully', async () => {
            const mockResponse = { success: true };
            mockClient.deletePost.mockResolvedValue(mockResponse);

            const result = await postOps.deletePost(mockClient, 'testblog', '12345');

            expect(mockClient.deletePost).toHaveBeenCalledWith('testblog', '12345');
            expect(result).toEqual({
                success: true,
                message: 'Post deleted successfully',
                post_id: '12345',
                blog_name: 'testblog',
                timestamp: expect.any(String),
                response: mockResponse,
            });
        });

        it('should throw error when post ID is missing', async () => {
            await expect(postOps.deletePost(mockClient, 'testblog', ''))
                .rejects.toThrow('Post ID is required for delete operation');
        });

        it('should handle API errors', async () => {
            mockClient.deletePost.mockRejectedValue(new Error('Post not found'));

            await expect(postOps.deletePost(mockClient, 'testblog', '12345'))
                .rejects.toThrow(NodeOperationError);
        });
    });

    describe('getPost', () => {
        it('should get specific post', async () => {
            const mockResponse = {
                response: {
                    posts: [
                        {
                            id: '12345',
                            type: 'text',
                            title: 'Test Post',
                            body: 'Test content',
                            blog_name: 'testblog',
                        },
                    ],
                    blog: { name: 'testblog' },
                },
            };

            mockClient.blogPosts.mockResolvedValue(mockResponse);

            const result = await postOps.getPost(mockClient, 'testblog', '12345');

            expect(mockClient.blogPosts).toHaveBeenCalledWith('testblog', {
                id: '12345',
                notes_info: false,
                reblog_info: false,
            });

            expect(result.post).toEqual(expect.objectContaining({
                id: '12345',
                type: 'text',
                title: 'Test Post',
                body: 'Test content',
            }));
            expect(result.blog).toEqual({ name: 'testblog' });
        });

        it('should get post with additional options', async () => {
            const mockResponse = { response: { posts: [{ id: '12345' }] } };
            mockClient.blogPosts.mockResolvedValue(mockResponse);

            const options = { notesInfo: true, reblogInfo: true };

            await postOps.getPost(mockClient, 'testblog', '12345', options);

            expect(mockClient.blogPosts).toHaveBeenCalledWith('testblog', {
                id: '12345',
                notes_info: true,
                reblog_info: true,
            });
        });

        it('should throw error when post not found', async () => {
            const mockResponse = { response: { posts: [] } };
            mockClient.blogPosts.mockResolvedValue(mockResponse);

            await expect(postOps.getPost(mockClient, 'testblog', '12345'))
                .rejects.toThrow('Post with ID 12345 not found');
        });

        it('should throw error when post ID is missing', async () => {
            await expect(postOps.getPost(mockClient, 'testblog', ''))
                .rejects.toThrow('Post ID is required for get operation');
        });
    });

    describe('reblogPost', () => {
        it('should reblog post with comment and tags', async () => {
            const mockResponse = { response: { id: '67890' } };
            mockClient.reblogPost.mockResolvedValue(mockResponse);

            const params = {
                id: '12345',
                reblogKey: 'abc123',
                comment: 'Great post!',
                tags: ['reblog', 'awesome'],
            };

            const result = await postOps.reblogPost(mockClient, 'testblog', params);

            expect(mockClient.reblogPost).toHaveBeenCalledWith('testblog', {
                id: '12345',
                reblog_key: 'abc123',
                comment: 'Great post!',
                tags: ['reblog', 'awesome'],
            });

            expect(result.success).toBe(true);
            expect(result.operation).toBe('reblog');
        });

        it('should reblog post without comment', async () => {
            const mockResponse = { response: { id: '67890' } };
            mockClient.reblogPost.mockResolvedValue(mockResponse);

            const params = {
                id: '12345',
                reblogKey: 'abc123',
            };

            await postOps.reblogPost(mockClient, 'testblog', params);

            expect(mockClient.reblogPost).toHaveBeenCalledWith('testblog', {
                id: '12345',
                reblog_key: 'abc123',
                comment: '',
                tags: [],
            });
        });

        it('should throw error when ID or reblog key is missing', async () => {
            const params = { id: '12345' }; // Missing reblog key

            await expect(postOps.reblogPost(mockClient, 'testblog', params))
                .rejects.toThrow('Post ID and reblog key are required for reblogging');
        });

        it('should handle API errors', async () => {
            mockClient.reblogPost.mockRejectedValue(new Error('Reblog failed'));

            const params = { id: '12345', reblogKey: 'abc123' };

            await expect(postOps.reblogPost(mockClient, 'testblog', params))
                .rejects.toThrow(NodeOperationError);
        });
    });

    describe('utility methods', () => {
        it('should format tags from string', () => {
            const postOps = new PostOperations();
            const tags = (postOps as any).formatTags('tag1, tag2, tag3');
            expect(tags).toEqual(['tag1', 'tag2', 'tag3']);
        });

        it('should format tags from array', () => {
            const postOps = new PostOperations();
            const tags = (postOps as any).formatTags(['tag1', 'tag2', 'tag3']);
            expect(tags).toEqual(['tag1', 'tag2', 'tag3']);
        });

        it('should handle empty tags', () => {
            const postOps = new PostOperations();
            expect((postOps as any).formatTags(null)).toEqual([]);
            expect((postOps as any).formatTags(undefined)).toEqual([]);
            expect((postOps as any).formatTags('')).toEqual([]);
            expect((postOps as any).formatTags([])).toEqual([]);
        });

        it('should clean blog name', () => {
            const postOps = new PostOperations();
            expect((postOps as any).cleanBlogName('testblog.tumblr.com')).toBe('testblog');
            expect((postOps as any).cleanBlogName('testblog')).toBe('testblog');
        });
    });
});