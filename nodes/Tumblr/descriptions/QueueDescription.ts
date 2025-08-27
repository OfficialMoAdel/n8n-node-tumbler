import { INodeProperties } from 'n8n-workflow';

/**
 * Queue operation parameter definitions for the Tumblr node
 * Provides comprehensive UI configuration for queue and draft management operations
 */
export const queueOperations: INodeProperties[] = [
    // Blog Name parameter - required for all queue operations
    {
        displayName: 'Blog Name',
        name: 'blogName',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
            },
        },
        default: '',
        placeholder: 'myblog.tumblr.com',
        description: 'The name of the blog where the queue/draft will be managed',
        hint: 'Enter the blog name without the protocol (http/https)',
    },

    // Post ID parameter - required for remove, update, and specific operations
    {
        displayName: 'Post ID',
        name: 'postId',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
                operation: ['remove', 'update', 'publish', 'get'],
            },
        },
        default: '',
        placeholder: '1234567890',
        description: 'The unique ID of the queued post or draft to manage',
    },

    // Post Type parameter - required for add operation
    {
        displayName: 'Post Type',
        name: 'postType',
        type: 'options',
        required: true,
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
                operation: ['add', 'create'],
            },
        },
        options: [
            {
                name: 'Text',
                value: 'text',
                description: 'Create a text post with title and/or body content',
            },
            {
                name: 'Photo',
                value: 'photo',
                description: 'Create a photo post with image uploads',
            },
            {
                name: 'Quote',
                value: 'quote',
                description: 'Create a quote post with quote text and source',
            },
            {
                name: 'Link',
                value: 'link',
                description: 'Create a link post with URL and description',
            },
            {
                name: 'Chat',
                value: 'chat',
                description: 'Create a chat post with conversation format',
            },
            {
                name: 'Video',
                value: 'video',
                description: 'Create a video post with video upload or embed',
            },
            {
                name: 'Audio',
                value: 'audio',
                description: 'Create an audio post with audio file upload',
            },
        ],
        default: 'text',
        description: 'The type of post to add to queue or create as draft',
    },

    // Content Fields (same as post creation but for queue/draft context)
    {
        displayName: 'Title',
        name: 'title',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
                operation: ['add', 'create', 'update'],
                postType: ['text'],
            },
        },
        default: '',
        placeholder: 'My Post Title',
        description: 'The title of the text post',
    },

    {
        displayName: 'Body',
        name: 'body',
        type: 'string',
        typeOptions: {
            rows: 5,
        },
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
                operation: ['add', 'create', 'update'],
                postType: ['text'],
            },
        },
        default: '',
        placeholder: 'Write your post content here...',
        description: 'The main content of the text post',
    },

    {
        displayName: 'Photo URL',
        name: 'photoUrl',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
                operation: ['add', 'create'],
                postType: ['photo'],
            },
        },
        default: '',
        placeholder: 'https://example.com/image.jpg',
        description: 'URL of the photo to upload or embed',
    },

    {
        displayName: 'Caption',
        name: 'caption',
        type: 'string',
        typeOptions: {
            rows: 3,
        },
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
                operation: ['add', 'create', 'update'],
                postType: ['photo', 'video', 'audio'],
            },
        },
        default: '',
        placeholder: 'Caption or description...',
        description: 'Caption or description for the media post',
    },

    {
        displayName: 'Quote Text',
        name: 'quote',
        type: 'string',
        required: true,
        typeOptions: {
            rows: 3,
        },
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
                operation: ['add', 'create', 'update'],
                postType: ['quote'],
            },
        },
        default: '',
        placeholder: 'The quote text goes here...',
        description: 'The main quote text',
    },

    {
        displayName: 'Source',
        name: 'source',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
                operation: ['add', 'create', 'update'],
                postType: ['quote'],
            },
        },
        default: '',
        placeholder: 'Quote source or attribution',
        description: 'The source or attribution for the quote',
    },

    {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
                operation: ['add', 'create', 'update'],
                postType: ['link'],
            },
        },
        default: '',
        placeholder: 'https://example.com',
        description: 'The URL to link to',
    },

    {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        typeOptions: {
            rows: 3,
        },
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
                operation: ['add', 'create', 'update'],
                postType: ['link'],
            },
        },
        default: '',
        placeholder: 'Link description...',
        description: 'Description of the linked content',
    },

    {
        displayName: 'Conversation',
        name: 'conversation',
        type: 'string',
        required: true,
        typeOptions: {
            rows: 5,
        },
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
                operation: ['add', 'create', 'update'],
                postType: ['chat'],
            },
        },
        default: '',
        placeholder: 'Person A: Hello!\nPerson B: Hi there!',
        description: 'The conversation content (one line per message, format: "Name: Message")',
    },

    {
        displayName: 'Video URL',
        name: 'videoUrl',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
                operation: ['add', 'create'],
                postType: ['video'],
            },
        },
        default: '',
        placeholder: 'https://example.com/video.mp4 or YouTube/Vimeo URL',
        description: 'URL of the video file or embed URL',
    },

    {
        displayName: 'Audio URL',
        name: 'audioUrl',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
                operation: ['add', 'create'],
                postType: ['audio'],
            },
        },
        default: '',
        placeholder: 'https://example.com/audio.mp3',
        description: 'URL of the audio file to upload',
    },

    // Queue-specific scheduling parameters
    {
        displayName: 'Schedule Time',
        name: 'scheduleTime',
        type: 'dateTime',
        displayOptions: {
            show: {
                resource: ['queue'],
                operation: ['add', 'update'],
            },
        },
        default: '',
        description: 'Specific date and time to publish the post (optional for queue)',
    },

    {
        displayName: 'Queue Position',
        name: 'queuePosition',
        type: 'number',
        displayOptions: {
            show: {
                resource: ['queue'],
                operation: ['add', 'reorder'],
            },
        },
        default: 0,
        description: 'Position in the queue (0 = end of queue, 1 = next to publish)',
        typeOptions: {
            minValue: 0,
        },
    },

    // Common post parameters
    {
        displayName: 'Tags',
        name: 'tags',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
                operation: ['add', 'create', 'update'],
            },
        },
        default: '',
        placeholder: 'tag1, tag2, tag3',
        description: 'Comma-separated list of tags for the post',
    },

    // Queue/Draft Options
    {
        displayName: 'Additional Options',
        name: 'additionalOptions',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
                operation: ['add', 'create', 'update'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Content Format',
                name: 'format',
                type: 'options',
                options: [
                    {
                        name: 'HTML',
                        value: 'html',
                        description: 'Content is in HTML format',
                    },
                    {
                        name: 'Markdown',
                        value: 'markdown',
                        description: 'Content is in Markdown format',
                    },
                ],
                default: 'html',
                description: 'Format of the post content',
            },
            {
                displayName: 'Slug',
                name: 'slug',
                type: 'string',
                default: '',
                placeholder: 'my-post-slug',
                description: 'Custom URL slug for the post',
            },
        ],
    },

    // Get Queue/Draft Options
    {
        displayName: 'List Options',
        name: 'listOptions',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['queue', 'draft'],
                operation: ['get', 'getAll'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 20,
                description: 'Number of items to retrieve (maximum 50)',
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
                description: 'Number of items to skip (for pagination)',
                typeOptions: {
                    minValue: 0,
                },
            },
            {
                displayName: 'Filter',
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
        ],
    },

    // Reorder Queue Parameters
    {
        displayName: 'Post IDs',
        name: 'postIds',
        type: 'string',
        typeOptions: {
            rows: 3,
        },
        displayOptions: {
            show: {
                resource: ['queue'],
                operation: ['reorder'],
            },
        },
        default: '',
        placeholder: '1234567890, 0987654321, 1122334455',
        description: 'Comma-separated list of post IDs in desired order',
    },

    // Publish Draft Parameters
    {
        displayName: 'Publish Options',
        name: 'publishOptions',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['draft'],
                operation: ['publish'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Publish State',
                name: 'state',
                type: 'options',
                options: [
                    {
                        name: 'Published',
                        value: 'published',
                        description: 'Publish immediately',
                    },
                    {
                        name: 'Queue',
                        value: 'queue',
                        description: 'Add to publishing queue',
                    },
                    {
                        name: 'Private',
                        value: 'private',
                        description: 'Publish as private post',
                    },
                ],
                default: 'published',
                description: 'How to publish the draft',
            },
            {
                displayName: 'Publish Date',
                name: 'publishOn',
                type: 'dateTime',
                default: '',
                description: 'Schedule the post to be published at a specific date and time',
            },
        ],
    },
];

