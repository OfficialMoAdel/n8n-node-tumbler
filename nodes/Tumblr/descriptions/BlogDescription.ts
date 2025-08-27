import { INodeProperties } from 'n8n-workflow';

/**
 * Blog operation parameter definitions for the Tumblr node
 * Provides comprehensive UI configuration for blog-related operations
 */
export const blogOperations: INodeProperties[] = [
    // Blog Name parameter - required for all blog operations
    {
        displayName: 'Blog Name',
        name: 'blogName',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['blog'],
            },
        },
        default: '',
        placeholder: 'myblog.tumblr.com',
        description: 'The name of the blog (e.g., myblog.tumblr.com or just myblog). You can use either the full URL or just the blog name.',
        hint: 'Enter the blog name without the protocol (http/https)',
    },

    // Blog Info Operation Parameters
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        displayOptions: {
            show: {
                resource: ['blog'],
                operation: ['getInfo'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Include Avatar',
                name: 'includeAvatar',
                type: 'boolean',
                default: true,
                description: 'Whether to include avatar information in the response',
            },
            {
                displayName: 'Include Theme',
                name: 'includeTheme',
                type: 'boolean',
                default: true,
                description: 'Whether to include theme configuration details',
            },
            {
                displayName: 'Include Statistics',
                name: 'includeStats',
                type: 'boolean',
                default: true,
                description: 'Whether to include blog statistics (posts count, followers, etc.)',
            },
        ],
    },

    // Blog Posts Operation Parameters
    {
        displayName: 'Post Filters',
        name: 'postFilters',
        type: 'collection',
        placeholder: 'Add Filter',
        displayOptions: {
            show: {
                resource: ['blog'],
                operation: ['getPosts'],
            },
        },
        default: {},
        options: [
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
                description: 'Filter posts by type',
            },
            {
                displayName: 'Tag',
                name: 'tag',
                type: 'string',
                default: '',
                placeholder: 'photography',
                description: 'Filter posts by a specific tag',
            },
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 20,
                description: 'Number of posts to retrieve (maximum 50)',
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
                displayName: 'Before ID',
                name: 'before',
                type: 'string',
                default: '',
                placeholder: '1234567890',
                description: 'Return posts published before this post ID (for pagination)',
            },
        ],
    },

    {
        displayName: 'Post Options',
        name: 'postOptions',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['blog'],
                operation: ['getPosts'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Content Filter',
                name: 'filter',
                type: 'options',
                options: [
                    {
                        name: 'Text',
                        value: 'text',
                        description: 'Return posts with text content',
                    },
                    {
                        name: 'Raw',
                        value: 'raw',
                        description: 'Return posts with raw HTML content',
                    },
                ],
                default: 'text',
                description: 'Content format for returned posts',
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

    // Blog Followers Operation Parameters
    {
        displayName: 'Follower Options',
        name: 'followerOptions',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['blog'],
                operation: ['getFollowers'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 20,
                description: 'Number of followers to retrieve (maximum 20)',
                typeOptions: {
                    minValue: 1,
                    maxValue: 20,
                },
            },
            {
                displayName: 'Offset',
                name: 'offset',
                type: 'number',
                default: 0,
                description: 'Number of followers to skip (for pagination)',
                typeOptions: {
                    minValue: 0,
                },
            },
        ],
    },

    // Blog Search Operation Parameters
    {
        displayName: 'Search Query',
        name: 'searchQuery',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['blog'],
                operation: ['searchPosts'],
            },
        },
        default: '',
        placeholder: 'photography tips',
        description: 'Search query to find posts within the blog',
    },

    {
        displayName: 'Search Options',
        name: 'searchOptions',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['blog'],
                operation: ['searchPosts'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 50,
                description: 'Maximum number of posts to search through',
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
                description: 'Number of posts to skip before searching',
                typeOptions: {
                    minValue: 0,
                },
            },
            {
                displayName: 'Case Sensitive',
                name: 'caseSensitive',
                type: 'boolean',
                default: false,
                description: 'Whether the search should be case sensitive',
            },
        ],
    },
];

