import { INodeProperties } from 'n8n-workflow';

/**
 * Post operation parameter definitions for the Tumblr node
 * Provides comprehensive UI configuration for post-related operations
 */
export const postOperations: INodeProperties[] = [
    // Blog Name parameter - required for all post operations
    {
        displayName: 'Blog Name',
        name: 'blogName',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['post'],
            },
        },
        default: '',
        placeholder: 'myblog.tumblr.com',
        description: 'The name of the blog where the post will be created/managed',
        hint: 'Enter the blog name without the protocol (http/https)',
    },

    // Post ID parameter - required for update, delete, and get operations
    {
        displayName: 'Post ID',
        name: 'postId',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['post'],
                operation: ['update', 'delete', 'get'],
            },
        },
        default: '',
        placeholder: '1234567890',
        description: 'The unique ID of the post to update, delete, or retrieve',
    },

    // Post Type parameter - required for create operation
    {
        displayName: 'Post Type',
        name: 'postType',
        type: 'options',
        required: true,
        displayOptions: {
            show: {
                resource: ['post'],
                operation: ['create'],
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
        description: 'The type of post to create',
    },

    // Text Post Fields
    {
        displayName: 'Title',
        name: 'title',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['post'],
                operation: ['create', 'update'],
                postType: ['text'],
            },
        },
        default: '',
        placeholder: 'My Blog Post Title',
        description: 'The title of the text post (optional if body is provided)',
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
                resource: ['post'],
                operation: ['create', 'update'],
                postType: ['text'],
            },
        },
        default: '',
        placeholder: 'Write your post content here...',
        description: 'The main content of the text post (HTML or Markdown supported)',
    },

    // Photo Post Fields
    {
        displayName: 'Photo URL',
        name: 'photoUrl',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['post'],
                operation: ['create'],
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
                resource: ['post'],
                operation: ['create', 'update'],
                postType: ['photo', 'video', 'audio'],
            },
        },
        default: '',
        placeholder: 'Photo caption or description...',
        description: 'Caption or description for the media post',
    },

    // Quote Post Fields
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
                resource: ['post'],
                operation: ['create', 'update'],
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
                resource: ['post'],
                operation: ['create', 'update'],
                postType: ['quote'],
            },
        },
        default: '',
        placeholder: 'Quote source or attribution',
        description: 'The source or attribution for the quote',
    },

    // Link Post Fields
    {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['post'],
                operation: ['create', 'update'],
                postType: ['link'],
            },
        },
        default: '',
        placeholder: 'https://example.com',
        description: 'The URL to link to',
    },

    {
        displayName: 'Link Title',
        name: 'linkTitle',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['post'],
                operation: ['create', 'update'],
                postType: ['link'],
            },
        },
        default: '',
        placeholder: 'Link title',
        description: 'Title for the link (optional)',
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
                resource: ['post'],
                operation: ['create', 'update'],
                postType: ['link'],
            },
        },
        default: '',
        placeholder: 'Link description...',
        description: 'Description of the linked content',
    },

    // Chat Post Fields
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
                resource: ['post'],
                operation: ['create', 'update'],
                postType: ['chat'],
            },
        },
        default: '',
        placeholder: 'Person A: Hello!\nPerson B: Hi there!',
        description: 'The conversation content (one line per message, format: "Name: Message")',
    },

    // Video Post Fields
    {
        displayName: 'Video URL',
        name: 'videoUrl',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['post'],
                operation: ['create'],
                postType: ['video'],
            },
        },
        default: '',
        placeholder: 'https://example.com/video.mp4 or YouTube/Vimeo URL',
        description: 'URL of the video file or embed URL (YouTube, Vimeo, etc.)',
    },

    // Audio Post Fields
    {
        displayName: 'Audio URL',
        name: 'audioUrl',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['post'],
                operation: ['create'],
                postType: ['audio'],
            },
        },
        default: '',
        placeholder: 'https://example.com/audio.mp3',
        description: 'URL of the audio file to upload',
    },

    {
        displayName: 'Track Name',
        name: 'trackName',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['post'],
                operation: ['create', 'update'],
                postType: ['audio'],
            },
        },
        default: '',
        placeholder: 'Song Title',
        description: 'Name of the audio track',
    },

    {
        displayName: 'Artist',
        name: 'artist',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['post'],
                operation: ['create', 'update'],
                postType: ['audio'],
            },
        },
        default: '',
        placeholder: 'Artist Name',
        description: 'Name of the artist',
    },

    {
        displayName: 'Album',
        name: 'album',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['post'],
                operation: ['create', 'update'],
                postType: ['audio'],
            },
        },
        default: '',
        placeholder: 'Album Name',
        description: 'Name of the album',
    },

    // Common Post Fields
    {
        displayName: 'Tags',
        name: 'tags',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['post'],
                operation: ['create', 'update'],
            },
        },
        default: '',
        placeholder: 'tag1, tag2, tag3',
        description: 'Comma-separated list of tags for the post',
    },

    {
        displayName: 'Post State',
        name: 'state',
        type: 'options',
        displayOptions: {
            show: {
                resource: ['post'],
                operation: ['create', 'update'],
            },
        },
        options: [
            {
                name: 'Published',
                value: 'published',
                description: 'Publish the post immediately',
            },
            {
                name: 'Draft',
                value: 'draft',
                description: 'Save as draft',
            },
            {
                name: 'Queue',
                value: 'queue',
                description: 'Add to publishing queue',
            },
            {
                name: 'Private',
                value: 'private',
                description: 'Make post private',
            },
        ],
        default: 'published',
        description: 'Publishing state of the post',
    },

    // Additional Post Options
    {
        displayName: 'Additional Options',
        name: 'additionalOptions',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['post'],
                operation: ['create', 'update'],
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
            {
                displayName: 'Publish Date',
                name: 'publishOn',
                type: 'dateTime',
                default: '',
                description: 'Schedule the post to be published at a specific date and time',
            },
        ],
    },

    // Get Post Options
    {
        displayName: 'Get Options',
        name: 'getOptions',
        type: 'collection',
        placeholder: 'Add Option',
        displayOptions: {
            show: {
                resource: ['post'],
                operation: ['get'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Include Notes Info',
                name: 'notesInfo',
                type: 'boolean',
                default: false,
                description: 'Include notes (likes/reblogs) information',
            },
            {
                displayName: 'Include Reblog Info',
                name: 'reblogInfo',
                type: 'boolean',
                default: false,
                description: 'Include reblog chain information',
            },
        ],
    },
];

