import { INodeProperties } from 'n8n-workflow';

export const searchOperations: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['search'],
            },
        },
        options: [
            {
                name: 'Search by Tag',
                value: 'searchByTag',
                description: 'Search for posts with a specific tag',
                action: 'Search posts by tag',
            },
            {
                name: 'Get Tag Info',
                value: 'getTagInfo',
                description: 'Get information about a specific tag including popularity metrics',
                action: 'Get tag information',
            },
            {
                name: 'Get Tag Suggestions',
                value: 'getTagSuggestions',
                description: 'Get tag suggestions based on a partial tag name',
                action: 'Get tag suggestions',
            },
            {
                name: 'Get Trending Tags',
                value: 'getTrendingTags',
                description: 'Get currently trending tags based on recent activity',
                action: 'Get trending tags',
            },
            {
                name: 'Search by Keyword',
                value: 'searchByKeyword',
                description: 'Search posts by keyword across title, body, and tags',
                action: 'Search posts by keyword',
            },
            {
                name: 'Advanced Search',
                value: 'advancedSearch',
                description: 'Perform advanced search with multiple filters',
                action: 'Perform advanced search',
            },
            {
                name: 'Get Trending Content',
                value: 'getTrending',
                description: 'Get comprehensive trending content including popular posts, tags, and topics',
                action: 'Get trending content',
            },
            {
                name: 'Search User Content',
                value: 'searchUserContent',
                description: 'Search content within specific blogs or user archives with advanced filtering',
                action: 'Search user content',
            },
        ],
        default: 'searchByTag',
    },
];

