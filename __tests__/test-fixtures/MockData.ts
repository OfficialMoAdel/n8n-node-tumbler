/**
 * Mock data and fixtures for testing
 */

export const mockCredentials = {
    valid: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        accessToken: 'valid-access-token',
        refreshToken: 'valid-refresh-token',
        tokenType: 'Bearer' as const,
        expiresAt: Date.now() + 3600000, // 1 hour from now
    },
    expired: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        accessToken: 'expired-access-token',
        refreshToken: 'valid-refresh-token',
        tokenType: 'Bearer' as const,
        expiresAt: Date.now() - 1000, // Expired
    },
    invalid: {
        clientId: 'invalid-client-id',
        clientSecret: 'invalid-client-secret',
        accessToken: 'invalid-access-token',
        refreshToken: 'invalid-refresh-token',
        tokenType: 'Bearer' as const,
    },
};

export const mockBlogData = {
    basic: {
        name: 'test-blog',
        title: 'Test Blog',
        description: 'A test blog for unit testing',
        url: 'https://test-blog.tumblr.com',
        uuid: 'test-uuid-123',
        updated: 1640995200,
        posts: 100,
        followers: 50,
        total_posts: 100,
        share_likes: true,
        share_following: false,
        can_be_followed: true,
    },
    detailed: {
        name: 'detailed-blog',
        title: 'Detailed Test Blog',
        description: 'A detailed test blog with full metadata',
        url: 'https://detailed-blog.tumblr.com',
        uuid: 'detailed-uuid-456',
        updated: 1640995200,
        posts: 500,
        followers: 1000,
        total_posts: 500,
        share_likes: true,
        share_following: true,
        can_be_followed: true,
        theme: {
            header_full_width: 1920,
            header_full_height: 1080,
            header_focus_width: 1280,
            header_focus_height: 720,
            avatar_shape: 'circle',
            background_color: '#ffffff',
            body_font: 'Arial, sans-serif',
            header_bounds: '0,0,1920,1080',
            header_image: 'https://example.com/header.jpg',
            header_image_focused: 'https://example.com/header-focused.jpg',
            header_image_scaled: 'https://example.com/header-scaled.jpg',
            header_stretch: true,
            link_color: '#0066cc',
            show_avatar: true,
            show_description: true,
            show_header_image: true,
            show_title: true,
            title_color: '#000000',
            title_font: 'Georgia, serif',
            title_font_weight: 'bold',
        },
    },
};