/**
 * Queue operation definitions with descriptions and actions
 */
export const queueOperationOptions: INodeProperties = {
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
            name: 'Add to Queue',
            value: 'add',
            description: 'Add a new post to the publishing queue with optional scheduling',
            action: 'Add post to queue',
        },
        {
            name: 'Get Queue',
            value: 'get',
            description: 'Retrieve all posts currently in the publishing queue',
            action: 'Get queue posts',
        },
        {
            name: 'Remove from Queue',
            value: 'remove',
            description: 'Remove a specific post from the publishing queue',
            action: 'Remove post from queue',
        },
        {
            name: 'Update Queue Post',
            value: 'update',
            description: 'Update content or scheduling of a queued post',
            action: 'Update queued post',
        },
        {
            name: 'Reorder Queue',
            value: 'reorder',
            description: 'Change the order of posts in the publishing queue',
            action: 'Reorder queue posts',
        },
        {
            name: 'Get Queue Stats',
            value: 'getStats',
            description: 'Get statistics about the publishing queue',
            action: 'Get queue statistics',
        },
    ],
    default: 'add',
};

/**
 * Draft operation definitions with descriptions and actions
 */
export const draftOperationOptions: INodeProperties = {
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
            name: 'Create Draft',
            value: 'create',
            description: 'Create a new draft post without publishing',
            action: 'Create a draft',
        },
        {
            name: 'Get Drafts',
            value: 'getAll',
            description: 'Retrieve all draft posts with filtering options',
            action: 'Get all drafts',
        },
        {
            name: 'Get Draft',
            value: 'get',
            description: 'Retrieve a specific draft by ID',
            action: 'Get a draft',
        },
        {
            name: 'Update Draft',
            value: 'update',
            description: 'Update the content of an existing draft',
            action: 'Update a draft',
        },
        {
            name: 'Delete Draft',
            value: 'remove',
            description: 'Permanently delete a draft post',
            action: 'Delete a draft',
        },
        {
            name: 'Publish Draft',
            value: 'publish',
            description: 'Convert a draft to a published post or add to queue',
            action: 'Publish a draft',
        },
    ],
    default: 'create',
};