/**
 * Post operation definitions with descriptions and actions
 */
export const postOperationOptions: INodeProperties = {
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
            description: 'Create a new post of any type (text, photo, quote, link, chat, video, audio)',
            action: 'Create a post',
        },
        {
            name: 'Update',
            value: 'update',
            description: 'Update an existing post with new content or settings',
            action: 'Update a post',
        },
        {
            name: 'Delete',
            value: 'delete',
            description: 'Permanently delete a post from the blog',
            action: 'Delete a post',
        },
        {
            name: 'Get',
            value: 'get',
            description: 'Retrieve a specific post by its ID with optional metadata',
            action: 'Get a post',
        },
    ],
    default: 'create',
};

/**
 * Validation rules for post operations
 */
export const postValidationRules = {
    /**
     * Validate post ID format
     */
    validatePostId: (postId: string): string | null => {
        if (!postId || postId.trim().length === 0) {
            return 'Post ID is required';
        }

        const trimmedId = postId.trim();

        // Check if it's a valid numeric ID
        if (!/^\d+$/.test(trimmedId)) {
            return 'Post ID must be a numeric value';
        }

        return null;
    },

    /**
     * Validate text post content
     */
    validateTextPost: (title: string, body: string): string | null => {
        const trimmedTitle = (title || '').trim();
        const trimmedBody = (body || '').trim();

        if (!trimmedTitle && !trimmedBody) {
            return 'Text posts require either a title or body content';
        }

        if (trimmedTitle.length > 250) {
            return 'Title is too long (maximum 250 characters)';
        }

        return null;
    },

    /**
     * Validate URL format
     */
    validateUrl: (url: string, fieldName: string = 'URL'): string | null => {
        if (!url || url.trim().length === 0) {
            return `${fieldName} is required`;
        }

        try {
            new URL(url.trim());
            return null;
        } catch {
            return `${fieldName} must be a valid URL`;
        }
    },

    /**
     * Validate quote post content
     */
    validateQuotePost: (quote: string): string | null => {
        if (!quote || quote.trim().length === 0) {
            return 'Quote text is required';
        }

        if (quote.trim().length > 2000) {
            return 'Quote text is too long (maximum 2000 characters)';
        }

        return null;
    },

    /**
     * Validate chat conversation format
     */
    validateChatPost: (conversation: string): string | null => {
        if (!conversation || conversation.trim().length === 0) {
            return 'Conversation content is required';
        }

        const lines = conversation.trim().split('\n');
        const invalidLines = lines.filter(line => {
            const trimmedLine = line.trim();
            return trimmedLine && !trimmedLine.includes(':');
        });

        if (invalidLines.length > 0) {
            return 'Each conversation line must be in format "Name: Message"';
        }

        return null;
    },

    /**
     * Validate tags format
     */
    validateTags: (tags: string): string | null => {
        if (!tags) return null;

        const tagList = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

        if (tagList.length > 30) {
            return 'Maximum 30 tags allowed';
        }

        const invalidTags = tagList.filter(tag => tag.length > 139);
        if (invalidTags.length > 0) {
            return 'Each tag must be 139 characters or less';
        }

        return null;
    },
};