/**
 * Blog operation definitions with descriptions and actions
 */
export const blogOperationOptions: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
        show: {
            resource: ['blog'],
        },
    },
    options: [
        {
            name: 'Get Info',
            value: 'getInfo',
            description: 'Get comprehensive blog information including statistics, theme, and configuration',
            action: 'Get blog information',
        },
        {
            name: 'Get Posts',
            value: 'getPosts',
            description: 'Retrieve blog posts with filtering and pagination options',
            action: 'Get blog posts',
        },
        {
            name: 'Get Followers',
            value: 'getFollowers',
            description: 'Get blog followers information (may be restricted based on privacy settings)',
            action: 'Get blog followers',
        },
        {
            name: 'Search Posts',
            value: 'searchPosts',
            description: 'Search for posts within a specific blog using keywords',
            action: 'Search blog posts',
        },
    ],
    default: 'getInfo',
};

/**
 * Validation rules for blog operations
 */
export const blogValidationRules = {
    /**
     * Validate blog name format
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

        // Check length constraints
        if (trimmedName.length > 100) {
            return 'Blog name is too long (maximum 100 characters)';
        }

        return null;
    },

    /**
     * Validate post limit parameter
     */
    validatePostLimit: (limit: number): string | null => {
        if (limit < 1) {
            return 'Limit must be at least 1';
        }
        if (limit > 50) {
            return 'Limit cannot exceed 50 (Tumblr API restriction)';
        }
        return null;
    },

    /**
     * Validate offset parameter
     */
    validateOffset: (offset: number): string | null => {
        if (offset < 0) {
            return 'Offset cannot be negative';
        }
        return null;
    },

    /**
     * Validate search query
     */
    validateSearchQuery: (query: string): string | null => {
        if (!query || query.trim().length === 0) {
            return 'Search query is required';
        }
        if (query.trim().length < 2) {
            return 'Search query must be at least 2 characters long';
        }
        if (query.length > 500) {
            return 'Search query is too long (maximum 500 characters)';
        }
        return null;
    },
};

/**
 * Help text and documentation for blog operations
 */
export const blogHelpText = {
    getInfo: {
        description: 'Retrieves comprehensive information about a Tumblr blog including title, description, statistics, theme configuration, and avatar details.',
        examples: [
            'Get basic blog information: Set Blog Name to "myblog" or "myblog.tumblr.com"',
            'Include all details: Enable all options in Additional Fields',
        ],
        notes: [
            'Some information may be restricted based on blog privacy settings',
            'Follower count may not be available for all blogs',
        ],
    },
    getPosts: {
        description: 'Retrieves posts from a blog with extensive filtering and pagination options. Supports filtering by post type, tags, and date ranges.',
        examples: [
            'Get recent posts: Set limit to 20, leave other filters empty',
            'Get photo posts only: Set Post Type to "Photo" in Post Filters',
            'Get posts with specific tag: Set Tag to "photography" in Post Filters',
            'Paginate results: Use Offset to skip posts, or Before ID for cursor-based pagination',
        ],
        notes: [
            'Maximum 50 posts per request (Tumblr API limitation)',
            'Use pagination for accessing more posts',
            'Private posts are only visible to blog owners',
        ],
    },
    getFollowers: {
        description: 'Retrieves information about blog followers. Access may be restricted based on blog privacy settings and user permissions.',
        examples: [
            'Get follower list: Set appropriate limit and offset for pagination',
        ],
        notes: [
            'Follower information may be restricted for privacy',
            'Only follower count may be available for some blogs',
            'Maximum 20 followers per request',
        ],
    },
    searchPosts: {
        description: 'Searches for posts within a specific blog using keyword matching. Searches through post titles, content, captions, and tags.',
        examples: [
            'Search for photography posts: Set Search Query to "photography"',
            'Case-sensitive search: Enable Case Sensitive option',
            'Limit search scope: Adjust Limit to search through fewer posts',
        ],
        notes: [
            'Search is performed client-side after retrieving posts',
            'Searches through title, body, caption, summary, quote, source, and tags',
            'Performance depends on the number of posts to search through',
        ],
    },
};