/**
 * Validation rules for queue and draft operations
 */
export const queueValidationRules = {
    /**
     * Validate post ID format
     */
    validatePostId: (postId: string): string | null => {
        if (!postId || postId.trim().length === 0) {
            return 'Post ID is required';
        }

        const trimmedId = postId.trim();

        if (!/^\d+$/.test(trimmedId)) {
            return 'Post ID must be a numeric value';
        }

        return null;
    },

    /**
     * Validate queue position
     */
    validateQueuePosition: (position: number): string | null => {
        if (position < 0) {
            return 'Queue position cannot be negative';
        }
        if (position > 1000) {
            return 'Queue position seems unreasonably high (max 1000)';
        }
        return null;
    },

    /**
     * Validate schedule time
     */
    validateScheduleTime: (scheduleTime: string): string | null => {
        if (!scheduleTime) return null; // Optional field

        const scheduledDate = new Date(scheduleTime);
        const now = new Date();

        if (isNaN(scheduledDate.getTime())) {
            return 'Invalid date format for schedule time';
        }

        if (scheduledDate < now) {
            return 'Schedule time cannot be in the past';
        }

        // Check if it's too far in the future (1 year)
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        if (scheduledDate > oneYearFromNow) {
            return 'Schedule time cannot be more than 1 year in the future';
        }

        return null;
    },

    /**
     * Validate post IDs list for reordering
     */
    validatePostIdsList: (postIds: string): string | null => {
        if (!postIds || postIds.trim().length === 0) {
            return 'Post IDs list is required for reordering';
        }

        const idList = postIds.split(',').map(id => id.trim()).filter(id => id);

        if (idList.length === 0) {
            return 'At least one post ID is required';
        }

        if (idList.length > 100) {
            return 'Maximum 100 post IDs allowed for reordering';
        }

        const invalidIds = idList.filter(id => !/^\d+$/.test(id));
        if (invalidIds.length > 0) {
            return 'All post IDs must be numeric values';
        }

        // Check for duplicates
        const uniqueIds = new Set(idList);
        if (uniqueIds.size !== idList.length) {
            return 'Duplicate post IDs are not allowed';
        }

        return null;
    },

    /**
     * Validate content based on post type
     */
    validatePostContent: (postType: string, params: any): string | null => {
        switch (postType) {
            case 'text':
                if (!params.title && !params.body) {
                    return 'Text posts require either a title or body content';
                }
                break;
            case 'photo':
                if (!params.photoUrl) {
                    return 'Photo posts require a photo URL';
                }
                break;
            case 'quote':
                if (!params.quote) {
                    return 'Quote posts require quote text';
                }
                break;
            case 'link':
                if (!params.url) {
                    return 'Link posts require a URL';
                }
                break;
            case 'chat':
                if (!params.conversation) {
                    return 'Chat posts require conversation content';
                }
                break;
            case 'video':
                if (!params.videoUrl) {
                    return 'Video posts require a video URL';
                }
                break;
            case 'audio':
                if (!params.audioUrl) {
                    return 'Audio posts require an audio URL';
                }
                break;
        }
        return null;
    },
};

/**
 * Help text and documentation for queue and draft operations
 */
