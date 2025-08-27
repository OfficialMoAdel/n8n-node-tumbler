import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
    NodeConnectionType,
} from 'n8n-workflow';

import { TumblrAuthenticator, TumblrClient } from './TumblrAuthenticator';
import { OperationRouter } from './OperationRouter';

export class Tumblr implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Tumblr',
        name: 'tumblr',
        icon: 'file:tumblr.svg',
        group: ['social'],
        version: 1,
        subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
        description: 'Interact with Tumblr API',
        defaults: {
            name: 'Tumblr',
        },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
        credentials: [
            {
                name: 'tumblrOAuth2Api',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Blog',
                        value: 'blog',
                    },
                    {
                        name: 'Post',
                        value: 'post',
                    },
                    {
                        name: 'User',
                        value: 'user',
                    },
                    {
                        name: 'Queue',
                        value: 'queue',
                    },
                    {
                        name: 'Draft',
                        value: 'draft',
                    },
                    {
                        name: 'Search',
                        value: 'search',
                    },
                ],
                default: 'post',
            },
            {
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
                        description: 'Get blog information',
                        action: 'Get blog info',
                    },
                    {
                        name: 'Get Posts',
                        value: 'getPosts',
                        description: 'Get blog posts',
                        action: 'Get blog posts',
                    },
                ],
                default: 'getInfo',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['post'],
                    },
                },
                options: [
                    {
                        name: 'Create',
                        value: 'create',
                        description: 'Create a new post',
                        action: 'Create a post',
                    },
                    {
                        name: 'Update',
                        value: 'update',
                        description: 'Update an existing post',
                        action: 'Update a post',
                    },
                    {
                        name: 'Delete',
                        value: 'delete',
                        description: 'Delete a post',
                        action: 'Delete a post',
                    },
                    {
                        name: 'Get',
                        value: 'get',
                        description: 'Get a specific post',
                        action: 'Get a post',
                    },
                ],
                default: 'create',
            },
            {
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
                        description: 'Get user information',
                        action: 'Get user info',
                    },
                    {
                        name: 'Get Dashboard',
                        value: 'getDashboard',
                        description: 'Get user dashboard',
                        action: 'Get user dashboard',
                    },
                    {
                        name: 'Get Likes',
                        value: 'getLikes',
                        description: 'Get user likes',
                        action: 'Get user likes',
                    },
                ],
                default: 'getInfo',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['queue'],
                    },
                },
                options: [
                    {
                        name: 'Add',
                        value: 'add',
                        description: 'Add post to queue',
                        action: 'Add to queue',
                    },
                    {
                        name: 'Get',
                        value: 'get',
                        description: 'Get queue posts',
                        action: 'Get queue',
                    },
                    {
                        name: 'Remove',
                        value: 'remove',
                        description: 'Remove post from queue',
                        action: 'Remove from queue',
                    },
                ],
                default: 'add',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['draft'],
                    },
                },
                options: [
                    {
                        name: 'Create',
                        value: 'create',
                        description: 'Create a draft',
                        action: 'Create a draft',
                    },
                    {
                        name: 'Get',
                        value: 'get',
                        description: 'Get drafts',
                        action: 'Get drafts',
                    },
                    {
                        name: 'Update',
                        value: 'update',
                        description: 'Update a draft',
                        action: 'Update a draft',
                    },
                    {
                        name: 'Delete',
                        value: 'delete',
                        description: 'Delete a draft',
                        action: 'Delete a draft',
                    },
                    {
                        name: 'Publish',
                        value: 'publish',
                        description: 'Publish a draft',
                        action: 'Publish a draft',
                    },
                ],
                default: 'create',
            },
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
                        description: 'Search posts by tag',
                        action: 'Search posts by tag',
                    },
                    {
                        name: 'Search by Keyword',
                        value: 'searchByKeyword',
                        description: 'Search posts by keyword with full-text search',
                        action: 'Search posts by keyword',
                    },
                    {
                        name: 'Advanced Search',
                        value: 'advancedSearch',
                        description: 'Search posts with advanced filtering options',
                        action: 'Advanced search posts',
                    },
                    {
                        name: 'Get Tag Info',
                        value: 'getTagInfo',
                        description: 'Get tag information and popularity metrics',
                        action: 'Get tag info',
                    },
                    {
                        name: 'Get Tag Suggestions',
                        value: 'getTagSuggestions',
                        description: 'Get tag suggestions based on partial tag name',
                        action: 'Get tag suggestions',
                    },
                    {
                        name: 'Get Trending Tags',
                        value: 'getTrendingTags',
                        description: 'Get trending tags based on recent activity',
                        action: 'Get trending tags',
                    },
                    {
                        name: 'Get Trending Content',
                        value: 'getTrending',
                        description: 'Get comprehensive trending content including popular posts, tags, and topics',
                        action: 'Get trending content',
                    },
                ],
                default: 'searchByKeyword',
            },
            // Search parameters
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
                placeholder: 'photography',
                description: 'The tag to search for',
            },
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
                placeholder: 'photography tips',
                description: 'The keyword to search for in post content',
            },
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
                placeholder: 'photo',
                description: 'Partial tag name to get suggestions for',
            },
            {
                displayName: 'Search Options',
                name: 'searchOptions',
                type: 'collection',
                placeholder: 'Add Option',
                displayOptions: {
                    show: {
                        resource: ['search'],
                        operation: ['searchByKeyword', 'searchByTag'],
                    },
                },
                default: {},
                options: [
                    {
                        displayName: 'Limit',
                        name: 'limit',
                        type: 'number',
                        default: 20,
                        description: 'Number of posts to return (max 50)',
                        typeOptions: {
                            minValue: 1,
                            maxValue: 50,
                        },
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
                        description: 'Number of posts per page',
                        typeOptions: {
                            minValue: 1,
                            maxValue: 50,
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
                                name: 'Notes Count',
                                value: 'notes',
                            },
                            {
                                name: 'Title',
                                value: 'title',
                            },
                        ],
                        default: 'timestamp',
                        description: 'Field to sort results by',
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
                        description: 'Sort order for results',
                    },
                    {
                        displayName: 'Post Type',
                        name: 'type',
                        type: 'options',
                        options: [
                            {
                                name: 'All',
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
                ],
            },
            {
                displayName: 'Advanced Search Options',
                name: 'advancedOptions',
                type: 'collection',
                placeholder: 'Add Option',
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
                        description: 'Keyword to search for in post content',
                    },
                    {
                        displayName: 'Tags',
                        name: 'tags',
                        type: 'string',
                        default: '',
                        description: 'Comma-separated list of tags to filter by',
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
                        description: 'Filter posts from this date',
                    },
                    {
                        displayName: 'Date To',
                        name: 'dateTo',
                        type: 'dateTime',
                        default: '',
                        description: 'Filter posts until this date',
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
                        description: 'Maximum number of results to return',
                        typeOptions: {
                            minValue: 1,
                            maxValue: 100,
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
                                name: 'Notes Count',
                                value: 'notes',
                            },
                            {
                                name: 'Title',
                                value: 'title',
                            },
                        ],
                        default: 'timestamp',
                        description: 'Field to sort results by',
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
                        description: 'Sort order for results',
                    },
                ],
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
                description: 'Number of results to return',
                typeOptions: {
                    minValue: 1,
                    maxValue: 50,
                },
            },
            {
                displayName: 'Trending Options',
                name: 'trendingOptions',
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
            // Basic blog name parameter for all operations that need it
            {
                displayName: 'Blog Name',
                name: 'blogName',
                type: 'string',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['blog', 'post', 'queue', 'draft'],
                    },
                },
                default: '',
                placeholder: 'myblog.tumblr.com',
                description: 'The name of the blog (e.g., myblog.tumblr.com or just myblog)',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        // Initialize authenticator and router
        const authenticator = new TumblrAuthenticator();
        const router = new OperationRouter();

        for (let i = 0; i < items.length; i++) {
            try {
                // Get credentials and authenticate
                const credentialData = await this.getCredentials('tumblrOAuth2Api', i);
                const credentials = {
                    id: 'tumblrOAuth2Api',
                    name: 'tumblrOAuth2Api',
                    type: 'tumblrOAuth2Api',
                    data: credentialData
                };
                const client = await authenticator.authenticate(credentials);

                // Get operation parameters
                const resource = this.getNodeParameter('resource', i) as 'blog' | 'post' | 'user' | 'queue' | 'draft' | 'search';
                const operation = this.getNodeParameter('operation', i) as string;
                const blogName = this.getNodeParameter('blogName', i, '') as string;

                // Prepare operation parameters based on resource type
                let parameters: any = {};

                if (resource === 'search') {
                    // Handle search-specific parameters
                    switch (operation) {
                        case 'searchByTag':
                        case 'getTagInfo':
                            parameters.tag = this.getNodeParameter('tag', i);
                            if (operation === 'searchByTag') {
                                parameters.options = this.getNodeParameter('searchOptions', i, {});
                            }
                            break;
                        case 'searchByKeyword':
                            parameters.keyword = this.getNodeParameter('keyword', i);
                            parameters.options = this.getNodeParameter('searchOptions', i, {});
                            break;
                        case 'getTagSuggestions':
                            parameters.partialTag = this.getNodeParameter('partialTag', i);
                            parameters.limit = this.getNodeParameter('limit', i, 10);
                            break;
                        case 'getTrendingTags':
                            parameters.limit = this.getNodeParameter('limit', i, 20);
                            break;
                        case 'getTrending':
                            parameters.options = this.getNodeParameter('trendingOptions', i, {});
                            break;
                        case 'advancedSearch':
                            const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as any;
                            // Convert tags string to array if provided
                            if (advancedOptions.tags && typeof advancedOptions.tags === 'string') {
                                advancedOptions.tags = advancedOptions.tags.split(',').map((tag: string) => tag.trim());
                            }
                            parameters = advancedOptions;
                            break;
                    }
                } else {
                    // Handle other resource parameters
                    parameters = this.getNodeParameter('additionalFields', i, {}) as any;
                }

                // Prepare operation config
                const operationConfig = {
                    resource,
                    operation,
                    blogName,
                    parameters,
                };

                // Execute operation
                const result = await router.route(operationConfig, client);

                // Add result to return data
                returnData.push({
                    json: {
                        success: true,
                        data: result,
                        metadata: {
                            operation: `${resource}:${operation}`,
                            timestamp: new Date().toISOString(),
                            blogName: blogName || undefined,
                        },
                    },
                });

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            success: false,
                            error: errorMessage,
                            metadata: {
                                operation: `${this.getNodeParameter('resource', i)}:${this.getNodeParameter('operation', i)}`,
                                timestamp: new Date().toISOString(),
                            },
                        },
                    });
                } else {
                    throw new NodeOperationError(this.getNode(), errorMessage, { itemIndex: i });
                }
            }
        }

        return [returnData];
    }
}