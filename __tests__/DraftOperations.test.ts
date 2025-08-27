import { DraftOperations } from '../nodes/Tumblr/operations/DraftOperations';
import { PostOperations } from '../nodes/Tumblr/operations/PostOperations';
import { NodeOperationError } from 'n8n-workflow';

// Mock PostOperations
jest.mock('../nodes/Tumblr/operations/PostOperations');

describe('DraftOperations', () => {
    let draftOps: DraftOperations;
    let mockClient: any;
    let mockPostOps: jest.Mocked<PostOperations>;

    beforeEach(() => {
        draftOps = new DraftOperations();
        mockPostOps = new PostOperations() as jest.Mocked<PostOperations>;
        (draftOps as any).postOps = mockPostOps;

        mockClient = {
            blogDrafts: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createDraft', () => {
        it('should create a text draft successfully', async () => {
            const mockResponse = {
                id: '12345',
                type: 'text',
                state: 'draft',
                blog_name: 'test-blog',
            };

            mockPostOps.createTextPost.mockResolvedValue(mockResponse);

            const result = await draftOps.createDraft(mockClient, 'test-blog', {
                type: 'text',
                title: 'Test Draft',
                body: 'This is a test draft',
            });

            expect(mockPostOps.createTextPost).toHaveBeenCalledWith(
                mockClient,
                'test-blog',
                {
                    type: 'text',
                    title: 'Test Draft',
                    body: 'This is a test draft',
                    state: 'draft',
                }
            );

            expect(result).toEqual({
                ...mockResponse,
                operation: 'createDraft',
                draft_status: 'created',
            });
        });

        it('should create a photo draft successfully', async () => {
            const mockResponse = {
                id: '12345',
                type: 'photo',
                state: 'draft',
                blog_name: 'test-blog',
            };

            mockPostOps.createPhotoPost.mockResolvedValue(mockResponse);

            const result = await draftOps.createDraft(mockClient, 'test-blog', {
                type: 'photo',
                caption: 'Test photo draft',
                photos: [{ url: 'https://example.com/photo.jpg' }],
            });

            expect(mockPostOps.createPhotoPost).toHaveBeenCalledWith(
                mockClient,
                'test-blog',
                {
                    type: 'photo',
                    caption: 'Test photo draft',
                    photos: [{ url: 'https://example.com/photo.jpg' }],
                    state: 'draft',
                }
            );

            expect(result).toEqual({
                ...mockResponse,
                operation: 'createDraft',
                draft_status: 'created',
            });
        });

        it('should handle all post types', async () => {
            const postTypes = ['text', 'photo', 'quote', 'link', 'chat', 'video', 'audio'];
            const mockResponse = { id: '12345', state: 'draft' };

            for (const type of postTypes) {
                const methodName = `create${type.charAt(0).toUpperCase() + type.slice(1)}Post` as keyof PostOperations;
                (mockPostOps[methodName] as jest.Mock).mockResolvedValue(mockResponse);

                await draftOps.createDraft(mockClient, 'test-blog', { type });

                expect(mockPostOps[methodName]).toHaveBeenCalledWith(
                    mockClient,
                    'test-blog',
                    { type, state: 'draft' }
                );
            }
        });

        it('should throw error for invalid post type', async () => {
            await expect(
                draftOps.createDraft(mockClient, 'test-blog', { type: 'invalid' })
            ).rejects.toThrow(NodeOperationError);
        });

        it('should handle creation errors', async () => {
            mockPostOps.createTextPost.mockRejectedValue(new Error('API Error'));

            await expect(
                draftOps.createDraft(mockClient, 'test-blog', { type: 'text' })
            ).rejects.toThrow(NodeOperationError);
        });

        it('should clean blog name', async () => {
            const mockResponse = { id: '12345', state: 'draft' };
            mockPostOps.createTextPost.mockResolvedValue(mockResponse);

            await draftOps.createDraft(mockClient, 'test-blog.tumblr.com', { type: 'text' });

            expect(mockPostOps.createTextPost).toHaveBeenCalledWith(
                mockClient,
                'test-blog',
                { type: 'text', state: 'draft' }
            );
        });
    });

    describe('getDrafts', () => {
        it('should get drafts successfully', async () => {
            const mockResponse = {
                response: {
                    posts: [
                        {
                            id: '12345',
                            type: 'text',
                            state: 'draft',
                            blog_name: 'test-blog',
                            timestamp: 1640995200,
                            title: 'Draft Post',
                            tags: ['test'],
                        },
                    ],
                    blog: { name: 'test-blog' },
                },
            };

            mockClient.blogDrafts.mockResolvedValue(mockResponse);

            const result = await draftOps.getDrafts(mockClient, 'test-blog');

            expect(mockClient.blogDrafts).toHaveBeenCalledWith('test-blog', {
                limit: 20,
                offset: 0,
                filter: 'text',
            });

            expect(result).toEqual({
                draft_posts: [
                    {
                        id: '12345',
                        type: 'text',
                        blog_name: 'test-blog',
                        state: 'draft',
                        created_at: '2022-01-01T00:00:00.000Z',
                        tags: ['test'],
                        title: 'Draft Post',
                        body: undefined,
                        caption: undefined,
                        quote: undefined,
                        source: undefined,
                        url: undefined,
                        description: undefined,
                        conversation: undefined,
                        format: undefined,
                        slug: undefined,
                        summary: undefined,
                        has_photos: false,
                        has_video: false,
                        has_audio: false,
                    },
                ],
                total_drafts: 1,
                blog: { name: 'test-blog' },
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
                    posts: [],
                    blog: { name: 'test-blog' },
                },
            };

            mockClient.blogDrafts.mockResolvedValue(mockResponse);

            await draftOps.getDrafts(mockClient, 'test-blog', {
                limit: 10,
                offset: 5,
                filter: 'raw',
            });

            expect(mockClient.blogDrafts).toHaveBeenCalledWith('test-blog', {
                limit: 10,
                offset: 5,
                filter: 'raw',
            });
        });

        it('should enforce API limits', async () => {
            const mockResponse = {
                response: { posts: [], blog: { name: 'test-blog' } },
            };

            mockClient.blogDrafts.mockResolvedValue(mockResponse);

            await draftOps.getDrafts(mockClient, 'test-blog', { limit: 100 });

            expect(mockClient.blogDrafts).toHaveBeenCalledWith('test-blog', {
                limit: 50, // Should be capped at 50
                offset: 0,
                filter: 'text',
            });
        });

        it('should handle API errors', async () => {
            mockClient.blogDrafts.mockRejectedValue(new Error('API Error'));

            await expect(
                draftOps.getDrafts(mockClient, 'test-blog')
            ).rejects.toThrow(NodeOperationError);
        });
    });

    describe('updateDraft', () => {
        it('should update draft successfully', async () => {
            const mockResponse = {
                id: '12345',
                state: 'draft',
                title: 'Updated Draft',
            };

            mockPostOps.updatePost.mockResolvedValue(mockResponse);

            const result = await draftOps.updateDraft(mockClient, 'test-blog', '12345', {
                title: 'Updated Draft',
            });

            expect(mockPostOps.updatePost).toHaveBeenCalledWith(
                mockClient,
                'test-blog',
                '12345',
                {
                    title: 'Updated Draft',
                    state: 'draft',
                }
            );

            expect(result).toEqual({
                ...mockResponse,
                operation: 'updateDraft',
                draft_status: 'updated',
            });
        });

        it('should preserve draft state by default', async () => {
            const mockResponse = { id: '12345', state: 'draft' };
            mockPostOps.updatePost.mockResolvedValue(mockResponse);

            await draftOps.updateDraft(mockClient, 'test-blog', '12345', {
                title: 'Updated',
            });

            expect(mockPostOps.updatePost).toHaveBeenCalledWith(
                mockClient,
                'test-blog',
                '12345',
                {
                    title: 'Updated',
                    state: 'draft',
                }
            );
        });

        it('should allow state override', async () => {
            const mockResponse = { id: '12345', state: 'published' };
            mockPostOps.updatePost.mockResolvedValue(mockResponse);

            await draftOps.updateDraft(mockClient, 'test-blog', '12345', {
                title: 'Updated',
                state: 'published',
            });

            expect(mockPostOps.updatePost).toHaveBeenCalledWith(
                mockClient,
                'test-blog',
                '12345',
                {
                    title: 'Updated',
                    state: 'published',
                }
            );
        });

        it('should throw error for missing post ID', async () => {
            await expect(
                draftOps.updateDraft(mockClient, 'test-blog', '', { title: 'Updated' })
            ).rejects.toThrow(NodeOperationError);
        });

        it('should handle update errors', async () => {
            mockPostOps.updatePost.mockRejectedValue(new Error('API Error'));

            await expect(
                draftOps.updateDraft(mockClient, 'test-blog', '12345', { title: 'Updated' })
            ).rejects.toThrow(NodeOperationError);
        });
    });

    describe('deleteDraft', () => {
        it('should delete draft successfully', async () => {
            const mockResponse = {
                success: true,
                post_id: '12345',
            };

            mockPostOps.deletePost.mockResolvedValue(mockResponse);

            const result = await draftOps.deleteDraft(mockClient, 'test-blog', '12345');

            expect(mockPostOps.deletePost).toHaveBeenCalledWith(
                mockClient,
                'test-blog',
                '12345'
            );

            expect(result).toEqual({
                ...mockResponse,
                operation: 'deleteDraft',
                draft_status: 'deleted',
            });
        });

        it('should throw error for missing post ID', async () => {
            await expect(
                draftOps.deleteDraft(mockClient, 'test-blog', '')
            ).rejects.toThrow(NodeOperationError);
        });

        it('should handle deletion errors', async () => {
            mockPostOps.deletePost.mockRejectedValue(new Error('API Error'));

            await expect(
                draftOps.deleteDraft(mockClient, 'test-blog', '12345')
            ).rejects.toThrow(NodeOperationError);
        });
    });

    describe('publishDraft', () => {
        it('should publish draft successfully', async () => {
            const mockResponse = {
                id: '12345',
                state: 'published',
            };

            mockPostOps.updatePost.mockResolvedValue(mockResponse);

            const result = await draftOps.publishDraft(mockClient, 'test-blog', '12345');

            expect(mockPostOps.updatePost).toHaveBeenCalledWith(
                mockClient,
                'test-blog',
                '12345',
                {
                    state: 'published',
                }
            );

            expect(result).toEqual({
                ...mockResponse,
                operation: 'publishDraft',
                draft_status: 'published',
                published_at: expect.any(String),
            });
        });

        it('should handle publish options', async () => {
            const mockResponse = { id: '12345', state: 'published' };
            mockPostOps.updatePost.mockResolvedValue(mockResponse);

            const publishDate = '2022-01-01T12:00:00Z';
            await draftOps.publishDraft(mockClient, 'test-blog', '12345', {
                publishOn: publishDate,
                tags: ['published', 'test'],
            });

            expect(mockPostOps.updatePost).toHaveBeenCalledWith(
                mockClient,
                'test-blog',
                '12345',
                {
                    state: 'published',
                    date: publishDate,
                    tags: ['published', 'test'],
                }
            );
        });

        it('should throw error for missing post ID', async () => {
            await expect(
                draftOps.publishDraft(mockClient, 'test-blog', '')
            ).rejects.toThrow(NodeOperationError);
        });

        it('should handle publish errors', async () => {
            mockPostOps.updatePost.mockRejectedValue(new Error('API Error'));

            await expect(
                draftOps.publishDraft(mockClient, 'test-blog', '12345')
            ).rejects.toThrow(NodeOperationError);
        });
    });

    describe('getDraft', () => {
        it('should get specific draft successfully', async () => {
            const mockResponse = {
                post: {
                    id: '12345',
                    type: 'text',
                    state: 'draft',
                    blog_name: 'test-blog',
                    title: 'Draft Post',
                },
                blog: { name: 'test-blog' },
            };

            mockPostOps.getPost.mockResolvedValue(mockResponse);

            const result = await draftOps.getDraft(mockClient, 'test-blog', '12345');

            expect(mockPostOps.getPost).toHaveBeenCalledWith(
                mockClient,
                'test-blog',
                '12345'
            );

            expect(result).toEqual({
                draft: expect.objectContaining({
                    id: '12345',
                    type: 'text',
                    state: 'draft',
                    blog_name: 'test-blog',
                    title: 'Draft Post',
                }),
                blog: { name: 'test-blog' },
            });
        });

        it('should throw error for non-draft post', async () => {
            const mockResponse = {
                post: {
                    id: '12345',
                    state: 'published',
                },
            };

            mockPostOps.getPost.mockResolvedValue(mockResponse);

            await expect(
                draftOps.getDraft(mockClient, 'test-blog', '12345')
            ).rejects.toThrow(NodeOperationError);
        });

        it('should throw error for missing post ID', async () => {
            await expect(
                draftOps.getDraft(mockClient, 'test-blog', '')
            ).rejects.toThrow(NodeOperationError);
        });

        it('should handle get errors', async () => {
            mockPostOps.getPost.mockRejectedValue(new Error('API Error'));

            await expect(
                draftOps.getDraft(mockClient, 'test-blog', '12345')
            ).rejects.toThrow(NodeOperationError);
        });
    });

    describe('duplicateDraft', () => {
        it('should duplicate draft successfully', async () => {
            const originalDraft = {
                draft: {
                    id: '12345',
                    type: 'text',
                    title: 'Original Draft',
                    body: 'Original content',
                    tags: ['original'],
                },
                blog: { name: 'test-blog' },
            };

            const newDraft = {
                id: '67890',
                type: 'text',
                state: 'draft',
            };

            // Mock getDraft to return original
            jest.spyOn(draftOps, 'getDraft').mockResolvedValue(originalDraft);
            // Mock createDraft to return new draft
            jest.spyOn(draftOps, 'createDraft').mockResolvedValue(newDraft);

            const result = await draftOps.duplicateDraft(mockClient, 'test-blog', '12345', {
                title: 'Duplicated Draft',
            });

            expect(draftOps.getDraft).toHaveBeenCalledWith(mockClient, 'test-blog', '12345');
            expect(draftOps.createDraft).toHaveBeenCalledWith(
                mockClient,
                'test-blog',
                expect.objectContaining({
                    type: 'text',
                    title: 'Duplicated Draft', // Modified
                    body: 'Original content', // Preserved
                    tags: ['original'], // Preserved
                })
            );

            expect(result).toEqual({
                ...newDraft,
                operation: 'duplicateDraft',
                original_post_id: '12345',
                draft_status: 'duplicated',
            });
        });

        it('should throw error for missing post ID', async () => {
            await expect(
                draftOps.duplicateDraft(mockClient, 'test-blog', '')
            ).rejects.toThrow(NodeOperationError);
        });

        it('should handle duplication errors', async () => {
            jest.spyOn(draftOps, 'getDraft').mockRejectedValue(new Error('API Error'));

            await expect(
                draftOps.duplicateDraft(mockClient, 'test-blog', '12345')
            ).rejects.toThrow(NodeOperationError);
        });
    });

    describe('getDraftStats', () => {
        it('should calculate draft statistics successfully', async () => {
            const mockDrafts = {
                draft_posts: [
                    {
                        id: '1',
                        type: 'text',
                        created_at: '2022-01-01T00:00:00Z',
                        title: 'First Draft',
                    },
                    {
                        id: '2',
                        type: 'photo',
                        created_at: '2022-01-02T00:00:00Z',
                        title: 'Second Draft',
                    },
                    {
                        id: '3',
                        type: 'text',
                        created_at: '2022-01-03T00:00:00Z',
                        title: 'Third Draft',
                    },
                ],
            };

            jest.spyOn(draftOps, 'getDrafts').mockResolvedValue(mockDrafts);

            const result = await draftOps.getDraftStats(mockClient, 'test-blog');

            expect(result).toEqual({
                total_drafts: 3,
                by_type: {
                    text: 2,
                    photo: 1,
                },
                oldest_draft: {
                    id: '1',
                    type: 'text',
                    created_at: '2022-01-01T00:00:00Z',
                    title: 'First Draft',
                },
                newest_draft: {
                    id: '3',
                    type: 'text',
                    created_at: '2022-01-03T00:00:00Z',
                    title: 'Third Draft',
                },
                blog_name: 'test-blog',
                timestamp: expect.any(String),
            });
        });

        it('should handle empty drafts', async () => {
            const mockDrafts = { draft_posts: [] };
            jest.spyOn(draftOps, 'getDrafts').mockResolvedValue(mockDrafts);

            const result = await draftOps.getDraftStats(mockClient, 'test-blog');

            expect(result).toEqual({
                total_drafts: 0,
                by_type: {},
                oldest_draft: null,
                newest_draft: null,
                blog_name: 'test-blog',
                timestamp: expect.any(String),
            });
        });

        it('should handle stats errors', async () => {
            jest.spyOn(draftOps, 'getDrafts').mockRejectedValue(new Error('API Error'));

            await expect(
                draftOps.getDraftStats(mockClient, 'test-blog')
            ).rejects.toThrow(NodeOperationError);
        });
    });

    describe('formatDraftPost', () => {
        it('should format draft post correctly', () => {
            const post = {
                id: '12345',
                type: 'text',
                blog_name: 'test-blog',
                state: 'draft',
                timestamp: 1640995200,
                title: 'Test Post',
                body: 'Test content',
                tags: ['test', 'draft'],
                photos: [{ url: 'test.jpg' }],
                video_url: 'test-video.mp4',
                audio_url: 'test-audio.mp3',
            };

            const formatted = (draftOps as any).formatDraftPost(post);

            expect(formatted).toEqual({
                id: '12345',
                type: 'text',
                blog_name: 'test-blog',
                state: 'draft',
                created_at: '2022-01-01T00:00:00.000Z',
                tags: ['test', 'draft'],
                title: 'Test Post',
                body: 'Test content',
                caption: undefined,
                quote: undefined,
                source: undefined,
                url: undefined,
                description: undefined,
                conversation: undefined,
                format: undefined,
                slug: undefined,
                summary: undefined,
                has_photos: true,
                has_video: true,
                has_audio: true,
            });
        });
    });

    describe('helper methods', () => {
        it('should calculate post type stats correctly', () => {
            const posts = [
                { type: 'text' },
                { type: 'photo' },
                { type: 'text' },
                { type: 'video' },
                { type: undefined },
            ];

            const stats = (draftOps as any).calculatePostTypeStats(posts);

            expect(stats).toEqual({
                text: 2,
                photo: 1,
                video: 1,
                unknown: 1,
            });
        });

        it('should find oldest and newest drafts correctly', () => {
            const drafts = [
                { id: '2', created_at: '2022-01-02T00:00:00Z', title: 'Middle' },
                { id: '1', created_at: '2022-01-01T00:00:00Z', title: 'Oldest' },
                { id: '3', created_at: '2022-01-03T00:00:00Z', title: 'Newest' },
            ];

            const oldest = (draftOps as any).getOldestDraft(drafts);
            const newest = (draftOps as any).getNewestDraft(drafts);

            expect(oldest).toEqual({
                id: '1',
                type: undefined,
                created_at: '2022-01-01T00:00:00Z',
                title: 'Oldest',
            });

            expect(newest).toEqual({
                id: '3',
                type: undefined,
                created_at: '2022-01-03T00:00:00Z',
                title: 'Newest',
            });
        });

        it('should handle empty arrays for oldest/newest', () => {
            const oldest = (draftOps as any).getOldestDraft([]);
            const newest = (draftOps as any).getNewestDraft([]);

            expect(oldest).toBeNull();
            expect(newest).toBeNull();
        });

        it('should clean blog names correctly', () => {
            expect((draftOps as any).cleanBlogName('test-blog')).toBe('test-blog');
            expect((draftOps as any).cleanBlogName('test-blog.tumblr.com')).toBe('test-blog');
        });
    });
});