export const queueHelpText = {
    queue: {
        add: {
            description: 'Adds a new post to the publishing queue. Posts in the queue will be automatically published according to your blog\'s queue settings or at the specified schedule time.',
            examples: [
                'Queue text post: Select "Text" type, add content, optionally set Schedule Time',
                'Queue with specific time: Set Schedule Time for exact publishing moment',
                'Queue at position: Set Queue Position to control publishing order',
            ],
            notes: [
                'Queued posts follow your blog\'s automatic publishing schedule',
                'Schedule Time overrides automatic queue timing',
                'Queue Position 0 adds to end, 1 makes it next to publish',
            ],
        },
        get: {
            description: 'Retrieves all posts currently in the publishing queue with their scheduling information and content.',
            examples: [
                'Get all queued posts: Use default settings',
                'Paginate queue: Set Limit and Offset in List Options',
                'Get raw content: Set Filter to "Raw" in List Options',
            ],
            notes: [
                'Shows posts in queue order (next to publish first)',
                'Includes scheduling information and queue position',
                'Maximum 50 posts per request',
            ],
        },
        remove: {
            description: 'Removes a specific post from the publishing queue. The post will be permanently deleted.',
            examples: [
                'Remove queued post: Provide the Post ID of the queued post',
            ],
            notes: [
                'Post is permanently deleted, not moved to drafts',
                'Cannot be undone once removed',
                'Post ID must be from a queued post',
            ],
        },
        update: {
            description: 'Updates the content or scheduling of a post that\'s currently in the queue.',
            examples: [
                'Update content: Provide Post ID and new content fields',
                'Reschedule post: Update Schedule Time',
                'Change tags: Update Tags field',
            ],
            notes: [
                'Only provided fields will be updated',
                'Post remains in queue after update',
                'Schedule changes affect publishing time',
            ],
        },
        reorder: {
            description: 'Changes the order of posts in the publishing queue by specifying the desired order of post IDs.',
            examples: [
                'Reorder queue: List Post IDs in desired publishing order',
            ],
            notes: [
                'Post IDs must be comma-separated',
                'All IDs must be from queued posts',
                'New order takes effect immediately',
            ],
        },
        getStats: {
            description: 'Retrieves statistics about the publishing queue including total posts, next publish time, and queue settings.',
            examples: [
                'Get queue info: No additional parameters needed',
            ],
            notes: [
                'Shows total queued posts and next publish time',
                'Includes queue interval settings',
                'Useful for monitoring queue status',
            ],
        },
    },
    draft: {
        create: {
            description: 'Creates a new draft post that can be edited and published later. Drafts are saved but not published.',
            examples: [
                'Create text draft: Select "Text" type and add content',
                'Save work in progress: Create draft to continue editing later',
            ],
            notes: [
                'Drafts are not published or visible to followers',
                'Can be edited multiple times before publishing',
                'No scheduling options for drafts',
            ],
        },
        getAll: {
            description: 'Retrieves all draft posts with filtering and pagination options.',
            examples: [
                'Get all drafts: Use default settings',
                'Paginate drafts: Set Limit and Offset in List Options',
            ],
            notes: [
                'Shows all unpublished drafts',
                'Includes creation and modification dates',
                'Maximum 50 drafts per request',
            ],
        },
        get: {
            description: 'Retrieves a specific draft post by its ID with full content and metadata.',
            examples: [
                'Get draft details: Provide the Draft Post ID',
            ],
            notes: [
                'Returns complete draft content',
                'Includes creation and modification timestamps',
                'Post ID must be from a draft post',
            ],
        },
        update: {
            description: 'Updates the content of an existing draft post. Only provided fields will be modified.',
            examples: [
                'Update draft content: Provide Post ID and new content',
                'Add tags to draft: Update Tags field',
                'Change post type: Not supported - create new draft instead',
            ],
            notes: [
                'Only provided fields are updated',
                'Draft remains unpublished after update',
                'Post type cannot be changed after creation',
            ],
        },
        remove: {
            description: 'Permanently deletes a draft post. This action cannot be undone.',
            examples: [
                'Delete draft: Provide the Draft Post ID',
            ],
            notes: [
                'Draft is permanently deleted',
                'Cannot be undone once deleted',
                'Use with caution',
            ],
        },
        publish: {
            description: 'Converts a draft post to a published post or adds it to the publishing queue.',
            examples: [
                'Publish immediately: Set Publish State to "Published"',
                'Add to queue: Set Publish State to "Queue"',
                'Schedule publish: Set Publish Date in Publish Options',
            ],
            notes: [
                'Draft is converted to published post',
                'Original draft is removed after publishing',
                'Can be scheduled or queued instead of immediate publish',
            ],
        },
    },
};