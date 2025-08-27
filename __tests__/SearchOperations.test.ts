import { SearchOperations } from '../nodes/Tumblr/operations/SearchOperations';
import { TumblrClient } from '../nodes/Tumblr/TumblrAuthenticator';
import { NodeOperationError } from 'n8n-workflow';

// Mock TumblrClient
jest.mock('../nodes/Tumblr/TumblrAuthenticator');

describe('SearchOperations', () => {
    let mockClient: jest.Mocked<TumblrClient>;

    beforeEach(() => {
        mockClient = {
            taggedPosts: jest.fn(),
            userDashboard: jest.fn(),
        } as any;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('searchByTag', () => {
        it('should search posts by tag successfully', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '123',
                        type: 'text',
                        title: 'Test Post',
                        tags: ['test', 'example'],
                        note_count: 10
                    }
                ],
                total_posts: 1
            };

            mockClient.taggedPosts.mockResolvedValue(mockResponse);

            const result = await SearchOperations.searchByTag(mockClient, 'test');

            expect(mockClient.taggedPosts).toHaveBeenCalledWith('test', {
                limit: 20
            });

            expect(result.success).toBe(true);
            expect((result.data as any).posts).toEqual(mockResponse.posts);
            expect((result.data as any).totalPosts).toBe(1);
            expect((result.data as any).tag).toBe('test');
            expect((result.metadata as any).operation).toBe('searchByTag');
            expect((result.metadata as any).tag).toBe('test');
            expect((result.metadata as any).resultCount).toBe(1);
        });

        it('should search posts by tag with custom options', async () => {
            const mockResponse = {
                posts: [],
                total_posts: 0
            };

            mockClient.taggedPosts.mockResolvedValue(mockResponse);

            const options = {
                limit: 50,
                before: '1234567890',
                filter: 'text'
            };

            await SearchOperations.searchByTag(mockClient, 'test', options);

            expect(mockClient.taggedPosts).toHaveBeenCalledWith('test', {
                limit: 50,
                before: '1234567890',
                filter: 'text'
            });
        });

        it('should handle search errors gracefully', async () => {
            const errorMessage = 'API Error';
            mockClient.taggedPosts.mockRejectedValue(new Error(errorMessage));

            await expect(SearchOperations.searchByTag(mockClient, 'test'))
                .rejects.toThrow(NodeOperationError);

            try {
                await SearchOperations.searchByTag(mockClient, 'test');
            } catch (error) {
                expect(error).toBeInstanceOf(NodeOperationError);
                expect((error as NodeOperationError).message).toContain('Failed to search posts by tag "test"');
                expect((error as NodeOperationError).message).toContain(errorMessage);
            }
        });

        it('should handle empty search results', async () => {
            const mockResponse = {
                posts: [],
                total_posts: 0
            };

            mockClient.taggedPosts.mockResolvedValue(mockResponse);

            const result = await SearchOperations.searchByTag(mockClient, 'nonexistent');

            expect(result.success).toBe(true);
            expect((result.data as any).posts).toEqual([]);
            expect((result.data as any).totalPosts).toBe(0);
            expect((result.metadata as any).resultCount).toBe(0);
        });
    });

    describe('searchByKeyword', () => {
        it('should search posts by keyword successfully', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '123',
                        type: 'text',
                        title: 'Photography Tips',
                        body: 'Learn about camera settings',
                        tags: ['photography', 'tips'],
                        note_count: 50
                    },
                    {
                        id: '124',
                        type: 'photo',
                        caption: 'Beautiful landscape photo',
                        tags: ['landscape', 'nature'],
                        note_count: 25
                    },
                    {
                        id: '125',
                        type: 'text',
                        title: 'Cooking Recipe',
                        body: 'How to make pasta',
                        tags: ['cooking', 'recipe'],
                        note_count: 10
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.searchByKeyword(mockClient, 'photo');

            expect(mockClient.userDashboard).toHaveBeenCalledWith({
                limit: 50,
                offset: 0
            });

            expect(result.success).toBe(true);
            expect((result.data as any).keyword).toBe('photo');
            expect((result.data as any).posts).toHaveLength(2); // Should match 'Photography Tips' and 'Beautiful landscape photo'
            expect((result.data as any).totalResults).toBe(2);
            expect((result.data as any).page).toBe(1);
            expect((result.data as any).pageSize).toBe(20);
            expect((result.data as any).hasNextPage).toBe(false);
            expect((result.data as any).hasPreviousPage).toBe(false);
            expect((result.metadata as any).operation).toBe('searchByKeyword');
            expect((result.metadata as any).keyword).toBe('photo');
            expect((result.metadata as any).totalMatches).toBe(2);
        });

        it('should search with custom options', async () => {
            const mockResponse = { posts: [] };
            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const options = {
                limit: 30,
                offset: 10,
                type: 'text',
                sortBy: 'notes',
                sortOrder: 'asc',
                page: 2,
                pageSize: 15
            };

            await SearchOperations.searchByKeyword(mockClient, 'test', options);

            expect(mockClient.userDashboard).toHaveBeenCalledWith({
                limit: 30,
                offset: 10,
                type: 'text'
            });
        });

        it('should handle pagination correctly', async () => {
            const mockPosts = Array.from({ length: 50 }, (_, i) => ({
                id: `${i}`,
                title: `Post ${i} with keyword`,
                note_count: i
            }));

            mockClient.userDashboard.mockResolvedValue({ posts: mockPosts });

            const result = await SearchOperations.searchByKeyword(mockClient, 'keyword', {
                page: 2,
                pageSize: 10
            });

            expect((result.data as any).posts).toHaveLength(10);
            expect((result.data as any).page).toBe(2);
            expect((result.data as any).pageSize).toBe(10);
            expect((result.data as any).totalPages).toBe(5); // 50 posts / 10 per page
            expect((result.data as any).hasNextPage).toBe(true);
            expect((result.data as any).hasPreviousPage).toBe(true);
        });

        it('should search in different post fields', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        type: 'text',
                        title: 'Contains search term',
                        body: 'Regular content'
                    },
                    {
                        id: '2',
                        type: 'text',
                        title: 'Regular title',
                        body: 'Body contains search term'
                    },
                    {
                        id: '3',
                        type: 'photo',
                        caption: 'Caption with search term'
                    },
                    {
                        id: '4',
                        type: 'text',
                        summary: 'Summary has search term'
                    },
                    {
                        id: '5',
                        type: 'text',
                        tags: ['search', 'term', 'other']
                    },
                    {
                        id: '6',
                        type: 'text',
                        title: 'No match here'
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.searchByKeyword(mockClient, 'search');

            expect((result.data as any).posts).toHaveLength(5); // Should match posts 1-5
            expect((result.data as any).posts.map((p: any) => p.id)).toEqual(['1', '2', '3', '4', '5']);
        });

        it('should apply sorting when specified', async () => {
            const mockResponse = {
                posts: [
                    { id: '1', title: 'test post', note_count: 10 },
                    { id: '2', title: 'another test', note_count: 50 },
                    { id: '3', title: 'test content', note_count: 25 }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.searchByKeyword(mockClient, 'test', {
                sortBy: 'notes',
                sortOrder: 'desc'
            });

            expect((result.data as any).posts).toHaveLength(3);
            expect((result.data as any).posts[0].note_count).toBe(50); // Highest notes first
            expect((result.data as any).posts[1].note_count).toBe(25);
            expect((result.data as any).posts[2].note_count).toBe(10);
        });

        it('should handle empty search results', async () => {
            const mockResponse = {
                posts: [
                    { id: '1', title: 'No match', body: 'Nothing here' },
                    { id: '2', title: 'Also no match', body: 'Still nothing' }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.searchByKeyword(mockClient, 'nonexistent');

            expect(result.success).toBe(true);
            expect((result.data as any).posts).toHaveLength(0);
            expect((result.data as any).totalResults).toBe(0);
            expect((result.data as any).totalPages).toBe(0);
        });

        it('should handle case-insensitive search', async () => {
            const mockResponse = {
                posts: [
                    { id: '1', title: 'UPPERCASE SEARCH' },
                    { id: '2', title: 'lowercase search' },
                    { id: '3', title: 'MiXeD CaSe SeArCh' }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.searchByKeyword(mockClient, 'SEARCH');

            expect((result.data as any).posts).toHaveLength(3);
        });

        it('should handle keyword search errors gracefully', async () => {
            mockClient.userDashboard.mockRejectedValue(new Error('Dashboard error'));

            await expect(SearchOperations.searchByKeyword(mockClient, 'test'))
                .rejects.toThrow(NodeOperationError);

            try {
                await SearchOperations.searchByKeyword(mockClient, 'test');
            } catch (error) {
                expect(error).toBeInstanceOf(NodeOperationError);
                expect((error as NodeOperationError).message).toContain('Failed to search posts by keyword "test"');
                expect((error as NodeOperationError).message).toContain('Dashboard error');
            }
        });

        it('should include search options in metadata', async () => {
            const mockResponse = { posts: [] };
            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const options = {
                limit: 25,
                offset: 5,
                type: 'photo',
                sortBy: 'timestamp',
                sortOrder: 'asc',
                page: 3,
                pageSize: 8
            };

            const result = await SearchOperations.searchByKeyword(mockClient, 'test', options);

            expect((result.metadata as any).searchOptions).toEqual({
                limit: 25,
                offset: 5,
                type: 'photo',
                sortBy: 'timestamp',
                sortOrder: 'asc',
                page: 3,
                pageSize: 8
            });
        });
    });

    describe('advancedSearch', () => {
        it('should perform advanced search with multiple filters', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        type: 'text',
                        title: 'Photography Guide',
                        tags: ['photography', 'tutorial'],
                        note_count: 100,
                        date: '2023-01-15'
                    },
                    {
                        id: '2',
                        type: 'photo',
                        caption: 'Nature photography',
                        tags: ['photography', 'nature'],
                        note_count: 50,
                        date: '2023-01-10'
                    },
                    {
                        id: '3',
                        type: 'text',
                        title: 'Cooking Tips',
                        tags: ['cooking'],
                        note_count: 20,
                        date: '2023-01-05'
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const searchParams = {
                keyword: 'photography',
                postType: 'text',
                minNotes: 50,
                tags: ['tutorial'],
                sortBy: 'notes',
                sortOrder: 'desc'
            };

            const result = await SearchOperations.advancedSearch(mockClient, searchParams);

            expect(result.success).toBe(true);
            expect((result.data as any).posts).toHaveLength(1); // Only the first post matches all criteria
            expect((result.data as any).posts[0].id).toBe('1');
            expect((result.metadata as any).operation).toBe('advancedSearch');
            expect((result.data as any).searchParams).toEqual({
                keyword: 'photography',
                postType: 'text',
                minNotes: 50,
                tags: ['tutorial'],
                sortBy: 'notes',
                sortOrder: 'desc',
                dateFrom: undefined,
                dateTo: undefined,
                maxNotes: undefined,
                limit: 50
            });
        });

        it('should filter by date range', async () => {
            const mockResponse = {
                posts: [
                    { id: '1', title: 'Old post', date: '2022-01-01' },
                    { id: '2', title: 'Recent post', date: '2023-06-01' },
                    { id: '3', title: 'Future post', date: '2024-01-01' }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const searchParams = {
                dateFrom: '2023-01-01',
                dateTo: '2023-12-31'
            };

            const result = await SearchOperations.advancedSearch(mockClient, searchParams);

            expect((result.data as any).posts).toHaveLength(1);
            expect((result.data as any).posts[0].id).toBe('2');
        });

        it('should handle advanced search errors gracefully', async () => {
            mockClient.userDashboard.mockRejectedValue(new Error('Search error'));

            await expect(SearchOperations.advancedSearch(mockClient, { keyword: 'test' }))
                .rejects.toThrow(NodeOperationError);

            try {
                await SearchOperations.advancedSearch(mockClient, { keyword: 'test' });
            } catch (error) {
                expect(error).toBeInstanceOf(NodeOperationError);
                expect((error as NodeOperationError).message).toContain('Failed to perform advanced search');
                expect((error as NodeOperationError).message).toContain('Search error');
            }
        });
    });

    describe('sortPosts', () => {
        it('should sort posts by timestamp descending', () => {
            const posts = [
                { id: '1', timestamp: 1000 },
                { id: '2', timestamp: 3000 },
                { id: '3', timestamp: 2000 }
            ];

            const SearchOps = SearchOperations as any;
            const sorted = SearchOps.sortPosts(posts, 'timestamp', 'desc');

            expect(sorted[0].id).toBe('2'); // Highest timestamp first
            expect(sorted[1].id).toBe('3');
            expect(sorted[2].id).toBe('1');
        });

        it('should sort posts by notes ascending', () => {
            const posts = [
                { id: '1', note_count: 100 },
                { id: '2', note_count: 50 },
                { id: '3', note_count: 200 }
            ];

            const SearchOps = SearchOperations as any;
            const sorted = SearchOps.sortPosts(posts, 'notes', 'asc');

            expect(sorted[0].id).toBe('2'); // Lowest notes first
            expect(sorted[1].id).toBe('1');
            expect(sorted[2].id).toBe('3');
        });
    });

    describe('getTrending', () => {
        it('should get comprehensive trending content successfully', async () => {
            const now = Date.now();
            const recentTimestamp = Math.floor((now - 2 * 60 * 60 * 1000) / 1000); // 2 hours ago
            const oldTimestamp = Math.floor((now - 48 * 60 * 60 * 1000) / 1000); // 48 hours ago

            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        type: 'photo',
                        blog_name: 'testblog',
                        post_url: 'https://testblog.tumblr.com/post/1',
                        timestamp: recentTimestamp,
                        title: 'Amazing Art Photography',
                        summary: 'Beautiful landscape art',
                        tags: ['photography', 'art', 'landscape'],
                        note_count: 150
                    },
                    {
                        id: '2',
                        type: 'text',
                        blog_name: 'testblog2',
                        post_url: 'https://testblog2.tumblr.com/post/2',
                        timestamp: recentTimestamp,
                        title: 'Photography Tips',
                        summary: 'Learn photography techniques',
                        tags: ['photography', 'tutorial', 'tips'],
                        note_count: 100
                    },
                    {
                        id: '3',
                        type: 'video',
                        blog_name: 'testblog3',
                        post_url: 'https://testblog3.tumblr.com/post/3',
                        timestamp: oldTimestamp, // This should be filtered out for 24h timeframe
                        title: 'Old Video',
                        tags: ['video', 'old'],
                        note_count: 200
                    },
                    {
                        id: '4',
                        type: 'text',
                        blog_name: 'testblog4',
                        post_url: 'https://testblog4.tumblr.com/post/4',
                        timestamp: recentTimestamp,
                        title: 'Music Review',
                        summary: 'Latest album review',
                        tags: ['music', 'review', 'album'],
                        note_count: 75
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.getTrending(mockClient, {
                timeframe: '24h',
                limit: 10,
                includeContent: true,
                includeTags: true,
                includeTopics: true
            });

            expect(mockClient.userDashboard).toHaveBeenCalledWith({ limit: 200 });
            expect(result.success).toBe(true);

            const data = result.data as any;
            expect(data.timeframe).toBe('24h');
            expect(data.totalPostsAnalyzed).toBe(3); // Only recent posts within 24h

            // Check trending posts
            expect(data.trendingPosts).toBeDefined();
            expect(data.trendingPosts.length).toBeGreaterThan(0);
            expect(data.trendingPosts[0]).toHaveProperty('id');
            expect(data.trendingPosts[0]).toHaveProperty('trendingScore');

            // Check trending tags
            expect(data.trendingTags).toBeDefined();
            expect(data.trendingTags.length).toBeGreaterThan(0);
            expect(data.trendingTags[0]).toHaveProperty('tag');
            expect(data.trendingTags[0]).toHaveProperty('trendingScore');

            // Check trending topics
            expect(data.trendingTopics).toBeDefined();
            expect(data.trendingTopics.length).toBeGreaterThan(0);
            expect(data.trendingTopics[0]).toHaveProperty('topic');
            expect(data.trendingTopics[0]).toHaveProperty('score');

            // Check summary
            expect(data.summary).toBeDefined();
            expect(data.summary.totalTrendingItems).toBeGreaterThan(0);
            expect(data.summary.averageEngagement).toBeGreaterThan(0);
            expect(data.summary.mostActivePostType).toBeDefined();
            expect(data.summary.peakActivity).toHaveProperty('hour');
            expect(data.summary.peakActivity).toHaveProperty('count');

            expect((result.metadata as any).operation).toBe('getTrending');
            expect((result.metadata as any).timeframe).toBe('24h');
        });

        it('should handle different timeframes correctly', async () => {
            const now = Date.now();
            const thirtyMinutesAgo = Math.floor((now - 30 * 60 * 1000) / 1000); // 30 minutes ago
            const twoHoursAgo = Math.floor((now - 2 * 60 * 60 * 1000) / 1000); // 2 hours ago

            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        timestamp: thirtyMinutesAgo,
                        tags: ['recent'],
                        note_count: 50
                    },
                    {
                        id: '2',
                        timestamp: twoHoursAgo,
                        tags: ['older'],
                        note_count: 30
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            // Test 1h timeframe - should only include first post (30 min ago)
            const result1h = await SearchOperations.getTrending(mockClient, { timeframe: '1h' });
            expect((result1h.data as any).totalPostsAnalyzed).toBe(1);

            // Test 6h timeframe - should include both posts
            const result6h = await SearchOperations.getTrending(mockClient, { timeframe: '6h' });
            expect((result6h.data as any).totalPostsAnalyzed).toBe(2);
        });

        it('should handle selective content inclusion', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        timestamp: Math.floor(Date.now() / 1000),
                        tags: ['test'],
                        note_count: 50,
                        title: 'Test post'
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            // Test with only tags
            const resultTagsOnly = await SearchOperations.getTrending(mockClient, {
                includeContent: false,
                includeTags: true,
                includeTopics: false
            });

            const dataTagsOnly = resultTagsOnly.data as any;
            expect(dataTagsOnly.trendingPosts).toBeUndefined();
            expect(dataTagsOnly.trendingTags).toBeDefined();
            expect(dataTagsOnly.trendingTopics).toBeUndefined();

            // Test with only content
            const resultContentOnly = await SearchOperations.getTrending(mockClient, {
                includeContent: true,
                includeTags: false,
                includeTopics: false
            });

            const dataContentOnly = resultContentOnly.data as any;
            expect(dataContentOnly.trendingPosts).toBeDefined();
            expect(dataContentOnly.trendingTags).toBeUndefined();
            expect(dataContentOnly.trendingTopics).toBeUndefined();
        });

        it('should calculate trending scores correctly', async () => {
            const now = Date.now();
            const recentTimestamp = Math.floor((now - 1 * 60 * 60 * 1000) / 1000); // 1 hour ago
            const olderTimestamp = Math.floor((now - 12 * 60 * 60 * 1000) / 1000); // 12 hours ago

            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        type: 'photo', // Gets type bonus
                        timestamp: recentTimestamp, // More recent
                        note_count: 100,
                        tags: ['test']
                    },
                    {
                        id: '2',
                        type: 'text',
                        timestamp: olderTimestamp, // Less recent
                        note_count: 150, // Higher engagement but older
                        tags: ['test']
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.getTrending(mockClient);
            const trendingPosts = (result.data as any).trendingPosts;

            expect(trendingPosts).toHaveLength(2);
            // The more recent photo post should have a higher trending score despite lower notes
            // due to recency factor and type bonus
            expect(trendingPosts[0].trendingScore).toBeGreaterThan(0);
            expect(trendingPosts[1].trendingScore).toBeGreaterThan(0);
        });

        it('should extract topics correctly', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        timestamp: Math.floor(Date.now() / 1000),
                        title: 'Amazing Art Photography',
                        body: 'This is a beautiful piece of art',
                        tags: ['art', 'photography', 'creative'],
                        note_count: 100
                    },
                    {
                        id: '2',
                        timestamp: Math.floor(Date.now() / 1000),
                        title: 'Music Album Review',
                        body: 'Great music and sound quality',
                        tags: ['music', 'album', 'review'],
                        note_count: 80
                    },
                    {
                        id: '3',
                        timestamp: Math.floor(Date.now() / 1000),
                        title: 'Photography Tips',
                        body: 'Learn camera techniques',
                        tags: ['photography', 'tutorial'],
                        note_count: 60
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.getTrending(mockClient);
            const trendingTopics = (result.data as any).trendingTopics;

            expect(trendingTopics).toBeDefined();
            expect(trendingTopics.length).toBeGreaterThan(0);

            // Should detect art, music, and photography topics
            const topicNames = trendingTopics.map((t: any) => t.topic);
            expect(topicNames).toContain('art');
            expect(topicNames).toContain('music');
            expect(topicNames).toContain('photography');

            // Check topic structure
            const artTopic = trendingTopics.find((t: any) => t.topic === 'art');
            expect(artTopic).toHaveProperty('score');
            expect(artTopic).toHaveProperty('posts');
            expect(artTopic).toHaveProperty('keywords');
            expect(artTopic.keywords).toContain('art');
        });

        it('should filter tags by minimum frequency', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        timestamp: Math.floor(Date.now() / 1000),
                        tags: ['common', 'tag1'],
                        note_count: 50
                    },
                    {
                        id: '2',
                        timestamp: Math.floor(Date.now() / 1000),
                        tags: ['common', 'tag2'],
                        note_count: 30
                    },
                    {
                        id: '3',
                        timestamp: Math.floor(Date.now() / 1000),
                        tags: ['rare'],
                        note_count: 20
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.getTrending(mockClient);
            const trendingTags = (result.data as any).trendingTags;

            expect(trendingTags).toBeDefined();
            // Should only include tags that appear multiple times
            const tagNames = trendingTags.map((t: any) => t.tag);
            expect(tagNames).toContain('common'); // Appears 2 times
            expect(tagNames).not.toContain('rare'); // Appears only 1 time
        });

        it('should handle trending content errors gracefully', async () => {
            mockClient.userDashboard.mockRejectedValue(new Error('Dashboard error'));

            await expect(SearchOperations.getTrending(mockClient))
                .rejects.toThrow(NodeOperationError);

            try {
                await SearchOperations.getTrending(mockClient);
            } catch (error) {
                expect(error).toBeInstanceOf(NodeOperationError);
                expect((error as NodeOperationError).message).toContain('Failed to get trending content');
                expect((error as NodeOperationError).message).toContain('Dashboard error');
            }
        });
    });

    describe('searchUserContent', () => {
        beforeEach(() => {
            // Add blogPosts method to mock client
            (mockClient as any).blogPosts = jest.fn();
        });

        it('should search user content across dashboard successfully', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        type: 'text',
                        blog_name: 'testblog1',
                        title: 'Photography Tutorial',
                        body: 'Learn about camera settings',
                        tags: ['photography', 'tutorial'],
                        note_count: 100,
                        date: '2023-06-01',
                        timestamp: 1685577600
                    },
                    {
                        id: '2',
                        type: 'photo',
                        blog_name: 'testblog2',
                        caption: 'Beautiful landscape photo',
                        tags: ['photography', 'landscape'],
                        note_count: 75,
                        date: '2023-06-02',
                        timestamp: 1685664000
                    },
                    {
                        id: '3',
                        type: 'text',
                        blog_name: 'testblog1',
                        title: 'Cooking Recipe',
                        body: 'How to make pasta',
                        tags: ['cooking', 'recipe'],
                        note_count: 50,
                        date: '2023-06-03',
                        timestamp: 1685750400
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const searchParams = {
                keyword: 'photo',
                sortBy: 'notes',
                sortOrder: 'desc',
                page: 1,
                pageSize: 10
            };

            const result = await SearchOperations.searchUserContent(mockClient, searchParams);

            expect(mockClient.userDashboard).toHaveBeenCalledWith({
                limit: 50,
                offset: 0,
                type: undefined
            });

            expect(result.success).toBe(true);
            expect((result.data as any).posts).toHaveLength(2); // Should match posts with 'photo' in title/caption/tags
            expect((result.data as any).totalResults).toBe(2);
            expect((result.data as any).searchScope).toBe('user_dashboard');
            expect((result.data as any).page).toBe(1);
            expect((result.data as any).pageSize).toBe(10);
            expect((result.data as any).hasNextPage).toBe(false);
            expect((result.data as any).hasPreviousPage).toBe(false);

            // Check blog stats
            expect((result.data as any).blogStats).toBeDefined();
            expect((result.data as any).blogStats.totalBlogs).toBe(2);
            expect((result.data as any).blogStats.topBlogs).toHaveLength(2);

            // Check content analysis
            expect((result.data as any).contentAnalysis).toBeDefined();
            expect((result.data as any).contentAnalysis.postTypeDistribution).toBeDefined();
            expect((result.data as any).contentAnalysis.topTags).toBeDefined();
            expect((result.data as any).contentAnalysis.averageEngagement).toBeGreaterThan(0);

            expect((result.metadata as any).operation).toBe('searchUserContent');
            expect((result.metadata as any).totalMatches).toBe(2);
        });

        it('should search within a specific blog successfully', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        type: 'text',
                        blog_name: 'specificblog',
                        title: 'Blog Post 1',
                        tags: ['test'],
                        note_count: 25
                    },
                    {
                        id: '2',
                        type: 'photo',
                        blog_name: 'specificblog',
                        caption: 'Blog Photo 1',
                        tags: ['photo'],
                        note_count: 40
                    }
                ]
            };

            (mockClient as any).blogPosts.mockResolvedValue(mockResponse);

            const searchParams = {
                blogName: 'specificblog',
                limit: 30
            };

            const result = await SearchOperations.searchUserContent(mockClient, searchParams);

            expect((mockClient as any).blogPosts).toHaveBeenCalledWith('specificblog', {
                limit: 30,
                offset: 0,
                type: undefined
            });

            expect(result.success).toBe(true);
            expect((result.data as any).posts).toHaveLength(2); // Both posts
            expect((result.data as any).searchScope).toBe('blog:specificblog');
        });

        it('should filter by tags correctly', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        tags: ['photography', 'tutorial', 'beginner']
                    },
                    {
                        id: '2',
                        tags: ['photography', 'advanced']
                    },
                    {
                        id: '3',
                        tags: ['cooking', 'tutorial']
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const searchParams = {
                tags: ['photography', 'tutorial']
            };

            const result = await SearchOperations.searchUserContent(mockClient, searchParams);

            expect((result.data as any).posts).toHaveLength(1); // Only post 1 has both tags
            expect((result.data as any).posts[0].id).toBe('1');
        });

        it('should filter by date range correctly', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        date: '2023-01-15',
                        title: 'Old post'
                    },
                    {
                        id: '2',
                        date: '2023-06-15',
                        title: 'Recent post'
                    },
                    {
                        id: '3',
                        date: '2023-12-15',
                        title: 'Future post'
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const searchParams = {
                dateFrom: '2023-06-01',
                dateTo: '2023-11-30'
            };

            const result = await SearchOperations.searchUserContent(mockClient, searchParams);

            expect((result.data as any).posts).toHaveLength(1); // Only the June post
            expect((result.data as any).posts[0].id).toBe('2');
        });

        it('should filter by notes count correctly', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        note_count: 10,
                        title: 'Low engagement'
                    },
                    {
                        id: '2',
                        note_count: 50,
                        title: 'Medium engagement'
                    },
                    {
                        id: '3',
                        note_count: 150,
                        title: 'High engagement'
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const searchParams = {
                minNotes: 25,
                maxNotes: 100
            };

            const result = await SearchOperations.searchUserContent(mockClient, searchParams);

            expect((result.data as any).posts).toHaveLength(1); // Only post 2 is in range
            expect((result.data as any).posts[0].id).toBe('2');
        });

        it('should handle pagination correctly', async () => {
            const mockPosts = Array.from({ length: 25 }, (_, i) => ({
                id: `${i + 1}`,
                title: `Post ${i + 1}`,
                note_count: i + 1
            }));

            mockClient.userDashboard.mockResolvedValue({ posts: mockPosts });

            const searchParams = {
                page: 2,
                pageSize: 10
            };

            const result = await SearchOperations.searchUserContent(mockClient, searchParams);

            expect((result.data as any).posts).toHaveLength(10);
            expect((result.data as any).page).toBe(2);
            expect((result.data as any).pageSize).toBe(10);
            expect((result.data as any).totalPages).toBe(3); // 25 posts / 10 per page = 3 pages
            expect((result.data as any).hasNextPage).toBe(true);
            expect((result.data as any).hasPreviousPage).toBe(true);
            expect((result.data as any).posts[0].id).toBe('11'); // First post on page 2
        });

        it('should search across multiple content fields', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        title: 'Contains search term',
                        body: 'Regular content'
                    },
                    {
                        id: '2',
                        title: 'Regular title',
                        body: 'Body contains search term'
                    },
                    {
                        id: '3',
                        caption: 'Caption with search term'
                    },
                    {
                        id: '4',
                        summary: 'Summary has search term'
                    },
                    {
                        id: '5',
                        source_title: 'Source title with search term'
                    },
                    {
                        id: '6',
                        quote: 'Quote contains search term'
                    },
                    {
                        id: '7',
                        description: 'Description has search term'
                    },
                    {
                        id: '8',
                        title: 'No match here'
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const searchParams = {
                keyword: 'search'
            };

            const result = await SearchOperations.searchUserContent(mockClient, searchParams);

            expect((result.data as any).posts).toHaveLength(7); // Should match posts 1-7
            expect((result.data as any).posts.map((p: any) => p.id)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
        });

        it('should calculate blog stats correctly', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        blog_name: 'blog1',
                        note_count: 100
                    },
                    {
                        id: '2',
                        blog_name: 'blog1',
                        note_count: 50
                    },
                    {
                        id: '3',
                        blog_name: 'blog2',
                        note_count: 200
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.searchUserContent(mockClient, {});

            const blogStats = (result.data as any).blogStats;
            expect(blogStats.totalBlogs).toBe(2);
            expect(blogStats.topBlogs).toHaveLength(2);
            expect(blogStats.topBlogs[0].blogName).toBe('blog1'); // Most posts
            expect(blogStats.topBlogs[0].postCount).toBe(2);
            expect(blogStats.topBlogs[0].averageEngagement).toBe(75); // (100 + 50) / 2
            expect(blogStats.averagePostsPerBlog).toBe(2); // 3 posts / 2 blogs = 1.5, rounded to 2
        });

        it('should analyze content patterns correctly', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        type: 'text',
                        tags: ['photography', 'tutorial'],
                        note_count: 100,
                        date: '2023-06-01T10:30:00Z'
                    },
                    {
                        id: '2',
                        type: 'photo',
                        tags: ['photography', 'landscape'],
                        note_count: 75,
                        date: '2023-06-01T14:15:00Z'
                    },
                    {
                        id: '3',
                        type: 'text',
                        tags: ['cooking'],
                        note_count: 50,
                        date: '2023-06-01T10:45:00Z'
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.searchUserContent(mockClient, {});

            const contentAnalysis = (result.data as any).contentAnalysis;
            expect(contentAnalysis.postTypeDistribution).toEqual({ text: 2, photo: 1 });
            expect(contentAnalysis.topTags).toContainEqual({ tag: 'photography', count: 2 });
            expect(contentAnalysis.activeHours.length).toBeGreaterThan(0);
            expect(contentAnalysis.averageEngagement).toBe(75); // (100 + 75 + 50) / 3
            expect(contentAnalysis.totalEngagement).toBe(225);
            expect(contentAnalysis.contentDiversity).toBe(2); // 2 different post types
            expect(contentAnalysis.tagDiversity).toBe(4); // 4 unique tags: photography, tutorial, landscape, cooking
        });

        it('should handle blog-specific search errors with helpful messages', async () => {
            const blogError = new Error('Blog not found');
            (mockClient as any).blogPosts.mockRejectedValue(blogError);

            const searchParams = {
                blogName: 'nonexistent-blog'
            };

            await expect(SearchOperations.searchUserContent(mockClient, searchParams))
                .rejects.toThrow(NodeOperationError);

            try {
                await SearchOperations.searchUserContent(mockClient, searchParams);
            } catch (error) {
                expect(error).toBeInstanceOf(NodeOperationError);
                expect((error as NodeOperationError).message).toContain('Failed to search content in blog "nonexistent-blog"');
                expect((error as NodeOperationError).description).toContain('Check that the blog "nonexistent-blog" exists');
                expect((error as NodeOperationError).description).toContain('Try searching without specifying a blog name');
            }
        });

        it('should provide helpful error messages for different error types', async () => {
            // Test rate limit error
            const rateLimitError = new Error('Rate limit exceeded (429)');
            mockClient.userDashboard.mockRejectedValue(rateLimitError);

            await expect(SearchOperations.searchUserContent(mockClient, {}))
                .rejects.toThrow(NodeOperationError);

            try {
                await SearchOperations.searchUserContent(mockClient, {});
            } catch (error) {
                expect(error).toBeInstanceOf(NodeOperationError);
                expect((error as NodeOperationError).description).toContain('Rate limit reached');
                expect((error as NodeOperationError).description).toContain('Wait a few minutes');
            }

            // Test unauthorized error
            const authError = new Error('Unauthorized (401)');
            mockClient.userDashboard.mockRejectedValue(authError);

            try {
                await SearchOperations.searchUserContent(mockClient, {});
            } catch (error) {
                expect(error).toBeInstanceOf(NodeOperationError);
                expect((error as NodeOperationError).description).toContain('Authentication failed');
                expect((error as NodeOperationError).description).toContain('Check your Tumblr credentials');
            }

            // Test network error
            const networkError = new Error('Network timeout');
            mockClient.userDashboard.mockRejectedValue(networkError);

            try {
                await SearchOperations.searchUserContent(mockClient, {});
            } catch (error) {
                expect(error).toBeInstanceOf(NodeOperationError);
                expect((error as NodeOperationError).description).toContain('Network error occurred');
                expect((error as NodeOperationError).description).toContain('Check your internet connection');
            }
        });

        it('should handle empty search results', async () => {
            const mockResponse = {
                posts: [
                    { id: '1', title: 'No match', body: 'Nothing here' },
                    { id: '2', title: 'Also no match', body: 'Still nothing' }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const searchParams = {
                keyword: 'nonexistent'
            };

            const result = await SearchOperations.searchUserContent(mockClient, searchParams);

            expect(result.success).toBe(true);
            expect((result.data as any).posts).toHaveLength(0);
            expect((result.data as any).totalResults).toBe(0);
            expect((result.data as any).totalPages).toBe(0);
        });

        it('should handle case-insensitive search', async () => {
            const mockResponse = {
                posts: [
                    { id: '1', title: 'UPPERCASE SEARCH' },
                    { id: '2', title: 'lowercase search' },
                    { id: '3', title: 'MiXeD CaSe SeArCh' },
                    { id: '4', tags: ['SEARCH', 'tag'] }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const searchParams = {
                keyword: 'SEARCH'
            };

            const result = await SearchOperations.searchUserContent(mockClient, searchParams);

            expect((result.data as any).posts).toHaveLength(4); // Should match all posts
        });

        it('should include comprehensive metadata', async () => {
            const mockResponse = { posts: [] };
            (mockClient as any).blogPosts.mockResolvedValue(mockResponse);

            const searchParams = {
                blogName: 'testblog',
                keyword: 'test',
                tags: ['tag1', 'tag2'],
                postType: 'text',
                dateFrom: '2023-01-01',
                dateTo: '2023-12-31',
                minNotes: 10,
                maxNotes: 100,
                limit: 25,
                offset: 5,
                sortBy: 'notes',
                sortOrder: 'asc',
                page: 3,
                pageSize: 8
            };

            const result = await SearchOperations.searchUserContent(mockClient, searchParams);

            expect((result.metadata as any).searchParams).toEqual({
                blogName: 'testblog',
                keyword: 'test',
                tags: ['tag1', 'tag2'],
                postType: 'text',
                dateFrom: '2023-01-01',
                dateTo: '2023-12-31',
                minNotes: 10,
                maxNotes: 100,
                limit: 25,
                offset: 5,
                sortBy: 'notes',
                sortOrder: 'asc',
                page: 3,
                pageSize: 8
            });
        });
    });

    describe('calculateBlogStats', () => {
        it('should calculate blog statistics correctly', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        timestamp: Math.floor(Date.now() / 1000),
                        tags: ['popular', 'common'],
                        note_count: 50
                    },
                    {
                        id: '2',
                        timestamp: Math.floor(Date.now() / 1000),
                        tags: ['popular', 'common'],
                        note_count: 40
                    },
                    {
                        id: '3',
                        timestamp: Math.floor(Date.now() / 1000),
                        tags: ['rare'], // Only appears once
                        note_count: 100
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.getTrending(mockClient);
            const trendingTags = (result.data as any).trendingTags;

            // Should only include tags that appear multiple times
            const tagNames = trendingTags.map((t: any) => t.tag);
            expect(tagNames).toContain('popular');
            expect(tagNames).toContain('common');
            expect(tagNames).not.toContain('rare'); // Filtered out due to low frequency
        });

        it('should calculate peak activity correctly', async () => {
            const now = Date.now();
            const baseTime = now - (2 * 60 * 60 * 1000); // 2 hours ago
            const baseHour = new Date(baseTime).getHours();

            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        timestamp: Math.floor(baseTime / 1000), // baseHour
                        tags: ['test'],
                        note_count: 50
                    },
                    {
                        id: '2',
                        timestamp: Math.floor((baseTime + 60 * 60 * 1000) / 1000), // baseHour + 1
                        tags: ['test'],
                        note_count: 40
                    },
                    {
                        id: '3',
                        timestamp: Math.floor(baseTime / 1000), // baseHour (same hour as first)
                        tags: ['test'],
                        note_count: 30
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.getTrending(mockClient);
            const summary = (result.data as any).summary;

            expect(summary.peakActivity).toBeDefined();
            expect(summary.peakActivity.hour).toBe(baseHour); // Hour with most posts
            expect(summary.peakActivity.count).toBe(2); // Two posts at baseHour
        });

        it('should handle empty results gracefully', async () => {
            const mockResponse = { posts: [] };
            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.getTrending(mockClient);

            expect(result.success).toBe(true);
            const data = result.data as any;
            expect(data.totalPostsAnalyzed).toBe(0);
            expect(data.trendingPosts).toEqual([]);
            expect(data.trendingTags).toEqual([]);
            expect(data.trendingTopics).toEqual([]);
            expect(data.summary.totalTrendingItems).toBe(0);
            expect(data.summary.averageEngagement).toBe(0);
        });

        it('should handle posts without timestamps gracefully', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                        tags: ['test'],
                        note_count: 50
                    },
                    {
                        id: '2',
                        // No timestamp or date - should use current time
                        tags: ['test2'],
                        note_count: 30
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.getTrending(mockClient, { timeframe: '24h' });

            expect(result.success).toBe(true);
            expect((result.data as any).totalPostsAnalyzed).toBeGreaterThan(0);
        });

        it('should handle trending operation errors gracefully', async () => {
            const errorMessage = 'Dashboard access denied';
            mockClient.userDashboard.mockRejectedValue(new Error(errorMessage));

            await expect(SearchOperations.getTrending(mockClient))
                .rejects.toThrow(NodeOperationError);

            try {
                await SearchOperations.getTrending(mockClient);
            } catch (error) {
                expect(error).toBeInstanceOf(NodeOperationError);
                expect((error as NodeOperationError).message).toContain('Failed to get trending content');
                expect((error as NodeOperationError).message).toContain(errorMessage);
                expect((error as NodeOperationError).description).toContain('Check your credentials and try adjusting the timeframe');
            }
        });

        it('should respect limit parameter for all trending types', async () => {
            const mockResponse = {
                posts: Array.from({ length: 50 }, (_, i) => ({
                    id: `${i}`,
                    timestamp: Math.floor(Date.now() / 1000),
                    tags: [`tag${i}`, 'common'],
                    note_count: 50 - i,
                    title: `Post ${i} about art and photography`
                }))
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.getTrending(mockClient, { limit: 5 });
            const data = result.data as any;

            expect(data.trendingPosts.length).toBeLessThanOrEqual(5);
            expect(data.trendingTags.length).toBeLessThanOrEqual(5);
            expect(data.trendingTopics.length).toBeLessThanOrEqual(5);
        });

        it('should include correct metadata in response', async () => {
            const mockResponse = {
                posts: [
                    {
                        id: '1',
                        timestamp: Math.floor(Date.now() / 1000),
                        tags: ['test'],
                        note_count: 50
                    }
                ]
            };

            mockClient.userDashboard.mockResolvedValue(mockResponse);

            const result = await SearchOperations.getTrending(mockClient, { timeframe: '6h' });

            expect(result.metadata).toBeDefined();
            const metadata = result.metadata as any;
            expect(metadata.operation).toBe('getTrending');
            expect(metadata.timeframe).toBe('6h');
            expect(metadata.timestamp).toBeDefined();
            expect(metadata.analysisScope).toBeDefined();
            expect(metadata.analysisScope.totalPosts).toBe(1);
            expect(metadata.analysisScope.recentPosts).toBeDefined();
            expect(metadata.analysisScope.timeThreshold).toBeDefined();
        });
    });

    describe('similarity calculation', () => {
        it('should calculate similarity correctly', () => {
            // Access private method through any casting for testing
            const SearchOps = SearchOperations as any;

            expect(SearchOps.calculateSimilarity('test', 'test')).toBe(1);
            expect(SearchOps.calculateSimilarity('test', 'testing')).toBeGreaterThan(0.5);
            expect(SearchOps.calculateSimilarity('abc', 'xyz')).toBe(0);
            expect(SearchOps.calculateSimilarity('', '')).toBe(1);
        });

        it('should calculate Levenshtein distance correctly', () => {
            const SearchOps = SearchOperations as any;

            expect(SearchOps.levenshteinDistance('test', 'test')).toBe(0);
            expect(SearchOps.levenshteinDistance('test', 'testing')).toBe(3);
            expect(SearchOps.levenshteinDistance('abc', 'xyz')).toBe(3);
            expect(SearchOps.levenshteinDistance('', 'abc')).toBe(3);
        });
    });

    describe('calculateBlogStats', () => {
        it('should calculate blog statistics correctly', async () => {
            const posts = [
                { blog_name: 'blog1', note_count: 100 },
                { blog_name: 'blog1', note_count: 50 },
                { blog_name: 'blog2', note_count: 200 },
                { blog_name: 'blog3', note_count: 75 }
            ];

            const SearchOps = SearchOperations as any;
            const stats = SearchOps.calculateBlogStats(posts);

            expect(stats.totalBlogs).toBe(3);
            expect(stats.topBlogs).toHaveLength(3);
            expect(stats.topBlogs[0].blogName).toBe('blog1'); // Most posts (2)
            expect(stats.topBlogs[0].postCount).toBe(2);
            expect(stats.topBlogs[0].averageEngagement).toBe(75); // (100 + 50) / 2
            expect(stats.averagePostsPerBlog).toBe(1); // 4 posts / 3 blogs = 1.33, rounded to 1
        });
    });

    describe('analyzeUserContent', () => {
        it('should analyze content patterns correctly', async () => {
            const posts = [
                {
                    type: 'text',
                    tags: ['photography', 'tutorial'],
                    note_count: 100,
                    date: '2023-06-01T10:30:00Z'
                },
                {
                    type: 'photo',
                    tags: ['photography', 'landscape'],
                    note_count: 75,
                    date: '2023-06-01T14:15:00Z'
                },
                {
                    type: 'text',
                    tags: ['cooking'],
                    note_count: 50,
                    date: '2023-06-01T10:45:00Z'
                }
            ];

            const SearchOps = SearchOperations as any;
            const analysis = SearchOps.analyzeUserContent(posts);

            expect(analysis.postTypeDistribution).toEqual({ text: 2, photo: 1 });
            expect(analysis.topTags).toContainEqual({ tag: 'photography', count: 2 });
            expect(analysis.topTags).toContainEqual({ tag: 'tutorial', count: 1 });
            expect(analysis.activeHours.length).toBeGreaterThan(0);
            expect(analysis.averageEngagement).toBe(75); // (100 + 75 + 50) / 3
            expect(analysis.totalEngagement).toBe(225);
            expect(analysis.contentDiversity).toBe(2); // 2 different post types
            expect(analysis.tagDiversity).toBe(4); // 4 unique tags: photography, tutorial, landscape, cooking
        });

        it('should handle posts without tags or timestamps', async () => {
            const posts = [
                {
                    type: 'text',
                    note_count: 50
                },
                {
                    type: 'photo',
                    tags: null,
                    note_count: 25,
                    timestamp: 1685577600
                }
            ];

            const SearchOps = SearchOperations as any;
            const analysis = SearchOps.analyzeUserContent(posts);

            expect(analysis.postTypeDistribution).toEqual({ text: 1, photo: 1 });
            expect(analysis.topTags).toHaveLength(0);
            expect(analysis.averageEngagement).toBe(38); // (50 + 25) / 2 = 37.5, rounded to 38
            expect(analysis.contentDiversity).toBe(2);
            expect(analysis.tagDiversity).toBe(0);
        });
    });
});