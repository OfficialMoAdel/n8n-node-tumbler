import { QueueOperations } from '../nodes/Tumblr/operations/QueueOperations';
import { TumblrClient } from '../nodes/Tumblr/TumblrAuthenticator';
import { NodeOperationError } from 'n8n-workflow';

// Mock PostOperations
jest.mock('../nodes/Tumblr/operations/PostOperations', () => ({
    PostOperations: jest.fn().mockImplementation(() => ({
        createTextPost: jest.fn(),
        createPhotoPost: jest.fn(),
        createQuotePost: jest.fn(),
        createLinkPost: jest.fn(),
        createChatPost: jest.fn(),
        createVideoPost: jest.fn(),
        createAudioPost: jest.fn(),
        deletePost: jest.fn(),
        updatePost: jest.fn(),
    })),
}));

describe('QueueOperations', () => {
    let queueOps: QueueOperations;
    let mockClient: jest.Mocked<TumblrClient>;
    let mockPostOps: any;

    beforeEach(() => {
        queueOps = new QueueOperations();
        mockPostOps = (queueOps as any).postOps;

        mockClient = {
            blogQueue: jest.fn(),
        } as any;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('addToQueue', () => {
        it('should add text post to queue', async () => {
            const mockResponse = {
                success: true,
                operation: 'text',
                post_id: '12345',
            };

            mockPostOps.createTextPost.mockResolvedValue(mockResponse);

            const params = {
                type: 'text',
                title: 'Queued Post',
                body: 'This will be queued',
                scheduleTime: '2024-01-01T12:00:00Z',
            };

            const result = await queueOps.addToQueue(mockClient, 'testblog', params);

            expect(mockPostOps.createTextPost).toHaveBeenCalledWith(mockClient, 'testblog', {
                type: 'text',
                title: 'Queued Post',
                body: 'This will be queued',
                scheduleTime: '2024-01-01T12:00:00Z',
                state: 'queue',
                publishOn: '2024-01-01T12:00:00Z',
            });

            expect(result).toEqual({
                success: true,
                operation: 'addToQueue',
                post_id: '12345',
                queue_status: 'added',
                scheduled_time: '2024-01-01T12:00:00Z',
            });
        });

        it('should add photo post to queue', async () => {
            const mockResponse = { success: true, operation: 'photo', post_id: '12345' };
            mockPostOps.createPhotoPost.mockResolvedValue(mockResponse);

            const params = {
                type: 'photo',
                caption: 'Queued photo',
                source: 'http://example.com/photo.jpg',
            };

            await queueOps.addToQueue(mockClient, 'testblog', params);

            expect(mockPostOps.createPhotoPost).toHaveBeenCalledWith(mockClient, 'testblog', expect.objectContaining({
                state: 'queue',
            }));
        });

        it('should handle all post types', async () => {
            const mockResponse = { success: true, post_id: '12345' };

            mockPostOps.createQuotePost.mockResolvedValue(mockResponse);
            mockPostOps.createLinkPost.mockResolvedValue(mockResponse);
            mockPostOps.createChatPost.mockResolvedValue(mockResponse);
            mockPostOps.createVideoPost.mockResolvedValue(mockResponse);
            mockPostOps.createAudioPost.mockResolvedValue(mockResponse);

            const postTypes = ['quote', 'link', 'chat', 'video', 'audio'];

            for (const type of postTypes) {
                const params = { type, [type === 'quote' ? 'quote' : 'title']: 'test' };
                await queueOps.addToQueue(mockClient, 'testblog', params);
            }

            expect(mockPostOps.createQuotePost).toHaveBeenCalled();
            expect(mockPostOps.createLinkPost).toHaveBeenCalled();
            expect(mockPostOps.createChatPost).toHaveBeenCalled();
            expect(mockPostOps.createVideoPost).toHaveBeenCalled();
            expect(mockPostOps.createAudioPost).toHaveBeenCalled();
        });

        it('should throw error for invalid post type', async () => {
            const params = { type: 'invalid', title: 'test' };

            await expect(queueOps.addToQueue(mockClient, 'testblog', params))
                .rejects.toThrow('Unknown post type: invalid');
        });

        it('should handle API errors', async () => {
            mockPostOps.createTextPost.mockRejectedValue(new Error('API Error'));

            const params = { type: 'text', title: 'test' };

            await expect(queueOps.addToQueue(mockClient, 'testblog', params))
                .rejects.toThrow(NodeOperationError);
        });
    });

    describe('getQueue', () => {
        it('should get queue posts with default options', async () => {
            const mockResponse = {
                response: {
                    posts: [
                        {
                            id: '12345',
                            type: 'text',
                            state: 'queue',
                            title: 'Queued Post',
                            scheduled_publish_time: '2024-01-01T12:00:00Z',
                        },
                    ],
                    blog: { name: 'testblog' },
                },
            };

            mockClient.blogQueue.mockResolvedValue(mockResponse);

            const result = await queueOps.getQueue(mockClient, 'testblog');

            expect(mockClient.blogQueue).toHaveBeenCalledWith('testblog', {
                limit: 20,
                offset: 0,
                filter: 'text',
            });

            expect(result.queue_posts).toBeDefined();
            expect(Array.isArray(result.queue_posts)).toBe(true);
            expect(result.queue_posts).toHaveLength(1);
            expect((result.queue_posts as any[])[0]).toEqual(expect.objectContaining({
                id: '12345',
                type: 'text',
                state: 'queue',
                title: 'Queued Post',
            }));
        });

        it('should get queue posts with custom options', async () => {
            const mockResponse = { response: { posts: [] } };
            mockClient.blogQueue.mockResolvedValue(mockResponse);

            const options = {
                limit: 10,
                offset: 5,
                filter: 'raw',
            };

            await queueOps.getQueue(mockClient, 'testblog', options);

            expect(mockClient.blogQueue).toHaveBeenCalledWith('testblog', {
                limit: 10,
                offset: 5,
                filter: 'raw',
            });
        });

        it('should limit posts to maximum of 50', async () => {
            const mockResponse = { response: { posts: [] } };
            mockClient.blogQueue.mockResolvedValue(mockResponse);

            await queueOps.getQueue(mockClient, 'testblog', { limit: 100 });

            expect(mockClient.blogQueue).toHaveBeenCalledWith('testblog', expect.objectContaining({
                limit: 50,
            }));
        });

        it('should handle queue without response wrapper', async () => {
            const mockResponse = {
                posts: [{ id: '12345', type: 'text' }],
            };

            mockClient.blogQueue.mockResolvedValue(mockResponse);

            const result = await queueOps.getQueue(mockClient, 'testblog');

            expect(result.queue_posts).toBeDefined();
            expect(Array.isArray(result.queue_posts)).toBe(true);
            expect(result.queue_posts).toHaveLength(1);
        });

        it('should handle API errors', async () => {
            mockClient.blogQueue.mockRejectedValue(new Error('Queue not accessible'));

            await expect(queueOps.getQueue(mockClient, 'testblog'))
                .rejects.toThrow(NodeOperationError);
        });
    });

    describe('removeFromQueue', () => {
        it('should remove post from queue', async () => {
            const mockResponse = {
                success: true,
                message: 'Post deleted successfully',
                post_id: '12345',
            };

            mockPostOps.deletePost.mockResolvedValue(mockResponse);

            const result = await queueOps.removeFromQueue(mockClient, 'testblog', '12345');

            expect(mockPostOps.deletePost).toHaveBeenCalledWith(mockClient, 'testblog', '12345');
            expect(result).toEqual({
                success: true,
                message: 'Post deleted successfully',
                post_id: '12345',
                operation: 'removeFromQueue',
                queue_status: 'removed',
            });
        });

        it('should throw error when post ID is missing', async () => {
            await expect(queueOps.removeFromQueue(mockClient, 'testblog', ''))
                .rejects.toThrow('Post ID is required to remove from queue');
        });

        it('should handle API errors', async () => {
            mockPostOps.deletePost.mockRejectedValue(new Error('Post not found'));

            await expect(queueOps.removeFromQueue(mockClient, 'testblog', '12345'))
                .rejects.toThrow(NodeOperationError);
        });
    });

    describe('reorderQueue', () => {
        it('should return placeholder response for reordering', async () => {
            const postIds = ['12345', '67890', '11111'];

            const result = await queueOps.reorderQueue(mockClient, 'testblog', postIds);

            expect(result).toEqual({
                success: true,
                operation: 'reorderQueue',
                message: 'Queue reordering is not directly supported by Tumblr API. Consider updating individual post publish times.',
                blog_name: 'testblog',
                post_ids: postIds,
                timestamp: expect.any(String),
            });
        });

        it('should throw error for invalid post IDs', async () => {
            await expect(queueOps.reorderQueue(mockClient, 'testblog', []))
                .rejects.toThrow('Array of post IDs is required for reordering');

            await expect(queueOps.reorderQueue(mockClient, 'testblog', null as any))
                .rejects.toThrow('Array of post IDs is required for reordering');
        });
    });

    describe('updateQueueSchedule', () => {
        it('should update queue post schedule', async () => {
            const mockResponse = {
                success: true,
                operation: 'update',
                post_id: '12345',
            };

            mockPostOps.updatePost.mockResolvedValue(mockResponse);

            const scheduleTime = '2024-01-01T15:00:00Z';
            const result = await queueOps.updateQueueSchedule(mockClient, 'testblog', '12345', scheduleTime);

            expect(mockPostOps.updatePost).toHaveBeenCalledWith(mockClient, 'testblog', '12345', {
                date: scheduleTime,
                state: 'queue',
            });

            expect(result).toEqual({
                success: true,
                operation: 'updateQueueSchedule',
                post_id: '12345',
                scheduled_time: scheduleTime,
            });
        });

        it('should throw error when post ID is missing', async () => {
            await expect(queueOps.updateQueueSchedule(mockClient, 'testblog', '', '2024-01-01T12:00:00Z'))
                .rejects.toThrow('Post ID is required to update schedule');
        });

        it('should throw error when schedule time is missing', async () => {
            await expect(queueOps.updateQueueSchedule(mockClient, 'testblog', '12345', ''))
                .rejects.toThrow('Schedule time is required');
        });
    });

    describe('getQueueStats', () => {
        it('should calculate queue statistics', async () => {
            const mockQueueResponse = {
                queue_posts: [
                    { id: '1', type: 'text', scheduled_publish_time: '2024-01-01T12:00:00Z' },
                    { id: '2', type: 'photo', scheduled_publish_time: '2024-01-01T13:00:00Z' },
                    { id: '3', type: 'text', scheduled_publish_time: null },
                ],
            };

            // Mock the getQueue method
            jest.spyOn(queueOps, 'getQueue').mockResolvedValue(mockQueueResponse);

            const result = await queueOps.getQueueStats(mockClient, 'testblog');

            expect(result).toEqual({
                total_queued: 3,
                by_type: {
                    text: 2,
                    photo: 1,
                },
                next_scheduled: {
                    id: '1',
                    type: 'text',
                    scheduled_time: '2024-01-01T12:00:00Z',
                    title: 'Untitled',
                },
                blog_name: 'testblog',
                timestamp: expect.any(String),
            });
        });

        it('should handle empty queue', async () => {
            const mockQueueResponse = { queue_posts: [] };
            jest.spyOn(queueOps, 'getQueue').mockResolvedValue(mockQueueResponse);

            const result = await queueOps.getQueueStats(mockClient, 'testblog');

            expect(result.total_queued).toBe(0);
            expect(result.by_type).toEqual({});
            expect(result.next_scheduled).toBeNull();
        });
    });

    describe('utility methods', () => {
        it('should format queue post correctly', () => {
            const rawPost = {
                id: '12345',
                type: 'text',
                blog_name: 'testblog',
                state: 'queue',
                title: 'Test Post',
                body: 'A'.repeat(300), // Long body to test truncation
                scheduled_publish_time: '2024-01-01T12:00:00Z',
                tags: ['test', 'queue'],
            };

            const queueOps = new QueueOperations();
            const formatted = (queueOps as any).formatQueuePost(rawPost);

            expect(formatted.id).toBe('12345');
            expect(formatted.body).toHaveLength(203); // 200 chars + '...'
            expect(formatted.body.endsWith('...')).toBe(true);
            expect(formatted.tags).toEqual(['test', 'queue']);
        });

        it('should calculate post type statistics', () => {
            const posts = [
                { type: 'text' },
                { type: 'text' },
                { type: 'photo' },
                { type: 'quote' },
            ];

            const queueOps = new QueueOperations();
            const stats = (queueOps as any).calculatePostTypeStats(posts);

            expect(stats).toEqual({
                text: 2,
                photo: 1,
                quote: 1,
            });
        });

        it('should get next scheduled post', () => {
            const posts = [
                { id: '3', scheduled_publish_time: '2024-01-01T15:00:00Z', type: 'text', title: 'Third' },
                { id: '1', scheduled_publish_time: '2024-01-01T12:00:00Z', type: 'text', title: 'First' },
                { id: '2', scheduled_publish_time: '2024-01-01T13:00:00Z', type: 'photo', caption: 'Second' },
                { id: '4', scheduled_publish_time: null, type: 'text' }, // No schedule
            ];

            const queueOps = new QueueOperations();
            const nextPost = (queueOps as any).getNextScheduledPost(posts);

            expect(nextPost).toEqual({
                id: '1',
                type: 'text',
                scheduled_time: '2024-01-01T12:00:00Z',
                title: 'First',
            });
        });

        it('should return null when no scheduled posts', () => {
            const posts = [
                { id: '1', scheduled_publish_time: null, type: 'text' },
            ];

            const queueOps = new QueueOperations();
            const nextPost = (queueOps as any).getNextScheduledPost(posts);

            expect(nextPost).toBeNull();
        });
    });
});