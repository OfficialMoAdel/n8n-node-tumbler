import { INodeProperties } from 'n8n-workflow';

/**
 * User operation parameter definitions for the Tumblr node
 * Provides comprehensive UI configuration for user-related operations and social interactions
 */
export const userOperations: INodeProperties[] = [
    // User Info Operation Parameters
    {
        displayName: 'User Info Options',
        name: 'userInfoOptions',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['getInfo'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Include Blogs',
                name: 'includeBlogs',
                type: 'boolean',
                default: true,
                description: 'Whether to include the list of blogs owned by the user',
            },
            {
                displayName: 'Include Statistics',
                name: 'includeStats',
                type: 'boolean',
                default: true,
                description: 'Whether to include user statistics (likes count, following count, etc.)',
            },
        ],
    },

    // Dashboard Operation Parameters
    {
        displayName: 'Dashboard Options',
        name: 'dashboardOptions',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['getDashboard'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 20,
                description: 'Number of posts to retrieve from dashboard (maximum 50)',
                typeOptions: {
                    minValue: 1,
                    maxValue: 50,
                },
            },
            {
                displayName: 'Offset',
                name: 'offset',
                type: 'number',
                default: 0,
                description: 'Number of posts to skip (for pagination)',
                typeOptions: {
                    minValue: 0,
                },
            },
            {
                displayName: 'Post Type',
                name: 'type',
                type: 'options',
                options: [
                    {
                        name: 'All Types',
                        value: '',
                        description: 'Include all post types',
                    },
                    {
                        name: 'Text',
                        value: 'text',
                        description: 'Text posts only',
                    },
                    {
                        name: 'Photo',
                        value: 'photo',
                        description: 'Photo posts only',
                    },
                    {
                        name: 'Quote',
                        value: 'quote',
                        description: 'Quote posts only',
                    },
                    {
                        name: 'Link',
                        value: 'link',
                        description: 'Link posts only',
                    },
                    {
                        name: 'Chat',
                        value: 'chat',
                        description: 'Chat posts only',
                    },
                    {
                        name: 'Video',
                        value: 'video',
                        description: 'Video posts only',
                    },
                    {
                        name: 'Audio',
                        value: 'audio',
                        description: 'Audio posts only',
                    },
                ],
                default: '',
                description: 'Filter dashboard posts by type',
            },
            {
                displayName: 'Since ID',
                name: 'sinceId',
                type: 'string',
                default: '',
                placeholder: '1234567890',
                description: 'Return posts published after this post ID',
            },
            {
                displayName: 'Include Reblog Info',
                name: 'reblogInfo',
                type: 'boolean',
                default: false,
                description: 'Whether to include reblog chain information',
            },
            {
                displayName: 'Include Notes Info',
                name: 'notesInfo',
                type: 'boolean',
                default: false,
                description: 'Whether to include notes (likes/reblogs) information',
            },
        ],
    },

    // Likes Operation Parameters
    {
        displayName: 'Likes Options',
        name: 'likesOptions',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['getLikes'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 20,
                description: 'Number of liked posts to retrieve (maximum 50)',
                typeOptions: {
                    minValue: 1,
                    maxValue: 50,
                },
            },
            {
                displayName: 'Offset',
                name: 'offset',
                type: 'number',
                default: 0,
                description: 'Number of liked posts to skip (for pagination)',
                typeOptions: {
                    minValue: 0,
                },
            },
            {
                displayName: 'Before Timestamp',
                name: 'before',
                type: 'number',
                default: 0,
                description: 'Return likes before this timestamp (Unix timestamp)',
                typeOptions: {
                    minValue: 0,
                },
            },
            {
                displayName: 'After Timestamp',
                name: 'after',
                type: 'number',
                default: 0,
                description: 'Return likes after this timestamp (Unix timestamp)',
                typeOptions: {
                    minValue: 0,
                },
            },
        ],
    },

    // Following Operation Parameters
    {
        displayName: 'Following Options',
        name: 'followingOptions',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['getFollowing'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 20,
                description: 'Number of followed blogs to retrieve (maximum 50)',
                typeOptions: {
                    minValue: 1,
                    maxValue: 50,
                },
            },
            {
                displayName: 'Offset',
                name: 'offset',
                type: 'number',
                default: 0,
                description: 'Number of followed blogs to skip (for pagination)',
                typeOptions: {
                    minValue: 0,
                },
            },
        ],
    },

    // Social Interaction Parameters
    {
        displayName: 'Blog Name',
        name: 'blogName',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['follow', 'unfollow'],
            },
        },
        default: '',
        placeholder: 'blogname.tumblr.com',
        description: 'The name of the blog to follow or unfollow',
    },

    {
        displayName: 'Post ID',
        name: 'postId',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['like', 'unlike', 'reblog'],
            },
        },
        default: '',
        placeholder: '1234567890',
        description: 'The ID of the post to like, unlike, or reblog',
    },

    {
        displayName: 'Reblog Key',
        name: 'reblogKey',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['like', 'unlike', 'reblog'],
            },
        },
        default: '',
        placeholder: 'abcdef123456',
        description: 'The reblog key of the post (required for social interactions)',
    },

    // Reblog Parameters
    {
        displayName: 'Reblog Options',
        name: 'reblogOptions',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['reblog'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Comment',
                name: 'comment',
                type: 'string',
                typeOptions: {
                    rows: 3,
                },
                default: '',
                placeholder: 'Add your comment to the reblog...',
                description: 'Optional comment to add to the reblog',
            },
            {
                displayName: 'Tags',
                name: 'tags',
                type: 'string',
                default: '',
                placeholder: 'tag1, tag2, tag3',
                description: 'Comma-separated list of tags to add to the reblog',
            },
            {
                displayName: 'State',
                name: 'state',
                type: 'options',
                options: [
                    {
                        name: 'Published',
                        value: 'published',
                        description: 'Publish the reblog immediately',
                    },
                    {
                        name: 'Draft',
                        value: 'draft',
                        description: 'Save reblog as draft',
                    },
                    {
                        name: 'Queue',
                        value: 'queue',
                        description: 'Add reblog to publishing queue',
                    },
                    {
                        name: 'Private',
                        value: 'private',
                        description: 'Make reblog private',
                    },
                ],
                default: 'published',
                description: 'Publishing state of the reblog',
            },
        ],
    },

    // Batch Operations Parameters
    {
        displayName: 'Batch Items',
        name: 'batchItems',
        type: 'string',
        typeOptions: {
            rows: 5,
        },
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['batchLike', 'batchUnlike', 'batchFollow', 'batchUnfollow'],
            },
        },
        default: '',
        placeholder: 'For posts: postId1:reblogKey1, postId2:reblogKey2\nFor blogs: blog1.tumblr.com, blog2.tumblr.com',
        description: 'Comma-separated list of items for batch operations',
        hint: 'Format depends on operation type - see placeholder for examples',
    },

    {
        displayName: 'Batch Options',
        name: 'batchOptions',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['batchLike', 'batchUnlike', 'batchFollow', 'batchUnfollow'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Delay Between Requests',
                name: 'delay',
                type: 'number',
                default: 1000,
                description: 'Delay in milliseconds between each request (to avoid rate limiting)',
                typeOptions: {
                    minValue: 100,
                    maxValue: 10000,
                },
            },
            {
                displayName: 'Continue on Error',
                name: 'continueOnError',
                type: 'boolean',
                default: true,
                description: 'Whether to continue processing remaining items if one fails',
            },
            {
                displayName: 'Max Concurrent',
                name: 'maxConcurrent',
                type: 'number',
                default: 3,
                description: 'Maximum number of concurrent requests',
                typeOptions: {
                    minValue: 1,
                    maxValue: 10,
                },
            },
        ],
    },
];

