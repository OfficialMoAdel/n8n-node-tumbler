import { SocialOperations } from '../nodes/Tumblr/operations/SocialOperations';
import { NodeOperationError } from 'n8n-workflow';

describe('SocialOperations', () => {
    let socialOps: SocialOperations;
    let mockClient: any;

    beforeEach(() => {
        socialOps = new SocialOperations();
        mockClient = {
            likePost: jest.fn(),
            unlikePost: jest.fn(),
            followBlog: jest.fn(),
            unfollowBlog: jest.fn(),
            userLikes: jest.fn(),
            userFollowing: jest.fn(),
            userDashboard: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('likePost', () => {
        it('should like a post successfully', async () => {
            const mockResponse = { success: true };
            mockClient.likePost.mockResolvedValue(mockResponse);

            const result = await socialOps.likePost(mockClient, '12345', 'reblog-key');

            expect(mockClient.likePost).toHaveBeenCalledWith('12345', 'reblog-key');
            expect(result).toEqual({
                success: true,
                operation: 'like',
                post_id: '12345',
                reblog_key: 'reblog-key',
                timestamp: expect.any(String),
                response: mockResponse,
            });
        });

        it('should throw error for missing post ID', async () => {
            await expect(
                socialOps.likePost(mockClient, '', 'reblog-key')
            ).rejects.toThrow(NodeOperationError);
        });

        it('should throw error for missing reblog key', async () => {
            await expect(
                socialOps.likePost(mockClient, '12345', '')
            ).rejects.toThrow(NodeOperationError);
        });

        it('should handle API errors', async () => {
            mockClient.likePost.mockRejectedValue(new Error('API Error'));

            await expect(
                socialOps.likePost(mockClient, '12345', 'reblog-key')
            ).rejects.toThrow(NodeOperationError);
        });
    });

    describe('unlikePost', () => {
        it('should unlike a post successfully', async () => {
            const mockResponse = { success: true };
            mockClient.unlikePost.mockResolvedValue(mockResponse);

            const result = await socialOps.unlikePost(mockClient, '12345', 'reblog-key');

            expect(mockClient.unlikePost).toHaveBeenCalledWith('12345', 'reblog-key');
            expect(result).toEqual({
                success: true,
                operation: 'unlike',
                post_id: '12345',
                reblog_key: 'reblog-key',
                timestamp: expect.any(String),
                response: mockResponse,
            });
        });

        it('should throw error for missing post ID', async () => {
            await expect(
                socialOps.unlikePost(mockClient, '', 'reblog-key')
            ).rejects.toThrow(NodeOperationError);
        });

        it('should throw error for missing reblog key', async () => {
            await expect(
                socialOps.unlikePost(mockClient, '12345', '')
            ).rejects.toThrow(NodeOperationError);
        });

        it('should handle API errors', async () => {
            mockClient.unlikePost.mockRejectedValue(new Error('API Error'));

            await expect(
                socialOps.unlikePost(mockClient, '12345', 'reblog-key')
            ).rejects.toThrow(NodeOperationError);
        });
    });

    describe('followBlog', () => {
        it('should follow a blog successfully', async () => {
            const mockResponse = { success: true };
            mockClient.followBlog.mockResolvedValue(mockResponse);

            const result = await socialOps.followBlog(mockClient, 'test-blog');

            expect(mockClient.followBlog).toHaveBeenCalledWith('test-blog');
            expect(result).toEqual({
                success: true,
                operation: 'follow',
                blog_name: 'test-blog',
                timestamp: expect.any(String),
                response: mockResponse,
            });
        });

        it('should clean blog name', async () => {
            const mockResponse = { success: true };
            mockClient.followBlog.mockResolvedValue(mockResponse);

            await socialOps.followBlog(mockClient, 'test-blog.tumblr.com');

            expect(mockClient.followBlog).toHaveBeenCalledWith('test-blog');
        });

        it('should throw error for missing blog name', async () => {
            await expect(
                socialOps.followBlog(mockClient, '')
            ).rejects.toThrow(NodeOperationError);
        });

        it('should handle API errors', async () => {
            mockClient.followBlog.mockRejectedValue(new Error('API Error'));

            await expect(
                socialOps.followBlog(mockClient, 'test-blog')
            ).rejects.toThrow(NodeOperationError);
        });
    });

    describe('unfollowBlog', () => {
        it('should unfollow a blog successfully', async () => {
            const mockResponse = { success: true };
            mockClient.unfollowBlog.mockResolvedValue(mockResponse);

            const result = await socialOps.unfollowBlog(mockClient, 'test-blog');

            expect(mockClient.unfollowBlog).toHaveBeenCalledWith('test-blog');
            expect(result).toEqual({
                success: true,
                operation: 'unfollow',
                blog_name: 'test-blog',
                timestamp: expect.any(String),
                response: mockResponse,
            });
        });

        it('should clean blog name', async () => {
            const mockResponse = { success: true };
            mockClient.unfollowBlog.mockResolvedValue(mockResponse);

            await socialOps.unfollowBlog(mockClient, 'test-blog.tumblr.com');

            expect(mockClient.unfollowBlog).toHaveBeenCalledWith('test-blog');
        });

        it('should throw error for missing blog name', async () => {
            await expect(
                socialOps.unfollowBlog(mockClient, '')
            ).rejects.toThrow(NodeOperationError);
        });

        it('should handle API errors', async () => {
            mockClient.unfollowBlog.mockRejectedValue(new Error('API Error'));

            await expect(
                socialOps.unfollowBlog(mockClient, 'test-blog')
            ).rejects.toThrow(NodeOperationError);
        });
    });

    describe('getUserLikes', () => {
        it('should get user likes successfully', async () => {
            const mockResponse = {
                response: {
                    liked_posts: [
                        {
                            id: '12345',
                            type: 'text',
                            blog_name: 'test-blog',
                            post_url: 'https://test-blog.tumblr.com/post/12345',
                            liked_timestamp: 1640995200,
                            title: 'Liked Post',
                            body: 'This is a liked post content that is longer than 200 characters to test the truncation functionality. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                            tags: ['liked', 'test'],
                            note_count: 42,
                            reblog_key: 'reblog-key',
                        },
                    ],
                    liked_count: 1,
                },
            };

            mockClient.userLikes.mockResolvedValue(mockResponse);

            const result = await socialOps.getUserLikes(mockClient);

            expect(mockClient.userLikes).toHaveBeenCalledWith({
                limit: 20,
                offset: 0,
                before: undefined,
                after: undefined,
            });

            expect(result).toEqual({
                liked_posts: [
                    {
                        id: '12345',
                        type: 'text',
                        blog_name: 'test-blog',
                        post_url: 'https://test-blog.tumblr.com/post/12345',
                        liked_timestamp: 1640995200,
                        tags: ['liked', 'test'],
                        title: 'Liked Post',
                        body: 'This is a liked post content that is longer than 200 characters to test the truncation functionality. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labor...',
                        caption: undefined,
                        quote: undefined,
                        source: undefined,
                        url: undefined,
                        note_count: 42,
                        reblog_key: 'reblog-key',
                    },
                ],
                liked_count: 1,
                pagination: {
                    limit: 20,
                    offset: 0,
                    has_more: false,
                },
            });
        });

        it('should handle custom options', async () => {
            const mockResponse = {
                response: {
                    liked_posts: [],
                    liked_count: 0,
                },
            };

            mockClient.userLikes.mockResolvedValue(mockResponse);

            await socialOps.getUserLikes(mockClient, {
                limit: 10,
                offset: 5,
                before: '1640995200',
                after: '1640908800',
            });

            expect(mockClient.userLikes).toHaveBeenCalledWith({
                limit: 10,
                offset: 5,
                before: '1640995200',
                after: '1640908800',
            });
        });

        it('should enforce API limits', async () => {
            const mockResponse = {
                response: { liked_posts: [], liked_count: 0 },
            };

            mockClient.userLikes.mockResolvedValue(mockResponse);

            await socialOps.getUserLikes(mockClient, { limit: 100 });

            expect(mockClient.userLikes).toHaveBeenCalledWith({
                limit: 50, // Should be capped at 50
                offset: 0,
                before: undefined,
                after: undefined,
            });
        });

        it('should handle API errors', async () => {
            mockClient.userLikes.mockRejectedValue(new Error('API Error'));

            await expect(
                socialOps.getUserLikes(mockClient)
            ).rejects.toThrow(NodeOperationError);
        });
    });

    describe('getUserFollowing', () => {
        it('should get user following successfully', async () => {
            const mockResponse = {
                response: {
                    blogs: [
                        {
                            name: 'followed-blog',
                            title: 'Followed Blog',
                            description: 'A blog I follow',
                            url: 'https://followed-blog.tumblr.com',
                            uuid: 'uuid-123',
                            updated: 1640995200,
                            posts: 100,
                            followers: 500,
                            is_nsfw: false,
                            share_likes: true,
                            share_following: false,
                            can_be_followed: true,
                        },
                    ],
                    total_blogs: 1,
                },
            };

            mockClient.userFollowing.mockResolvedValue(mockResponse);

            const result = await socialOps.getUserFollowing(mockClient);

            expect(mockClient.userFollowing).toHaveBeenCalledWith({
                limit: 20,
                offset: 0,
            });

            expect(result).toEqual({
                following_blogs: [
                    {
                        name: 'followed-blog',
                        title: 'Followed Blog',
                        description: 'A blog I follow',
                        url: 'https://followed-blog.tumblr.com',
                        uuid: 'uuid-123',
                        updated: 1640995200,
                        posts: 100,
                        followers: 500,
                        is_nsfw: false,
                        share_likes: true,
                        share_following: false,
                        can_be_followed: true,
                    },
                ],
                total_blogs: 1,
                pagination: {
                    limit: 20,
                    offset: 0,
                    has_more: false,
                },
            });
        });

        it('should handle custom options', async () => {
            const mockResponse = {
                response: { blogs: [], total_blogs: 0 },
            };

            mockClient.userFollowing.mockResolvedValue(mockResponse);

            await socialOps.getUserFollowing(mockClient, {
                limit: 10,
                offset: 5,
            });

            expect(mockClient.userFollowing).toHaveBeenCalledWith({
                limit: 10,
                offset: 5,
            });
        });

        it('should enforce API limits', async () => {
            const mockResponse = {
                response: { blogs: [], total_blogs: 0 },
            };

            mockClient.userFollowing.mockResolvedValue(mockResponse);

            await socialOps.getUserFollowing(mockClient, { limit: 100 });

            expect(mockClient.userFollowing).toHaveBeenCalledWith({
                limit: 20, // Should be capped at 20
                offset: 0,
            });
        });

        it('should handle API errors', async () => {
            mockClient.userFollowing.mockRejectedValue(new Error('API Error'));

            await expect(
                socialOps.getUserFollowing(mockClient)
            ).rejects.toThrow(NodeOperationError);
        });
    });

    describe('getUserDashboard', () => {
        it('should get user dashboard successfully', async () => {
            const mockResponse = {
                response: {
                    posts: [
                        {
                            id: '12345',
                            type: 'text',
                            blog_name: 'dashboard-blog',
                            post_url: 'https://dashboard-blog.tumblr.com/post/12345',
                            timestamp: 1640995200,
                            date: '2022-01-01 00:00:00 GMT',
                            tags: ['dashboard', 'test'],
                            state: 'published',
                            note_count: 25,
                            title: 'Dashboard Post',
                            body: 'Dashboard content',
                            reblog_key: 'reblog-key',
                            reblogged_from_name: 'original-blog',
                            reblogged_from_title: 'Original Blog',
                            reblogged_root_name: 'root-blog',
                            reblogged_root_title: 'Root Blog',
                            photos: [{ url: 'photo.jpg' }],
                            video_url: 'video.mp4',
                            audio_url: 'audio.mp3',
                        },
                    ],
                },
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await socialOps.getUserDashboard(mockClient);

            expect(mockClient.userDashboard).toHaveBeenCalledWith({
                limit: 20,
                offset: 0,
                type: undefined,
                since_id: undefined,
                reblog_info: false,
                notes_info: false,
            });

            expect(result).toEqual({
                dashboard_posts: [
                    {
                        id: '12345',
                        type: 'text',
                        blog_name: 'dashboard-blog',
                        post_url: 'https://dashboard-blog.tumblr.com/post/12345',
                        timestamp: 1640995200,
                        date: '2022-01-01 00:00:00 GMT',
                        tags: ['dashboard', 'test'],
                        state: 'published',
                        note_count: 25,
                        title: 'Dashboard Post',
                        body: 'Dashboard content',
                        caption: undefined,
                        quote: undefined,
                        source: undefined,
                        url: undefined,
                        description: undefined,
                        reblog_key: 'reblog-key',
                        reblogged_from_name: 'original-blog',
                        reblogged_from_title: 'Original Blog',
                        reblogged_root_name: 'root-blog',
                        reblogged_root_title: 'Root Blog',
                        has_photos: true,
                        has_video: true,
                        has_audio: true,
                    },
                ],
                total_posts: 1,
                pagination: {
                    limit: 20,
                    offset: 0,
                    has_more: false,
                },
            });
        });

        it('should handle custom options', async () => {
            const mockResponse = {
                response: { posts: [] },
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            await socialOps.getUserDashboard(mockClient, {
                limit: 10,
                offset: 5,
                type: 'photo',
                sinceId: '12345',
                reblogInfo: true,
                notesInfo: true,
            });

            expect(mockClient.userDashboard).toHaveBeenCalledWith({
                limit: 10,
                offset: 5,
                type: 'photo',
                since_id: '12345',
                reblog_info: true,
                notes_info: true,
            });
        });

        it('should enforce API limits', async () => {
            const mockResponse = {
                response: { posts: [] },
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            await socialOps.getUserDashboard(mockClient, { limit: 100 });

            expect(mockClient.userDashboard).toHaveBeenCalledWith({
                limit: 20, // Should be capped at 20
                offset: 0,
                type: undefined,
                since_id: undefined,
                reblog_info: false,
                notes_info: false,
            });
        });

        it('should handle API errors', async () => {
            mockClient.userDashboard.mockRejectedValue(new Error('API Error'));

            await expect(
                socialOps.getUserDashboard(mockClient)
            ).rejects.toThrow(NodeOperationError);
        });
    });

    describe('batchLikePosts', () => {
        it('should batch like posts successfully', async () => {
            const posts = [
                { postId: '12345', reblogKey: 'key1' },
                { postId: '67890', reblogKey: 'key2' },
            ];

            // Mock successful likes
            jest.spyOn(socialOps, 'likePost')
                .mockResolvedValueOnce({ success: true, post_id: '12345' })
                .mockResolvedValueOnce({ success: true, post_id: '67890' });

            const result = await socialOps.batchLikePosts(mockClient, posts);

            expect(socialOps.likePost).toHaveBeenCalledTimes(2);
            expect(socialOps.likePost).toHaveBeenCalledWith(mockClient, '12345', 'key1');
            expect(socialOps.likePost).toHaveBeenCalledWith(mockClient, '67890', 'key2');

            expect(result).toEqual({
                success: true,
                operation: 'batchLike',
                total_posts: 2,
                successful: 2,
                failed: 0,
                results: [
                    { success: true, post_id: '12345' },
                    { success: true, post_id: '67890' },
                ],
                errors: [],
                timestamp: expect.any(String),
            });
        });

        it('should handle partial failures', async () => {
            const posts = [
                { postId: '12345', reblogKey: 'key1' },
                { postId: '67890', reblogKey: 'key2' },
            ];

            // Mock one success, one failure
            jest.spyOn(socialOps, 'likePost')
                .mockResolvedValueOnce({ success: true, post_id: '12345' })
                .mockRejectedValueOnce(new Error('Like failed'));

            const result = await socialOps.batchLikePosts(mockClient, posts);

            expect(result).toEqual({
                success: true,
                operation: 'batchLike',
                total_posts: 2,
                successful: 1,
                failed: 1,
                results: [{ success: true, post_id: '12345' }],
                errors: [{ post_id: '67890', error: 'Like failed' }],
                timestamp: expect.any(String),
            });
        });

        it('should throw error for invalid posts array', async () => {
            await expect(
                socialOps.batchLikePosts(mockClient, [])
            ).rejects.toThrow(NodeOperationError);

            await expect(
                socialOps.batchLikePosts(mockClient, null as any)
            ).rejects.toThrow(NodeOperationError);
        });

        it('should handle batch operation errors', async () => {
            const posts = [{ postId: '12345', reblogKey: 'key1' }];

            // Mock the method to throw during individual operations
            jest.spyOn(socialOps, 'likePost').mockRejectedValue(new Error('Setup error'));

            const result = await socialOps.batchLikePosts(mockClient, posts);

            expect(result).toEqual({
                success: true,
                operation: 'batchLike',
                total_posts: 1,
                successful: 0,
                failed: 1,
                results: [],
                errors: [{ post_id: '12345', error: 'Setup error' }],
                timestamp: expect.any(String),
            });
        });
    });

    describe('batchFollowBlogs', () => {
        it('should batch follow blogs successfully', async () => {
            const blogNames = ['blog1', 'blog2'];

            // Mock successful follows
            jest.spyOn(socialOps, 'followBlog')
                .mockResolvedValueOnce({ success: true, blog_name: 'blog1' })
                .mockResolvedValueOnce({ success: true, blog_name: 'blog2' });

            const result = await socialOps.batchFollowBlogs(mockClient, blogNames);

            expect(socialOps.followBlog).toHaveBeenCalledTimes(2);
            expect(socialOps.followBlog).toHaveBeenCalledWith(mockClient, 'blog1');
            expect(socialOps.followBlog).toHaveBeenCalledWith(mockClient, 'blog2');

            expect(result).toEqual({
                success: true,
                operation: 'batchFollow',
                total_blogs: 2,
                successful: 2,
                failed: 0,
                results: [
                    { success: true, blog_name: 'blog1' },
                    { success: true, blog_name: 'blog2' },
                ],
                errors: [],
                timestamp: expect.any(String),
            });
        });

        it('should handle partial failures', async () => {
            const blogNames = ['blog1', 'blog2'];

            // Mock one success, one failure
            jest.spyOn(socialOps, 'followBlog')
                .mockResolvedValueOnce({ success: true, blog_name: 'blog1' })
                .mockRejectedValueOnce(new Error('Follow failed'));

            const result = await socialOps.batchFollowBlogs(mockClient, blogNames);

            expect(result).toEqual({
                success: true,
                operation: 'batchFollow',
                total_blogs: 2,
                successful: 1,
                failed: 1,
                results: [{ success: true, blog_name: 'blog1' }],
                errors: [{ blog_name: 'blog2', error: 'Follow failed' }],
                timestamp: expect.any(String),
            });
        });

        it('should throw error for invalid blog names array', async () => {
            await expect(
                socialOps.batchFollowBlogs(mockClient, [])
            ).rejects.toThrow(NodeOperationError);

            await expect(
                socialOps.batchFollowBlogs(mockClient, null as any)
            ).rejects.toThrow(NodeOperationError);
        });

        it('should handle batch operation errors', async () => {
            const blogNames = ['blog1'];

            // Mock the method to throw during individual operations
            jest.spyOn(socialOps, 'followBlog').mockRejectedValue(new Error('Setup error'));

            const result = await socialOps.batchFollowBlogs(mockClient, blogNames);

            expect(result).toEqual({
                success: true,
                operation: 'batchFollow',
                total_blogs: 1,
                successful: 0,
                failed: 1,
                results: [],
                errors: [{ blog_name: 'blog1', error: 'Setup error' }],
                timestamp: expect.any(String),
            });
        });
    });

    describe('formatting methods', () => {
        it('should format liked post correctly', () => {
            const post = {
                id: '12345',
                type: 'text',
                blog_name: 'test-blog',
                post_url: 'https://test-blog.tumblr.com/post/12345',
                liked_timestamp: 1640995200,
                tags: ['test'],
                title: 'Test Post',
                body: 'Short body',
                caption: 'This is a very long caption that should be truncated because it exceeds the 200 character limit. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
                quote: 'Test quote',
                source: 'Test source',
                url: 'https://example.com',
                note_count: 42,
                reblog_key: 'reblog-key',
            };

            const formatted = (socialOps as any).formatLikedPost(post);

            expect(formatted).toEqual({
                id: '12345',
                type: 'text',
                blog_name: 'test-blog',
                post_url: 'https://test-blog.tumblr.com/post/12345',
                liked_timestamp: 1640995200,
                tags: ['test'],
                title: 'Test Post',
                body: 'Short body',
                caption: 'This is a very long caption that should be truncated because it exceeds the 200 character limit. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et ...',
                quote: 'Test quote',
                source: 'Test source',
                url: 'https://example.com',
                note_count: 42,
                reblog_key: 'reblog-key',
            });
        });

        it('should format following blog correctly', () => {
            const blog = {
                name: 'test-blog',
                title: 'Test Blog',
                description: 'A test blog',
                url: 'https://test-blog.tumblr.com',
                uuid: 'uuid-123',
                updated: 1640995200,
                posts: 100,
                followers: 500,
                is_nsfw: false,
                share_likes: true,
                share_following: false,
                can_be_followed: true,
            };

            const formatted = (socialOps as any).formatFollowingBlog(blog);

            expect(formatted).toEqual(blog);
        });

        it('should format dashboard post correctly', () => {
            const post = {
                id: '12345',
                type: 'text',
                blog_name: 'test-blog',
                post_url: 'https://test-blog.tumblr.com/post/12345',
                timestamp: 1640995200,
                date: '2022-01-01 00:00:00 GMT',
                tags: ['test'],
                state: 'published',
                note_count: 25,
                title: 'Test Post',
                body: 'Test content',
                reblog_key: 'reblog-key',
                photos: [],
                video_url: null,
                audio_url: null,
            };

            const formatted = (socialOps as any).formatDashboardPost(post);

            expect(formatted).toEqual({
                id: '12345',
                type: 'text',
                blog_name: 'test-blog',
                post_url: 'https://test-blog.tumblr.com/post/12345',
                timestamp: 1640995200,
                date: '2022-01-01 00:00:00 GMT',
                tags: ['test'],
                state: 'published',
                note_count: 25,
                title: 'Test Post',
                body: 'Test content',
                caption: undefined,
                quote: undefined,
                source: undefined,
                url: undefined,
                description: undefined,
                reblog_key: 'reblog-key',
                reblogged_from_name: undefined,
                reblogged_from_title: undefined,
                reblogged_root_name: undefined,
                reblogged_root_title: undefined,
                has_photos: false,
                has_video: false,
                has_audio: false,
            });
        });
    });

    describe('cleanBlogName', () => {
        it('should clean blog names correctly', () => {
            expect((socialOps as any).cleanBlogName('test-blog')).toBe('test-blog');
            expect((socialOps as any).cleanBlogName('test-blog.tumblr.com')).toBe('test-blog');
        });
    });
});