export const searchFields: INodeProperties[] = [
    // Search by Tag fields
    {
        displayName: 'Tag',
        name: 'tag',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['searchByTag', 'getTagInfo'],
            },
        },
        default: '',
        description: 'The tag to search for',
    },
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['searchByTag'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 20,
                description: 'Number of posts to return (1-50)',
                typeOptions: {
                    minValue: 1,
                    maxValue: 50,
                },
            },
            {
                displayName: 'Before',
                name: 'before',
                type: 'string',
                default: '',
                description: 'Return posts before this timestamp',
            },
            {
                displayName: 'Filter',
                name: 'filter',
                type: 'options',
                options: [
                    {
                        name: 'Text',
                        value: 'text',
                    },
                    {
                        name: 'Raw',
                        value: 'raw',
                    },
                ],
                default: 'text',
                description: 'Post format filter',
            },
        ],
    },

    // Tag Suggestions fields
    {
        displayName: 'Partial Tag',
        name: 'partialTag',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['getTagSuggestions'],
            },
        },
        default: '',
        description: 'Partial tag name to get suggestions for',
    },
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['getTagSuggestions', 'getTrendingTags'],
            },
        },
        default: 10,
        description: 'Number of suggestions/tags to return',
        typeOptions: {
            minValue: 1,
            maxValue: 50,
        },
    },

    // Keyword Search fields
    {
        displayName: 'Keyword',
        name: 'keyword',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['searchByKeyword'],
            },
        },
        default: '',
        description: 'Keyword to search for in posts',
    },
    {
        displayName: 'Search Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['searchByKeyword'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 50,
                description: 'Number of posts to fetch for searching',
                typeOptions: {
                    minValue: 1,
                    maxValue: 200,
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
                    },
                    {
                        name: 'Text',
                        value: 'text',
                    },
                    {
                        name: 'Photo',
                        value: 'photo',
                    },
                    {
                        name: 'Quote',
                        value: 'quote',
                    },
                    {
                        name: 'Link',
                        value: 'link',
                    },
                    {
                        name: 'Chat',
                        value: 'chat',
                    },
                    {
                        name: 'Video',
                        value: 'video',
                    },
                    {
                        name: 'Audio',
                        value: 'audio',
                    },
                ],
                default: '',
                description: 'Filter by post type',
            },
            {
                displayName: 'Sort By',
                name: 'sortBy',
                type: 'options',
                options: [
                    {
                        name: 'Timestamp',
                        value: 'timestamp',
                    },
                    {
                        name: 'Notes',
                        value: 'notes',
                    },
                    {
                        name: 'Title',
                        value: 'title',
                    },
                    {
                        name: 'Type',
                        value: 'type',
                    },
                ],
                default: 'timestamp',
                description: 'Sort results by',
            },
            {
                displayName: 'Sort Order',
                name: 'sortOrder',
                type: 'options',
                options: [
                    {
                        name: 'Descending',
                        value: 'desc',
                    },
                    {
                        name: 'Ascending',
                        value: 'asc',
                    },
                ],
                default: 'desc',
                description: 'Sort order',
            },
            {
                displayName: 'Page',
                name: 'page',
                type: 'number',
                default: 1,
                description: 'Page number for pagination',
                typeOptions: {
                    minValue: 1,
                },
            },
            {
                displayName: 'Page Size',
                name: 'pageSize',
                type: 'number',
                default: 20,
                description: 'Number of results per page',
                typeOptions: {
                    minValue: 1,
                    maxValue: 50,
                },
            },
        ],
    },

    // Advanced Search fields
    {
        displayName: 'Search Parameters',
        name: 'searchParams',
        type: 'collection',
        placeholder: 'Add Parameter',
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['advancedSearch'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Keyword',
                name: 'keyword',
                type: 'string',
                default: '',
                description: 'Keyword to search for',
            },
            {
                displayName: 'Tags',
                name: 'tags',
                type: 'string',
                default: '',
                description: 'Comma-separated list of tags to search for',
            },
            {
                displayName: 'Post Type',
                name: 'postType',
                type: 'options',
                options: [
                    {
                        name: 'Text',
                        value: 'text',
                    },
                    {
                        name: 'Photo',
                        value: 'photo',
                    },
                    {
                        name: 'Quote',
                        value: 'quote',
                    },
                    {
                        name: 'Link',
                        value: 'link',
                    },
                    {
                        name: 'Chat',
                        value: 'chat',
                    },
                    {
                        name: 'Video',
                        value: 'video',
                    },
                    {
                        name: 'Audio',
                        value: 'audio',
                    },
                ],
                default: '',
                description: 'Filter by post type',
            },
            {
                displayName: 'Date From',
                name: 'dateFrom',
                type: 'dateTime',
                default: '',
                description: 'Search posts from this date',
            },
            {
                displayName: 'Date To',
                name: 'dateTo',
                type: 'dateTime',
                default: '',
                description: 'Search posts until this date',
            },
            {
                displayName: 'Minimum Notes',
                name: 'minNotes',
                type: 'number',
                default: 0,
                description: 'Minimum number of notes (likes/reblogs)',
                typeOptions: {
                    minValue: 0,
                },
            },
            {
                displayName: 'Maximum Notes',
                name: 'maxNotes',
                type: 'number',
                default: 0,
                description: 'Maximum number of notes (0 = no limit)',
                typeOptions: {
                    minValue: 0,
                },
            },
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 50,
                description: 'Maximum number of results',
                typeOptions: {
                    minValue: 1,
                    maxValue: 200,
                },
            },
            {
                displayName: 'Sort By',
                name: 'sortBy',
                type: 'options',
                options: [
                    {
                        name: 'Timestamp',
                        value: 'timestamp',
                    },
                    {
                        name: 'Notes',
                        value: 'notes',
                    },
                    {
                        name: 'Title',
                        value: 'title',
                    },
                    {
                        name: 'Type',
                        value: 'type',
                    },
                ],
                default: 'timestamp',
                description: 'Sort results by',
            },
            {
                displayName: 'Sort Order',
                name: 'sortOrder',
                type: 'options',
                options: [
                    {
                        name: 'Descending',
                        value: 'desc',
                    },
                    {
                        name: 'Ascending',
                        value: 'asc',
                    },
                ],
                default: 'desc',
                description: 'Sort order',
            },
        ],
    },

    // Get Trending Content fields
    {
        displayName: 'Trending Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['getTrending'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Timeframe',
                name: 'timeframe',
                type: 'options',
                options: [
                    {
                        name: '1 Hour',
                        value: '1h',
                        description: 'Trending content from the last hour',
                    },
                    {
                        name: '6 Hours',
                        value: '6h',
                        description: 'Trending content from the last 6 hours',
                    },
                    {
                        name: '24 Hours',
                        value: '24h',
                        description: 'Trending content from the last 24 hours',
                    },
                    {
                        name: '7 Days',
                        value: '7d',
                        description: 'Trending content from the last 7 days',
                    },
                    {
                        name: '30 Days',
                        value: '30d',
                        description: 'Trending content from the last 30 days',
                    },
                ],
                default: '24h',
                description: 'Time period to analyze for trending content',
            },
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 20,
                description: 'Maximum number of trending items per category',
                typeOptions: {
                    minValue: 1,
                    maxValue: 50,
                },
            },
            {
                displayName: 'Include Content',
                name: 'includeContent',
                type: 'boolean',
                default: true,
                description: 'Whether to include trending posts in the results',
            },
            {
                displayName: 'Include Tags',
                name: 'includeTags',
                type: 'boolean',
                default: true,
                description: 'Whether to include trending tags in the results',
            },
            {
                displayName: 'Include Topics',
                name: 'includeTopics',
                type: 'boolean',
                default: true,
                description: 'Whether to include trending topics in the results',
            },
        ],
    },

    // Search User Content fields
    {
        displayName: 'Search Parameters',
        name: 'searchParams',
        type: 'collection',
        placeholder: 'Add Parameter',
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['searchUserContent'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Blog Name',
                name: 'blogName',
                type: 'string',
                default: '',
                description: 'Search within a specific blog (leave empty to search across your dashboard)',
                placeholder: 'example-blog',
            },
            {
                displayName: 'Keyword',
                name: 'keyword',
                type: 'string',
                default: '',
                description: 'Keyword to search for in post content, titles, captions, and tags',
            },
            {
                displayName: 'Tags',
                name: 'tags',
                type: 'string',
                default: '',
                description: 'Comma-separated list of tags to search for (all tags must be present)',
                placeholder: 'photography, art, tutorial',
            },
            {
                displayName: 'Post Type',
                name: 'postType',
                type: 'options',
                options: [
                    {
                        name: 'All Types',
                        value: '',
                    },
                    {
                        name: 'Text',
                        value: 'text',
                    },
                    {
                        name: 'Photo',
                        value: 'photo',
                    },
                    {
                        name: 'Quote',
                        value: 'quote',
                    },
                    {
                        name: 'Link',
                        value: 'link',
                    },
                    {
                        name: 'Chat',
                        value: 'chat',
                    },
                    {
                        name: 'Video',
                        value: 'video',
                    },
                    {
                        name: 'Audio',
                        value: 'audio',
                    },
                ],
                default: '',
                description: 'Filter by post type',
            },
            {
                displayName: 'Date From',
                name: 'dateFrom',
                type: 'dateTime',
                default: '',
                description: 'Search posts from this date onwards',
            },
            {
                displayName: 'Date To',
                name: 'dateTo',
                type: 'dateTime',
                default: '',
                description: 'Search posts until this date',
            },
            {
                displayName: 'Minimum Notes',
                name: 'minNotes',
                type: 'number',
                default: 0,
                description: 'Minimum number of notes (likes/reblogs) required',
                typeOptions: {
                    minValue: 0,
                },
            },
            {
                displayName: 'Maximum Notes',
                name: 'maxNotes',
                type: 'number',
                default: 0,
                description: 'Maximum number of notes (0 = no limit)',
                typeOptions: {
                    minValue: 0,
                },
            },
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 50,
                description: 'Maximum number of posts to fetch for searching',
                typeOptions: {
                    minValue: 1,
                    maxValue: 200,
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
                displayName: 'Sort By',
                name: 'sortBy',
                type: 'options',
                options: [
                    {
                        name: 'Timestamp',
                        value: 'timestamp',
                    },
                    {
                        name: 'Notes',
                        value: 'notes',
                    },
                    {
                        name: 'Title',
                        value: 'title',
                    },
                    {
                        name: 'Type',
                        value: 'type',
                    },
                ],
                default: 'timestamp',
                description: 'Sort results by',
            },
            {
                displayName: 'Sort Order',
                name: 'sortOrder',
                type: 'options',
                options: [
                    {
                        name: 'Descending',
                        value: 'desc',
                    },
                    {
                        name: 'Ascending',
                        value: 'asc',
                    },
                ],
                default: 'desc',
                description: 'Sort order',
            },
            {
                displayName: 'Page',
                name: 'page',
                type: 'number',
                default: 1,
                description: 'Page number for pagination',
                typeOptions: {
                    minValue: 1,
                },
            },
            {
                displayName: 'Page Size',
                name: 'pageSize',
                type: 'number',
                default: 20,
                description: 'Number of results per page',
                typeOptions: {
                    minValue: 1,
                    maxValue: 50,
                },
            },
        ],
    },
];