/**
 * User operation definitions with descriptions and actions
 */
export const userOperationOptions: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
        show: {
            resource: ['user'],
        },
    },
    options: [
        {
            name: 'Get Info',
            value: 'getInfo',
            description: 'Get comprehensive user account information including blogs and statistics',
            action: 'Get user information',
        },
        {
            name: 'Get Dashboard',
            value: 'getDashboard',
            description: 'Retrieve posts from the user\'s dashboard (following feed)',
            action: 'Get user dashboard',
        },
        {
            name: 'Get Likes',
            value: 'getLikes',
            description: 'Get posts that the user has liked with filtering options',
            action: 'Get user likes',
        },
        {
            name: 'Get Following',
            value: 'getFollowing',
            description: 'Get list of blogs that the user is following',
            action: 'Get following list',
        },
        {
            name: 'Follow Blog',
            value: 'follow',
            description: 'Follow a specific blog',
            action: 'Follow a blog',
        },
        {
            name: 'Unfollow Blog',
            value: 'unfollow',
            description: 'Unfollow a specific blog',
            action: 'Unfollow a blog',
        },
        {
            name: 'Like Post',
            value: 'like',
            description: 'Like a specific post',
            action: 'Like a post',
        },
        {
            name: 'Unlike Post',
            value: 'unlike',
            description: 'Remove like from a specific post',
            action: 'Unlike a post',
        },
        {
            name: 'Reblog Post',
            value: 'reblog',
            description: 'Reblog a post with optional commentary and tags',
            action: 'Reblog a post',
        },
        {
            name: 'Batch Like',
            value: 'batchLike',
            description: 'Like multiple posts in a single operation',
            action: 'Batch like posts',
        },
        {
            name: 'Batch Unlike',
            value: 'batchUnlike',
            description: 'Unlike multiple posts in a single operation',
            action: 'Batch unlike posts',
        },
        {
            name: 'Batch Follow',
            value: 'batchFollow',
            description: 'Follow multiple blogs in a single operation',
            action: 'Batch follow blogs',
        },
        {
            name: 'Batch Unfollow',
            value: 'batchUnfollow',
            description: 'Unfollow multiple blogs in a single operation',
            action: 'Batch unfollow blogs',
        },
    ],
    default: 'getInfo',
};

