import { ValidationSchema } from './DataValidator';

/**
 * Validation schemas for different Tumblr operations
 * Defines validation rules for all input parameters
 */
export class ValidationSchemas {
    /**
     * Common blog name validation
     */
    private static readonly BLOG_NAME_RULE = {
        required: true,
        type: 'string' as const,
        minLength: 1,
        maxLength: 32,
        customValidator: (value: string) => {
            if (typeof value !== 'string') return 'Blog name must be a string';
            const cleaned = value.replace(/\.tumblr\.com$/, '');
            if (!/^[a-zA-Z0-9_-]+$/.test(cleaned)) {
                return 'Blog name can only contain letters, numbers, hyphens, and underscores';
            }
            return true;
        },
    };

    /**
     * Common tags validation
     */
    private static readonly TAGS_RULE = {
        type: 'array' as const,
        maxLength: 30,
        customValidator: (value: any) => {
            if (value === undefined || value === null) return true;
            if (!Array.isArray(value)) return 'Tags must be an array';
            for (const tag of value) {
                if (typeof tag !== 'string') return 'All tags must be strings';
                if (tag.length > 139) return 'Each tag must be 139 characters or less';
            }
            return true;
        },
    };

    /**
     * Common state validation
     */
    private static readonly STATE_RULE = {
        type: 'string' as const,
        allowedValues: ['published', 'draft', 'queue', 'private'],
    };

    /**
     * Common format validation
     */
    private static readonly FORMAT_RULE = {
        type: 'string' as const,
        allowedValues: ['html', 'markdown'],
    };