export const mockPostData = {
    text: {
        id: '12345',
        type: 'text',
        blog_name: 'test-blog',
        post_url: 'https://test-blog.tumblr.com/post/12345',
        timestamp: 1640995200,
        date: '2022-01-01 00:00:00 GMT',
        tags: ['test', 'text-post'],
        state: 'published',
        format: 'html',
        reblog_key: 'test-reblog-key',
        slug: 'test-text-post',
        summary: 'A test text post',
        note_count: 25,
        title: 'Test Text Post',
        body: '<p>This is a test text post content.</p>',
    },
    photo: {
        id: '67890',
        type: 'photo',
        blog_name: 'test-blog',
        post_url: 'https://test-blog.tumblr.com/post/67890',
        timestamp: 1640995200,
        date: '2022-01-01 00:00:00 GMT',
        tags: ['test', 'photo-post', 'photography'],
        state: 'published',
        format: 'html',
        reblog_key: 'test-photo-reblog-key',
        slug: 'test-photo-post',
        summary: 'A test photo post',
        note_count: 50,
        caption: '<p>This is a test photo post.</p>',
        photos: [
            {
                caption: 'Test photo',
                alt_sizes: [
                    { url: 'https://example.com/photo-500.jpg', width: 500, height: 375 },
                    { url: 'https://example.com/photo-250.jpg', width: 250, height: 188 },
                ],
                original_size: {
                    url: 'https://example.com/photo-original.jpg',
                    width: 1920,
                    height: 1440,
                },
            },
        ],
    },
    quote: {
        id: '11111',
        type: 'quote',
        blog_name: 'test-blog',
        post_url: 'https://test-blog.tumblr.com/post/11111',
        timestamp: 1640995200,
        date: '2022-01-01 00:00:00 GMT',
        tags: ['test', 'quote-post', 'inspiration'],
        state: 'published',
        format: 'html',
        reblog_key: 'test-quote-reblog-key',
        slug: 'test-quote-post',
        summary: 'A test quote post',
        note_count: 15,
        quote: 'This is a test quote for unit testing.',
        source: 'Test Author',
    },
    link: {
        id: '22222',
        type: 'link',
        blog_name: 'test-blog',
        post_url: 'https://test-blog.tumblr.com/post/22222',
        timestamp: 1640995200,
        date: '2022-01-01 00:00:00 GMT',
        tags: ['test', 'link-post'],
        state: 'published',
        format: 'html',
        reblog_key: 'test-link-reblog-key',
        slug: 'test-link-post',
        summary: 'A test link post',
        note_count: 10,
        url: 'https://example.com',
        title: 'Test Link',
        description: 'This is a test link post description.',
    },
    video: {
        id: '33333',
        type: 'video',
        blog_name: 'test-blog',
        post_url: 'https://test-blog.tumblr.com/post/33333',
        timestamp: 1640995200,
        date: '2022-01-01 00:00:00 GMT',
        tags: ['test', 'video-post'],
        state: 'published',
        format: 'html',
        reblog_key: 'test-video-reblog-key',
        slug: 'test-video-post',
        summary: 'A test video post',
        note_count: 75,
        caption: '<p>This is a test video post.</p>',
        video_url: 'https://example.com/test-video.mp4',
    },
    audio: {
        id: '44444',
        type: 'audio',
        blog_name: 'test-blog',
        post_url: 'https://test-blog.tumblr.com/post/44444',
        timestamp: 1640995200,
        date: '2022-01-01 00:00:00 GMT',
        tags: ['test', 'audio-post', 'music'],
        state: 'published',
        format: 'html',
        reblog_key: 'test-audio-reblog-key',
        slug: 'test-audio-post',
        summary: 'A test audio post',
        note_count: 30,
        caption: '<p>This is a test audio post.</p>',
        audio_url: 'https://example.com/test-audio.mp3',
        audio_source_url: 'https://example.com/test-audio-source.mp3',
        track_name: 'Test Track',
        artist: 'Test Artist',
        album: 'Test Album',
    },
};

export const mockUserData = {
    basic: {
        name: 'test-user',
        likes: 100,
        following: 50,
        default_post_format: 'html',
        blogs: [mockBlogData.basic],
    },
    detailed: {
        name: 'detailed-user',
        likes: 500,
        following: 200,
        default_post_format: 'markdown',
        blogs: [mockBlogData.basic, mockBlogData.detailed],
    },
};

export const mockSearchData = {
    tagResults: {
        posts: [
            mockPostData.text,
            mockPostData.photo,
            mockPostData.quote,
        ],
        total_posts: 3,
        tag: 'test',
    },
    keywordResults: {
        posts: [
            mockPostData.text,
            mockPostData.link,
        ],
        total_posts: 2,
        keyword: 'test',
        search_metadata: {
            query: 'test',
            total_results: 2,
            page: 1,
            per_page: 20,
        },
    },
    trendingTags: [
        { name: 'photography', post_count: 1000000 },
        { name: 'art', post_count: 800000 },
        { name: 'music', post_count: 600000 },
        { name: 'fashion', post_count: 500000 },
        { name: 'nature', post_count: 400000 },
    ],
};

export const mockQueueData = {
    posts: [
        {
            ...mockPostData.text,
            state: 'queue',
            scheduled_publish_time: Date.now() + 3600000, // 1 hour from now
        },
        {
            ...mockPostData.photo,
            state: 'queue',
            scheduled_publish_time: Date.now() + 7200000, // 2 hours from now
        },
    ],
    total_posts: 2,
};

export const mockDraftData = {
    posts: [
        {
            ...mockPostData.text,
            state: 'draft',
            id: 'draft-12345',
        },
        {
            ...mockPostData.photo,
            state: 'draft',
            id: 'draft-67890',
        },
    ],
    total_posts: 2,
};