/**
 * Validation rules for user operations
 */
export const userValidationRules = {
    /**
     * Validate blog name format for follow/unfollow operations
     */
    validateBlogName: (blogName: string): string | null => {
        if (!blogName || blogName.trim().length === 0) {
            return 'Blog name is required';
        }

        const trimmedName = blogName.trim();

        // Check for invalid characters
        if (!/^[a-zA-Z0-9\-_.]+(?:\.tumblr\.com)?$/.test(trimmedName)) {
            return 'Blog name contains invalid characters. Use only letters, numbers, hyphens, and dots.';
        }

        return null;
    },

    /**
     * Validate post ID and reblog key for social interactions
     */
    validateSocialInteraction: (postId: string, reblogKey: string): string | null => {
        if (!postId || postId.trim().length === 0) {
            return 'Post ID is required';
        }

        if (!/^\d+$/.test(postId.trim())) {
            return 'Post ID must be a numeric value';
        }

        if (!reblogKey || reblogKey.trim().length === 0) {
            return 'Reblog key is required for social interactions';
        }

        if (reblogKey.trim().length < 6) {
            return 'Reblog key appears to be invalid (too short)';
        }

        return null;
    },

    /**
     * Validate batch items format
     */
    validateBatchItems: (items: string, operationType: 'post' | 'blog'): string | null => {
        if (!items || items.trim().length === 0) {
            return 'Batch items list is required';
        }

        const itemList = items.split(',').map(item => item.trim()).filter(item => item);

        if (itemList.length === 0) {
            return 'At least one item is required for batch operations';
        }

        if (itemList.length > 50) {
            return 'Maximum 50 items allowed per batch operation';
        }

        if (operationType === 'post') {
            // Validate post format: postId:reblogKey
            const invalidItems = itemList.filter(item => {
                const parts = item.split(':');
                return parts.length !== 2 || !/^\d+$/.test(parts[0]) || parts[1].length < 6;
            });

            if (invalidItems.length > 0) {
                return 'Post items must be in format "postId:reblogKey" (e.g., "123456:abcdef")';
            }
        } else if (operationType === 'blog') {
            // Validate blog names
            const invalidItems = itemList.filter(item => {
                return !/^[a-zA-Z0-9\-_.]+(?:\.tumblr\.com)?$/.test(item);
            });

            if (invalidItems.length > 0) {
                return 'Invalid blog name format detected. Use format "blogname" or "blogname.tumblr.com"';
            }
        }

        return null;
    },

    /**
     * Validate pagination parameters
     */
    validatePagination: (limit: number, offset: number): string | null => {
        if (limit < 1) {
            return 'Limit must be at least 1';
        }
        if (limit > 50) {
            return 'Limit cannot exceed 50 (Tumblr API restriction)';
        }
        if (offset < 0) {
            return 'Offset cannot be negative';
        }
        return null;
    },

    /**
     * Validate timestamp parameters
     */
    validateTimestamp: (timestamp: number, fieldName: string): string | null => {
        if (timestamp < 0) {
            return `${fieldName} cannot be negative`;
        }

        // Check if timestamp is reasonable (not in the far future)
        const maxTimestamp = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year from now
        if (timestamp > maxTimestamp) {
            return `${fieldName} appears to be invalid (too far in the future)`;
        }

        return null;
    },
};

/**
 * Help text and documentation for user operations
 */