    /**
     * Schema for text post creation
     */
    static readonly TEXT_POST: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
        title: {
            type: 'string',
            maxLength: 250,
            sanitizer: (value: string) => value?.trim() || '',
        },
        body: {
            type: 'string',
            maxLength: 4096,
            sanitizer: (value: string) => value?.trim() || '',
        },
        tags: ValidationSchemas.TAGS_RULE,
        state: ValidationSchemas.STATE_RULE,
        format: ValidationSchemas.FORMAT_RULE,
        publishOn: {
            type: 'date',
        },
        slug: {
            type: 'string',
            maxLength: 100,
            pattern: /^[a-zA-Z0-9_-]+$/,
        },
    };

    /**
     * Schema for photo post creation
     */
    static readonly PHOTO_POST: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
        caption: {
            type: 'string',
            maxLength: 4096,
            sanitizer: (value: string) => value?.trim() || '',
        },
        photos: {
            required: true,
            type: 'array',
            minLength: 1,
            maxLength: 10,
            customValidator: (value: any) => {
                if (!Array.isArray(value)) return 'Photos must be an array';
                for (const photo of value) {
                    if (typeof photo !== 'object' || !photo) return 'Each photo must be an object';
                    if (!photo.url && !photo.data) return 'Each photo must have either url or data';
                    if (photo.url && typeof photo.url !== 'string') return 'Photo URL must be a string';
                    if (photo.caption && typeof photo.caption !== 'string') return 'Photo caption must be a string';
                    if (photo.altText && typeof photo.altText !== 'string') return 'Photo alt text must be a string';
                }
                return true;
            },
        },
        tags: ValidationSchemas.TAGS_RULE,
        state: ValidationSchemas.STATE_RULE,
        format: ValidationSchemas.FORMAT_RULE,
        publishOn: {
            type: 'date',
        },
        slug: {
            type: 'string',
            maxLength: 100,
            pattern: /^[a-zA-Z0-9_-]+$/,
        },
    };

    /**
     * Schema for quote post creation
     */
    static readonly QUOTE_POST: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
        quote: {
            required: true,
            type: 'string',
            minLength: 1,
            maxLength: 4096,
            sanitizer: (value: string) => value?.trim() || '',
        },
        source: {
            type: 'string',
            maxLength: 500,
            sanitizer: (value: string) => value?.trim() || '',
        },
        tags: ValidationSchemas.TAGS_RULE,
        state: ValidationSchemas.STATE_RULE,
        format: ValidationSchemas.FORMAT_RULE,
        publishOn: {
            type: 'date',
        },
        slug: {
            type: 'string',
            maxLength: 100,
            pattern: /^[a-zA-Z0-9_-]+$/,
        },
    };

    /**
     * Schema for link post creation
     */
    static readonly LINK_POST: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
        url: {
            required: true,
            type: 'url',
            customValidator: (value: string) => {
                if (typeof value !== 'string') return 'URL must be a string';
                try {
                    const url = new URL(value);
                    if (!['http:', 'https:'].includes(url.protocol)) {
                        return 'URL must use HTTP or HTTPS protocol';
                    }
                    return true;
                } catch {
                    return 'Invalid URL format';
                }
            },
        },
        title: {
            type: 'string',
            maxLength: 250,
            sanitizer: (value: string) => value?.trim() || '',
        },
        description: {
            type: 'string',
            maxLength: 4096,
            sanitizer: (value: string) => value?.trim() || '',
        },
        tags: ValidationSchemas.TAGS_RULE,
        state: ValidationSchemas.STATE_RULE,
        format: ValidationSchemas.FORMAT_RULE,
        publishOn: {
            type: 'date',
        },
        slug: {
            type: 'string',
            maxLength: 100,
            pattern: /^[a-zA-Z0-9_-]+$/,
        },
    };

    /**
     * Schema for chat post creation
     */
    static readonly CHAT_POST: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
        title: {
            type: 'string',
            maxLength: 250,
            sanitizer: (value: string) => value?.trim() || '',
        },
        conversation: {
            required: true,
            type: 'array',
            minLength: 1,
            customValidator: (value: any) => {
                if (!Array.isArray(value)) return 'Conversation must be an array';
                for (const item of value) {
                    if (typeof item !== 'object' || !item) return 'Each conversation item must be an object';
                    if (!item.name || typeof item.name !== 'string') return 'Each conversation item must have a name';
                    if (!item.phrase || typeof item.phrase !== 'string') return 'Each conversation item must have a phrase';
                }
                return true;
            },
        },
        tags: ValidationSchemas.TAGS_RULE,
        state: ValidationSchemas.STATE_RULE,
        format: ValidationSchemas.FORMAT_RULE,
        publishOn: {
            type: 'date',
        },
        slug: {
            type: 'string',
            maxLength: 100,
            pattern: /^[a-zA-Z0-9_-]+$/,
        },
    };

    /**
     * Schema for video post creation
     */
    static readonly VIDEO_POST: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
        caption: {
            type: 'string',
            maxLength: 4096,
            sanitizer: (value: string) => value?.trim() || '',
        },
        videoUrl: {
            type: 'url',
            customValidator: (value: string) => {
                if (!value) return true; // Optional field
                if (typeof value !== 'string') return 'Video URL must be a string';
                try {
                    const url = new URL(value);
                    if (!['http:', 'https:'].includes(url.protocol)) {
                        return 'Video URL must use HTTP or HTTPS protocol';
                    }
                    return true;
                } catch {
                    return 'Invalid video URL format';
                }
            },
        },
        videoData: {
            customValidator: (value: any) => {
                if (!value) return true; // Optional if videoUrl is provided
                if (!Buffer.isBuffer(value) && typeof value !== 'string') {
                    return 'Video data must be a Buffer or base64 string';
                }
                return true;
            },
        },
        tags: ValidationSchemas.TAGS_RULE,
        state: ValidationSchemas.STATE_RULE,
        format: ValidationSchemas.FORMAT_RULE,
        publishOn: {
            type: 'date',
        },
        slug: {
            type: 'string',
            maxLength: 100,
            pattern: /^[a-zA-Z0-9_-]+$/,
        },
    };

    /**
     * Schema for audio post creation
     */
    static readonly AUDIO_POST: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
        caption: {
            type: 'string',
            maxLength: 4096,
            sanitizer: (value: string) => value?.trim() || '',
        },
        audioUrl: {
            type: 'url',
            customValidator: (value: string) => {
                if (!value) return true; // Optional field
                if (typeof value !== 'string') return 'Audio URL must be a string';
                try {
                    const url = new URL(value);
                    if (!['http:', 'https:'].includes(url.protocol)) {
                        return 'Audio URL must use HTTP or HTTPS protocol';
                    }
                    return true;
                } catch {
                    return 'Invalid audio URL format';
                }
            },
        },
        audioData: {
            customValidator: (value: any) => {
                if (!value) return true; // Optional if audioUrl is provided
                if (!Buffer.isBuffer(value) && typeof value !== 'string') {
                    return 'Audio data must be a Buffer or base64 string';
                }
                return true;
            },
        },
        trackName: {
            type: 'string',
            maxLength: 200,
            sanitizer: (value: string) => value?.trim() || '',
        },
        artist: {
            type: 'string',
            maxLength: 200,
            sanitizer: (value: string) => value?.trim() || '',
        },
        album: {
            type: 'string',
            maxLength: 200,
            sanitizer: (value: string) => value?.trim() || '',
        },
        tags: ValidationSchemas.TAGS_RULE,
        state: ValidationSchemas.STATE_RULE,
        format: ValidationSchemas.FORMAT_RULE,
        publishOn: {
            type: 'date',
        },
        slug: {
            type: 'string',
            maxLength: 100,
            pattern: /^[a-zA-Z0-9_-]+$/,
        },
    };

    /**
     * Schema for post update operations
     */
    static readonly POST_UPDATE: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
        postId: {
            required: true,
            type: 'string',
            minLength: 1,
            pattern: /^\d+$/,
        },
        title: {
            type: 'string',
            maxLength: 250,
            sanitizer: (value: string) => value?.trim() || '',
        },
        body: {
            type: 'string',
            maxLength: 4096,
            sanitizer: (value: string) => value?.trim() || '',
        },
        caption: {
            type: 'string',
            maxLength: 4096,
            sanitizer: (value: string) => value?.trim() || '',
        },
        tags: ValidationSchemas.TAGS_RULE,
        state: ValidationSchemas.STATE_RULE,
        format: ValidationSchemas.FORMAT_RULE,
        publishOn: {
            type: 'date',
        },
        slug: {
            type: 'string',
            maxLength: 100,
            pattern: /^[a-zA-Z0-9_-]+$/,
        },
    };

    /**
     * Schema for post deletion
     */
    static readonly POST_DELETE: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
        postId: {
            required: true,
            type: 'string',
            minLength: 1,
            pattern: /^\d+$/,
        },
    };

    /**
     * Schema for post retrieval
     */
    static readonly POST_GET: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
        postId: {
            required: true,
            type: 'string',
            minLength: 1,
            pattern: /^\d+$/,
        },
        includeNotes: {
            type: 'boolean',
        },
    };

    /**
     * Schema for posts listing
     */
    static readonly POSTS_LIST: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
        type: {
            type: 'string',
            allowedValues: ['text', 'photo', 'quote', 'link', 'chat', 'video', 'audio'],
        },
        tag: {
            type: 'string',
            maxLength: 139,
        },
        limit: {
            type: 'number',
            min: 1,
            max: 50,
        },
        offset: {
            type: 'number',
            min: 0,
        },
        before: {
            type: 'number',
            min: 0,
        },
        filter: {
            type: 'string',
            allowedValues: ['text', 'raw'],
        },
        reblogInfo: {
            type: 'boolean',
        },
        notesInfo: {
            type: 'boolean',
        },
    };

    /**
     * Schema for blog information retrieval
     */
    static readonly BLOG_INFO: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
    };

    /**
     * Schema for queue operations
     */
    static readonly QUEUE_ADD: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
        postId: {
            required: true,
            type: 'string',
            minLength: 1,
            pattern: /^\d+$/,
        },
        publishOn: {
            type: 'date',
        },
    };

    /**
     * Schema for queue retrieval
     */
    static readonly QUEUE_GET: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
        limit: {
            type: 'number',
            min: 1,
            max: 50,
        },
        offset: {
            type: 'number',
            min: 0,
        },
    };

    /**
     * Schema for draft operations
     */
    static readonly DRAFT_CREATE: ValidationSchema = {
        ...ValidationSchemas.TEXT_POST,
        state: {
            type: 'string',
            allowedValues: ['draft'],
        },
    };

    /**
     * Schema for social operations (like, reblog, follow)
     */
    static readonly SOCIAL_LIKE: ValidationSchema = {
        postId: {
            required: true,
            type: 'string',
            minLength: 1,
            pattern: /^\d+$/,
        },
        reblogKey: {
            required: true,
            type: 'string',
            minLength: 1,
        },
    };

    /**
     * Schema for reblog operations
     */
    static readonly SOCIAL_REBLOG: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
        postId: {
            required: true,
            type: 'string',
            minLength: 1,
            pattern: /^\d+$/,
        },
        reblogKey: {
            required: true,
            type: 'string',
            minLength: 1,
        },
        comment: {
            type: 'string',
            maxLength: 4096,
            sanitizer: (value: string) => value?.trim() || '',
        },
        tags: ValidationSchemas.TAGS_RULE,
    };

    /**
     * Schema for follow operations
     */
    static readonly SOCIAL_FOLLOW: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
    };

    /**
     * Schema for search operations
     */
    static readonly SEARCH_TAG: ValidationSchema = {
        tag: {
            required: true,
            type: 'string',
            minLength: 1,
            maxLength: 139,
            sanitizer: (value: string) => value?.trim() || '',
        },
        before: {
            type: 'number',
            min: 0,
        },
        limit: {
            type: 'number',
            min: 1,
            max: 50,
        },
        filter: {
            type: 'string',
            allowedValues: ['text', 'raw'],
        },
    };

    /**
     * Schema for keyword search
     */
    static readonly SEARCH_KEYWORD: ValidationSchema = {
        query: {
            required: true,
            type: 'string',
            minLength: 1,
            maxLength: 500,
            sanitizer: (value: string) => value?.trim() || '',
        },
        sort: {
            type: 'string',
            allowedValues: ['top', 'recent'],
        },
        before: {
            type: 'number',
            min: 0,
        },
        limit: {
            type: 'number',
            min: 1,
            max: 50,
        },
    };

    /**
     * Schema for user content search
     */
    static readonly SEARCH_USER_CONTENT: ValidationSchema = {
        blogName: ValidationSchemas.BLOG_NAME_RULE,
        query: {
            required: true,
            type: 'string',
            minLength: 1,
            maxLength: 500,
            sanitizer: (value: string) => value?.trim() || '',
        },
        type: {
            type: 'string',
            allowedValues: ['text', 'photo', 'quote', 'link', 'chat', 'video', 'audio'],
        },
        before: {
            type: 'number',
            min: 0,
        },
        limit: {
            type: 'number',
            min: 1,
            max: 50,
        },
    };

    /**
     * Schema for file upload validation
     */
    static readonly FILE_UPLOAD: ValidationSchema = {
        fileName: {
            required: true,
            type: 'string',
            minLength: 1,
            maxLength: 255,
            customValidator: (value: string) => {
                if (typeof value !== 'string') return 'File name must be a string';
                // Check for dangerous file extensions
                const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
                const extension = value.toLowerCase().substring(value.lastIndexOf('.'));
                if (dangerousExtensions.includes(extension)) {
                    return 'File type not allowed for security reasons';
                }
                return true;
            },
        },
        fileData: {
            required: true,
            customValidator: (value: any) => {
                if (!Buffer.isBuffer(value) && typeof value !== 'string') {
                    return 'File data must be a Buffer or base64 string';
                }
                // Check file size (10MB limit)
                const maxSize = 10 * 1024 * 1024;
                const size = Buffer.isBuffer(value) ? value.length : Buffer.from(value, 'base64').length;
                if (size > maxSize) {
                    return `File size (${Math.round(size / 1024 / 1024)}MB) exceeds maximum allowed size (10MB)`;
                }
                return true;
            },
        },
        mimeType: {
            type: 'string',
            customValidator: (value: string) => {
                if (!value) return true; // Optional field
                const allowedTypes = [
                    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                    'video/mp4', 'video/webm', 'video/ogg',
                    'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'
                ];
                if (!allowedTypes.includes(value)) {
                    return `MIME type '${value}' is not allowed`;
                }
                return true;
            },
        },
    };

    /**
     * Get validation schema by operation type
     */
    static getSchema(resource: string, operation: string): ValidationSchema | null {
        const schemaKey = `${resource.toUpperCase()}_${operation.toUpperCase()}`;

        const schemaMap: { [key: string]: ValidationSchema } = {
            // Post operations
            'POST_CREATE_TEXT': ValidationSchemas.TEXT_POST,
            'POST_CREATE_PHOTO': ValidationSchemas.PHOTO_POST,
            'POST_CREATE_QUOTE': ValidationSchemas.QUOTE_POST,
            'POST_CREATE_LINK': ValidationSchemas.LINK_POST,
            'POST_CREATE_CHAT': ValidationSchemas.CHAT_POST,
            'POST_CREATE_VIDEO': ValidationSchemas.VIDEO_POST,
            'POST_CREATE_AUDIO': ValidationSchemas.AUDIO_POST,
            'POST_UPDATE': ValidationSchemas.POST_UPDATE,
            'POST_DELETE': ValidationSchemas.POST_DELETE,
            'POST_GET': ValidationSchemas.POST_GET,
            'POST_LIST': ValidationSchemas.POSTS_LIST,

            // Blog operations
            'BLOG_INFO': ValidationSchemas.BLOG_INFO,
            'BLOG_GET': ValidationSchemas.BLOG_INFO,

            // Queue operations
            'QUEUE_ADD': ValidationSchemas.QUEUE_ADD,
            'QUEUE_GET': ValidationSchemas.QUEUE_GET,
            'QUEUE_LIST': ValidationSchemas.QUEUE_GET,

            // Draft operations
            'DRAFT_CREATE': ValidationSchemas.DRAFT_CREATE,
            'DRAFT_UPDATE': ValidationSchemas.POST_UPDATE,
            'DRAFT_DELETE': ValidationSchemas.POST_DELETE,
            'DRAFT_GET': ValidationSchemas.POST_GET,
            'DRAFT_LIST': ValidationSchemas.POSTS_LIST,
            'DRAFT_PUBLISH': ValidationSchemas.POST_GET,

            // Social operations
            'SOCIAL_LIKE': ValidationSchemas.SOCIAL_LIKE,
            'SOCIAL_UNLIKE': ValidationSchemas.SOCIAL_LIKE,
            'SOCIAL_REBLOG': ValidationSchemas.SOCIAL_REBLOG,
            'SOCIAL_FOLLOW': ValidationSchemas.SOCIAL_FOLLOW,
            'SOCIAL_UNFOLLOW': ValidationSchemas.SOCIAL_FOLLOW,

            // Search operations
            'SEARCH_TAG': ValidationSchemas.SEARCH_TAG,
            'SEARCH_KEYWORD': ValidationSchemas.SEARCH_KEYWORD,
            'SEARCH_USER_CONTENT': ValidationSchemas.SEARCH_USER_CONTENT,

            // File operations
            'FILE_UPLOAD': ValidationSchemas.FILE_UPLOAD,
        };

        return schemaMap[schemaKey] || null;
    }

    /**
     * Get all available schemas for documentation/testing
     */
    static getAllSchemas(): { [key: string]: ValidationSchema } {
        return {
            TEXT_POST: ValidationSchemas.TEXT_POST,
            PHOTO_POST: ValidationSchemas.PHOTO_POST,
            QUOTE_POST: ValidationSchemas.QUOTE_POST,
            LINK_POST: ValidationSchemas.LINK_POST,
            CHAT_POST: ValidationSchemas.CHAT_POST,
            VIDEO_POST: ValidationSchemas.VIDEO_POST,
            AUDIO_POST: ValidationSchemas.AUDIO_POST,
            POST_UPDATE: ValidationSchemas.POST_UPDATE,
            POST_DELETE: ValidationSchemas.POST_DELETE,
            POST_GET: ValidationSchemas.POST_GET,
            POSTS_LIST: ValidationSchemas.POSTS_LIST,
            BLOG_INFO: ValidationSchemas.BLOG_INFO,
            QUEUE_ADD: ValidationSchemas.QUEUE_ADD,
            QUEUE_GET: ValidationSchemas.QUEUE_GET,
            DRAFT_CREATE: ValidationSchemas.DRAFT_CREATE,
            SOCIAL_LIKE: ValidationSchemas.SOCIAL_LIKE,
            SOCIAL_REBLOG: ValidationSchemas.SOCIAL_REBLOG,
            SOCIAL_FOLLOW: ValidationSchemas.SOCIAL_FOLLOW,
            SEARCH_TAG: ValidationSchemas.SEARCH_TAG,
            SEARCH_KEYWORD: ValidationSchemas.SEARCH_KEYWORD,
            SEARCH_USER_CONTENT: ValidationSchemas.SEARCH_USER_CONTENT,
            FILE_UPLOAD: ValidationSchemas.FILE_UPLOAD,
        };
    }
}