/**
 * Help text and documentation for post operations
 */
export const postHelpText = {
    create: {
        description: 'Creates a new post on your Tumblr blog. Supports all post types including text, photo, quote, link, chat, video, and audio posts with type-specific fields and options.',
        examples: [
            'Text post: Select "Text" type, add title and/or body content',
            'Photo post: Select "Photo" type, provide image URL and optional caption',
            'Quote post: Select "Quote" type, add quote text and optional source',
            'Link post: Select "Link" type, provide URL and optional description',
            'Chat post: Select "Chat" type, format as "Name: Message" per line',
            'Video post: Select "Video" type, provide video URL or embed link',
            'Audio post: Select "Audio" type, provide audio URL and metadata',
        ],
        notes: [
            'Different post types have different required fields',
            'Tags should be comma-separated (max 30 tags, 139 chars each)',
            'Posts can be published immediately, saved as drafts, or queued',
            'HTML and Markdown formats are supported for content',
        ],
    },
    update: {
        description: 'Updates an existing post with new content or settings. Only provided fields will be updated, others remain unchanged.',
        examples: [
            'Update post content: Provide Post ID and new title/body/caption',
            'Change post state: Set Post State to draft, published, queue, or private',
            'Update tags: Provide new comma-separated tag list',
            'Reschedule post: Set new Publish Date in Additional Options',
        ],
        notes: [
            'Post ID is required and must be numeric',
            'Only provided fields will be updated',
            'Post type cannot be changed after creation',
            'Some fields may not be editable depending on post type',
        ],
    },
    delete: {
        description: 'Permanently deletes a post from your blog. This action cannot be undone.',
        examples: [
            'Delete post: Provide the Post ID of the post to delete',
        ],
        notes: [
            'Post deletion is permanent and cannot be undone',
            'Post ID must be valid and belong to the specified blog',
            'You must have permission to delete posts on the blog',
        ],
    },
    get: {
        description: 'Retrieves detailed information about a specific post including content, metadata, and optional notes/reblog information.',
        examples: [
            'Get basic post: Provide Post ID',
            'Get with notes: Enable "Include Notes Info" option',
            'Get with reblog chain: Enable "Include Reblog Info" option',
        ],
        notes: [
            'Post must exist and be accessible',
            'Private posts are only visible to blog owners',
            'Notes and reblog info add extra API calls',
        ],
    },
};