export const userHelpText = {
    getInfo: {
        description: 'Retrieves comprehensive information about the authenticated user account including profile details, owned blogs, and account statistics.',
        examples: [
            'Get basic user info: Use default settings',
            'Include all details: Enable both "Include Blogs" and "Include Statistics"',
        ],
        notes: [
            'Returns information for the authenticated user only',
            'Blog list includes all blogs owned by the user',
            'Statistics include likes count, following count, and default post format',
        ],
    },
    getDashboard: {
        description: 'Retrieves posts from the user\'s dashboard (the feed of posts from blogs they follow). Supports filtering and pagination.',
        examples: [
            'Get recent dashboard: Set limit to 20, leave other options empty',
            'Filter by post type: Set Post Type to specific type like "Photo"',
            'Paginate results: Use Offset to skip posts or Since ID for cursor-based pagination',
            'Include metadata: Enable "Include Reblog Info" and "Include Notes Info"',
        ],
        notes: [
            'Dashboard shows posts from followed blogs',
            'Maximum 50 posts per request',
            'Use pagination for accessing more posts',
            'Reblog and notes info add extra API calls',
        ],
    },
    getLikes: {
        description: 'Retrieves posts that the user has liked with timestamp-based filtering and pagination options.',
        examples: [
            'Get recent likes: Set limit and use default options',
            'Get likes from specific period: Use Before/After Timestamp filters',
            'Paginate through likes: Use Offset for pagination',
        ],
        notes: [
            'Returns posts liked by the authenticated user',
            'Timestamps are Unix timestamps (seconds since epoch)',
            'Likes are returned in reverse chronological order',
            'Maximum 50 likes per request',
        ],
    },
    getFollowing: {
        description: 'Retrieves the list of blogs that the user is currently following with pagination support.',
        examples: [
            'Get following list: Set appropriate limit and offset',
            'Paginate through following: Use Offset to skip blogs',
        ],
        notes: [
            'Returns blogs followed by the authenticated user',
            'Maximum 50 blogs per request',
            'Use pagination for complete following list',
        ],
    },
    follow: {
        description: 'Follows a specific blog. The user will start seeing posts from this blog in their dashboard.',
        examples: [
            'Follow blog: Enter blog name like "example" or "example.tumblr.com"',
        ],
        notes: [
            'Blog name can be with or without .tumblr.com suffix',
            'Following is immediate and cannot be undone with this operation',
            'Use "Unfollow Blog" operation to reverse',
        ],
    },
    unfollow: {
        description: 'Unfollows a specific blog. The user will stop seeing posts from this blog in their dashboard.',
        examples: [
            'Unfollow blog: Enter blog name like "example" or "example.tumblr.com"',
        ],
        notes: [
            'Blog name can be with or without .tumblr.com suffix',
            'Unfollowing is immediate',
            'Use "Follow Blog" operation to follow again',
        ],
    },
    like: {
        description: 'Likes a specific post. Both Post ID and Reblog Key are required for this operation.',
        examples: [
            'Like post: Provide Post ID (e.g., "123456789") and Reblog Key (e.g., "abcdef123")',
        ],
        notes: [
            'Both Post ID and Reblog Key are required',
            'Reblog Key can be obtained from post data',
            'Liking is immediate and adds to user\'s likes',
        ],
    },
    unlike: {
        description: 'Removes a like from a specific post. Both Post ID and Reblog Key are required.',
        examples: [
            'Unlike post: Provide Post ID and Reblog Key of previously liked post',
        ],
        notes: [
            'Only works on posts the user has previously liked',
            'Both Post ID and Reblog Key are required',
            'Unlike is immediate and removes from user\'s likes',
        ],
    },
    reblog: {
        description: 'Reblogs a post to the user\'s blog with optional commentary and tags. Supports different publishing states.',
        examples: [
            'Simple reblog: Provide Post ID and Reblog Key, leave options empty',
            'Reblog with comment: Add comment in Reblog Options',
            'Reblog with tags: Add comma-separated tags in Reblog Options',
            'Schedule reblog: Set State to "Queue" in Reblog Options',
        ],
        notes: [
            'Post ID and Reblog Key are required',
            'Commentary is optional but recommended for engagement',
            'Tags are added to the reblog, not the original post',
            'State determines when/how the reblog is published',
        ],
    },
    batchLike: {
        description: 'Likes multiple posts in a single operation with rate limiting and error handling.',
        examples: [
            'Batch like: Format as "postId1:reblogKey1, postId2:reblogKey2"',
            'With delay: Set "Delay Between Requests" to avoid rate limiting',
            'Error handling: Enable "Continue on Error" to process all items',
        ],
        notes: [
            'Format: "postId:reblogKey" separated by commas',
            'Maximum 50 posts per batch',
            'Includes automatic rate limiting',
            'Failed items are reported in results',
        ],
    },
    batchUnlike: {
        description: 'Unlikes multiple posts in a single operation with the same format as batch like.',
        examples: [
            'Batch unlike: Use same format as batch like operation',
        ],
        notes: [
            'Same format and limitations as batch like',
            'Only works on previously liked posts',
        ],
    },
    batchFollow: {
        description: 'Follows multiple blogs in a single operation with rate limiting.',
        examples: [
            'Batch follow: Format as "blog1.tumblr.com, blog2, blog3.tumblr.com"',
        ],
        notes: [
            'Blog names separated by commas',
            'Can use with or without .tumblr.com suffix',
            'Maximum 50 blogs per batch',
            'Includes automatic rate limiting',
        ],
    },
    batchUnfollow: {
        description: 'Unfollows multiple blogs in a single operation with the same format as batch follow.',
        examples: [
            'Batch unfollow: Use same format as batch follow operation',
        ],
        notes: [
            'Same format and limitations as batch follow',
            'Only works on currently followed blogs',
        ],
    },
};