export const mockErrorResponses = {
    badRequest: {
        status: 400,
        message: 'Bad Request',
        errors: [
            { title: 'Invalid parameter', detail: 'Blog name is required' }
        ],
    },
    unauthorized: {
        status: 401,
        message: 'Unauthorized',
        errors: [
            { title: 'Authentication failed', detail: 'Invalid access token' }
        ],
    },
    forbidden: {
        status: 403,
        message: 'Forbidden',
        errors: [
            { title: 'Insufficient permissions', detail: 'This operation requires write access' }
        ],
    },
    notFound: {
        status: 404,
        message: 'Not Found',
        errors: [
            { title: 'Resource not found', detail: 'The requested blog or post does not exist' }
        ],
    },
    rateLimited: {
        status: 429,
        message: 'Too Many Requests',
        headers: {
            'x-ratelimit-limit': '1000',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': String(Date.now() + 3600000),
        },
        errors: [
            { title: 'Rate limit exceeded', detail: 'You have exceeded the API rate limit' }
        ],
    },
    serverError: {
        status: 500,
        message: 'Internal Server Error',
        errors: [
            { title: 'Server error', detail: 'An unexpected error occurred on the server' }
        ],
    },
    serviceUnavailable: {
        status: 503,
        message: 'Service Unavailable',
        errors: [
            { title: 'Service unavailable', detail: 'The service is temporarily unavailable' }
        ],
    },
};

export const mockNetworkErrors = {
    timeout: {
        code: 'ETIMEDOUT',
        message: 'Request timeout',
    },
    connectionRefused: {
        code: 'ECONNREFUSED',
        message: 'Connection refused',
    },
    dnsError: {
        code: 'ENOTFOUND',
        message: 'DNS lookup failed',
    },
    sslError: {
        code: 'CERT_UNTRUSTED',
        message: 'SSL certificate error',
    },
};

export const createMockTumblrClient = (overrides: any = {}) => {
    return {
        // Blog operations
        blogInfo: jest.fn().mockResolvedValue({
            response: { blog: mockBlogData.basic }
        }),
        blogPosts: jest.fn().mockResolvedValue({
            response: { posts: [mockPostData.text, mockPostData.photo] }
        }),
        blogDrafts: jest.fn().mockResolvedValue({
            response: { posts: mockDraftData.posts }
        }),
        blogQueue: jest.fn().mockResolvedValue({
            response: { posts: mockQueueData.posts }
        }),

        // Post operations
        createTextPost: jest.fn().mockResolvedValue({
            response: { id: '12345', state: 'published' }
        }),
        createPhotoPost: jest.fn().mockResolvedValue({
            response: { id: '67890', state: 'published' }
        }),
        createQuotePost: jest.fn().mockResolvedValue({
            response: { id: '11111', state: 'published' }
        }),
        createLinkPost: jest.fn().mockResolvedValue({
            response: { id: '22222', state: 'published' }
        }),
        createVideoPost: jest.fn().mockResolvedValue({
            response: { id: '33333', state: 'published' }
        }),
        createAudioPost: jest.fn().mockResolvedValue({
            response: { id: '44444', state: 'published' }
        }),
        editPost: jest.fn().mockResolvedValue({
            response: { id: '12345', state: 'published' }
        }),
        deletePost: jest.fn().mockResolvedValue({
            response: { id: '12345' }
        }),

        // User operations
        userInfo: jest.fn().mockResolvedValue({
            response: { user: mockUserData.basic }
        }),
        userDashboard: jest.fn().mockResolvedValue({
            response: { posts: [mockPostData.text] }
        }),
        userLikes: jest.fn().mockResolvedValue({
            response: { liked_posts: [mockPostData.photo] }
        }),
        userFollowing: jest.fn().mockResolvedValue({
            response: { blogs: [mockBlogData.basic] }
        }),

        // Social operations
        likePost: jest.fn().mockResolvedValue({
            response: { success: true }
        }),
        unlikePost: jest.fn().mockResolvedValue({
            response: { success: true }
        }),
        followBlog: jest.fn().mockResolvedValue({
            response: { success: true }
        }),
        unfollowBlog: jest.fn().mockResolvedValue({
            response: { success: true }
        }),

        // Search operations
        taggedPosts: jest.fn().mockResolvedValue({
            response: mockSearchData.tagResults.posts
        }),

        ...overrides,
    };
};

export const createMockExecuteFunctions = (overrides: any = {}) => {
    return {
        getInputData: jest.fn().mockReturnValue([{ json: {} }]),
        getCredentials: jest.fn().mockResolvedValue(mockCredentials.valid),
        getNodeParameter: jest.fn(),
        continueOnFail: jest.fn().mockReturnValue(false),
        ...overrides,
    };
};