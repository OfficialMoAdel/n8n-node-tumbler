import { IDataObject, NodeOperationError } from 'n8n-workflow';

/**
 * Enumeration of validation error types
 */
export enum ValidationErrorType {
    REQUIRED_FIELD = 'required_field',
    INVALID_TYPE = 'invalid_type',
    INVALID_FORMAT = 'invalid_format',
    INVALID_LENGTH = 'invalid_length',
    INVALID_VALUE = 'invalid_value',
    INVALID_URL = 'invalid_url',
    INVALID_EMAIL = 'invalid_email',
    INVALID_DATE = 'invalid_date',
    SECURITY_VIOLATION = 'security_violation',
}

/**
 * Interface for validation error details
 */
export interface ValidationError {
    field: string;
    type: ValidationErrorType;
    message: string;
    value?: unknown;
    expectedType?: string;
    constraints?: IDataObject;
}

/**
 * Interface for validation rules
 */
export interface ValidationRule {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'url' | 'email' | 'date';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    allowedValues?: unknown[];
    customValidator?: (value: unknown) => boolean | string;
    sanitizer?: (value: unknown) => unknown;
}

/**
 * Interface for validation schema
 */
export interface ValidationSchema {
    [fieldName: string]: ValidationRule;
}

/**
 * Comprehensive data validator for Tumblr operations
 * Provides input validation, sanitization, and security measures
 */
export class DataValidator {
    private static readonly URL_PATTERN = /^https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?$/;
    private static readonly EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    private static readonly SCRIPT_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    private static readonly DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];

    /**
     * Validates data against a schema and returns validation errors
     */
    public static validate(data: IDataObject, schema: ValidationSchema): ValidationError[] {
        const errors: ValidationError[] = [];

        // Check for required fields
        for (const [fieldName, rule] of Object.entries(schema)) {
            if (rule.required && (data[fieldName] === undefined || data[fieldName] === null || data[fieldName] === '')) {
                errors.push({
                    field: fieldName,
                    type: ValidationErrorType.REQUIRED_FIELD,
                    message: `Field '${fieldName}' is required`,
                    value: data[fieldName],
                });
                continue;
            }

            // Skip validation if field is not present and not required
            if (data[fieldName] === undefined || data[fieldName] === null) {
                continue;
            }

            const fieldErrors = this.validateField(fieldName, data[fieldName], rule);
            errors.push(...fieldErrors);
        }

        return errors;
    }

    /**
     * Validates and sanitizes data, throwing an error if validation fails
     */
    public static validateAndSanitize(data: IDataObject, schema: ValidationSchema): IDataObject {
        const errors = this.validate(data, schema);

        if (errors.length > 0) {
            const errorMessage = this.formatValidationErrors(errors);
            throw new NodeOperationError(
                { message: 'Validation failed' } as any,
                errorMessage
            );
        }

        // Sanitize the data
        const sanitizedData: IDataObject = {};
        for (const [fieldName, value] of Object.entries(data)) {
            const rule = schema[fieldName];
            if (rule && rule.sanitizer) {
                sanitizedData[fieldName] = rule.sanitizer(value) as any;
            } else {
                sanitizedData[fieldName] = this.sanitizeValue(value) as any;
            }
        }

        return sanitizedData;
    }

    /**
     * Validates a single field against its rule
     */
    private static validateField(fieldName: string, value: unknown, rule: ValidationRule): ValidationError[] {
        const errors: ValidationError[] = [];

        // Type validation
        if (rule.type) {
            const typeError = this.validateType(fieldName, value, rule.type);
            if (typeError) {
                errors.push(typeError);
                return errors; // Stop further validation if type is wrong
            }
        }

        // Length validation for strings and arrays
        if (rule.minLength !== undefined || rule.maxLength !== undefined) {
            const lengthError = this.validateLength(fieldName, value, rule.minLength, rule.maxLength);
            if (lengthError) errors.push(lengthError);
        }

        // Numeric range validation
        if (rule.min !== undefined || rule.max !== undefined) {
            const rangeError = this.validateRange(fieldName, value, rule.min, rule.max);
            if (rangeError) errors.push(rangeError);
        }

        // Pattern validation
        if (rule.pattern) {
            const patternError = this.validatePattern(fieldName, value, rule.pattern);
            if (patternError) errors.push(patternError);
        }

        // Allowed values validation
        if (rule.allowedValues) {
            const allowedError = this.validateAllowedValues(fieldName, value, rule.allowedValues);
            if (allowedError) errors.push(allowedError);
        }

        // Custom validation
        if (rule.customValidator) {
            const customError = this.validateCustom(fieldName, value, rule.customValidator);
            if (customError) errors.push(customError);
        }

        return errors;
    }

    /**
     * Validates the type of a value
     */
    private static validateType(fieldName: string, value: unknown, expectedType: string): ValidationError | null {
        let isValid = false;
        let actualType: string = typeof value;

        switch (expectedType) {
            case 'string':
                isValid = typeof value === 'string';
                break;
            case 'number':
                isValid = typeof value === 'number' && !isNaN(value);
                break;
            case 'boolean':
                isValid = typeof value === 'boolean';
                break;
            case 'array':
                isValid = Array.isArray(value);
                actualType = Array.isArray(value) ? 'array' : actualType;
                break;
            case 'object':
                isValid = typeof value === 'object' && value !== null && !Array.isArray(value);
                break;
            case 'url':
                isValid = typeof value === 'string' && this.URL_PATTERN.test(value);
                actualType = 'url';
                break;
            case 'email':
                isValid = typeof value === 'string' && this.EMAIL_PATTERN.test(value);
                actualType = 'email';
                break;
            case 'date':
                isValid = this.isValidDate(value);
                actualType = 'date';
                break;
        }

        if (!isValid) {
            return {
                field: fieldName,
                type: ValidationErrorType.INVALID_TYPE,
                message: `Field '${fieldName}' must be of type '${expectedType}', got '${actualType}'`,
                value,
                expectedType,
            };
        }

        return null;
    }

    /**
     * Validates the length of a string or array
     */
    private static validateLength(fieldName: string, value: any, minLength?: number, maxLength?: number): ValidationError | null {
        const length = typeof value === 'string' ? value.length : Array.isArray(value) ? value.length : 0;

        if (minLength !== undefined && length < minLength) {
            return {
                field: fieldName,
                type: ValidationErrorType.INVALID_LENGTH,
                message: `Field '${fieldName}' must be at least ${minLength} characters/items long`,
                value,
                constraints: { minLength },
            };
        }

        if (maxLength !== undefined && length > maxLength) {
            return {
                field: fieldName,
                type: ValidationErrorType.INVALID_LENGTH,
                message: `Field '${fieldName}' must be at most ${maxLength} characters/items long`,
                value,
                constraints: { maxLength },
            };
        }

        return null;
    }

    /**
     * Validates numeric range
     */
    private static validateRange(fieldName: string, value: any, min?: number, max?: number): ValidationError | null {
        if (typeof value !== 'number') return null;

        if (min !== undefined && value < min) {
            return {
                field: fieldName,
                type: ValidationErrorType.INVALID_VALUE,
                message: `Field '${fieldName}' must be at least ${min}`,
                value,
                constraints: { min },
            };
        }

        if (max !== undefined && value > max) {
            return {
                field: fieldName,
                type: ValidationErrorType.INVALID_VALUE,
                message: `Field '${fieldName}' must be at most ${max}`,
                value,
                constraints: { max },
            };
        }

        return null;
    }

    /**
     * Validates against a regular expression pattern
     */
    private static validatePattern(fieldName: string, value: any, pattern: RegExp): ValidationError | null {
        if (typeof value !== 'string') return null;

        if (!pattern.test(value)) {
            return {
                field: fieldName,
                type: ValidationErrorType.INVALID_FORMAT,
                message: `Field '${fieldName}' does not match the required format`,
                value,
                constraints: { pattern: pattern.source },
            };
        }

        return null;
    }

    /**
     * Validates against allowed values
     */
    private static validateAllowedValues(fieldName: string, value: any, allowedValues: any[]): ValidationError | null {
        if (!allowedValues.includes(value)) {
            return {
                field: fieldName,
                type: ValidationErrorType.INVALID_VALUE,
                message: `Field '${fieldName}' must be one of: ${allowedValues.join(', ')}`,
                value,
                constraints: { allowedValues },
            };
        }

        return null;
    }

    /**
     * Validates using a custom validator function
     */
    private static validateCustom(fieldName: string, value: any, validator: (value: any) => boolean | string): ValidationError | null {
        const result = validator(value);

        if (result === false) {
            return {
                field: fieldName,
                type: ValidationErrorType.INVALID_VALUE,
                message: `Field '${fieldName}' failed custom validation`,
                value,
            };
        }

        if (typeof result === 'string') {
            return {
                field: fieldName,
                type: ValidationErrorType.INVALID_VALUE,
                message: result,
                value,
            };
        }

        return null;
    }

    /**
     * Checks if a value is a valid date
     */
    private static isValidDate(value: any): boolean {
        if (value instanceof Date) {
            return !isNaN(value.getTime());
        }

        if (typeof value === 'string') {
            const date = new Date(value);
            return !isNaN(date.getTime());
        }

        return false;
    }

    /**
     * Sanitizes a value to prevent security issues
     */
    private static sanitizeValue(value: any): any {
        if (typeof value === 'string') {
            return this.sanitizeString(value);
        }

        if (Array.isArray(value)) {
            return value.map(item => this.sanitizeValue(item));
        }

        if (typeof value === 'object' && value !== null) {
            const sanitized: IDataObject = {};
            for (const [key, val] of Object.entries(value)) {
                sanitized[key] = this.sanitizeValue(val) as any;
            }
            return sanitized;
        }

        return value;
    }

    /**
     * Sanitizes a string value
     */
    private static sanitizeString(value: string): string {
        // Remove dangerous script tags
        let sanitized = value.replace(this.SCRIPT_PATTERN, '');

        // Check for dangerous protocols in URLs
        for (const protocol of this.DANGEROUS_PROTOCOLS) {
            if (sanitized.toLowerCase().includes(protocol)) {
                sanitized = sanitized.replace(new RegExp(protocol, 'gi'), '');
            }
        }

        // Trim whitespace
        sanitized = sanitized.trim();

        return sanitized;
    }

    /**
     * Formats validation errors into a readable message
     */
    private static formatValidationErrors(errors: ValidationError[]): string {
        if (errors.length === 1) {
            return errors[0].message;
        }

        const errorMessages = errors.map(error => `• ${error.message}`);
        return `Validation failed with ${errors.length} errors:\n${errorMessages.join('\n')}`;
    }

    /**
     * Validates blog name format
     */
    public static validateBlogName(blogName: string): string {
        if (!blogName || typeof blogName !== 'string') {
            throw new NodeOperationError(
                { message: 'Invalid blog name' } as any,
                'Blog name is required and must be a string'
            );
        }

        // Remove .tumblr.com suffix if present and sanitize
        const cleaned = blogName.replace(/\.tumblr\.com$/, '').trim();

        if (cleaned.length === 0) {
            throw new NodeOperationError(
                { message: 'Invalid blog name' } as any,
                'Blog name cannot be empty'
            );
        }

        // Validate blog name format (alphanumeric, hyphens, underscores)
        if (!/^[a-zA-Z0-9_-]+$/.test(cleaned)) {
            throw new NodeOperationError(
                { message: 'Invalid blog name format' } as any,
                'Blog name can only contain letters, numbers, hyphens, and underscores'
            );
        }

        return cleaned;
    }

    /**
     * Validates and formats tags
     */
    public static validateAndFormatTags(tags: any): string[] {
        if (!tags) return [];

        let tagArray: string[] = [];

        if (typeof tags === 'string') {
            // Split by comma and clean up
            tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else if (Array.isArray(tags)) {
            tagArray = tags.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
        } else {
            throw new NodeOperationError(
                { message: 'Invalid tags format' } as any,
                'Tags must be a string (comma-separated) or an array of strings'
            );
        }

        // Validate individual tags
        const validTags: string[] = [];
        for (const tag of tagArray) {
            if (tag.length > 139) { // Tumblr tag limit
                throw new NodeOperationError(
                    { message: 'Tag too long' } as any,
                    `Tag "${tag}" exceeds 139 character limit`
                );
            }

            // Sanitize tag
            const sanitizedTag = this.sanitizeString(tag);
            if (sanitizedTag.length > 0) {
                validTags.push(sanitizedTag);
            }
        }

        // Limit number of tags (Tumblr allows up to 30 tags)
        if (validTags.length > 30) {
            throw new NodeOperationError(
                { message: 'Too many tags' } as any,
                'Maximum of 30 tags allowed per post'
            );
        }

        return validTags;
    }

    /**
     * Validates URL format and security
     */
    public static validateUrl(url: string, fieldName: string = 'URL'): string {
        if (!url || typeof url !== 'string') {
            throw new NodeOperationError(
                { message: 'Invalid URL' } as any,
                `${fieldName} is required and must be a string`
            );
        }

        const trimmedUrl = url.trim();

        // Check for dangerous protocols
        for (const protocol of this.DANGEROUS_PROTOCOLS) {
            if (trimmedUrl.toLowerCase().startsWith(protocol)) {
                throw new NodeOperationError(
                    { message: 'Security violation' } as any,
                    `${fieldName} contains dangerous protocol: ${protocol}`
                );
            }
        }

        // Validate URL format
        try {
            const urlObj = new URL(trimmedUrl);

            // Only allow HTTP and HTTPS
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                throw new NodeOperationError(
                    { message: 'Invalid URL protocol' } as any,
                    `${fieldName} must use HTTP or HTTPS protocol`
                );
            }

            return trimmedUrl;
        } catch (error) {
            throw new NodeOperationError(
                { message: 'Invalid URL format' } as any,
                `${fieldName} is not a valid URL format`
            );
        }
    }

    /**
     * Validates post content length limits
     */
    public static validateContentLength(content: string, maxLength: number, fieldName: string): void {
        if (content && content.length > maxLength) {
            throw new NodeOperationError(
                { message: 'Content too long' } as any,
                `${fieldName} cannot exceed ${maxLength} characters (current: ${content.length})`
            );
        }
    }

    /**
     * Validates and sanitizes HTML content
     */
    public static validateAndSanitizeHtml(html: string): string {
        if (!html || typeof html !== 'string') {
            return '';
        }

        // Remove script tags and dangerous content
        let sanitized = html.replace(this.SCRIPT_PATTERN, '');

        // Remove dangerous event handlers
        sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

        // Remove dangerous protocols from href and src attributes
        for (const protocol of this.DANGEROUS_PROTOCOLS) {
            const protocolPattern = new RegExp(`(href|src)\\s*=\\s*["']\\s*${protocol}[^"']*["']`, 'gi');
            sanitized = sanitized.replace(protocolPattern, '');
        }

        return sanitized.trim();
    }

    /**
     * Validates conversation format for chat posts
     */
    public static validateConversation(conversation: any): Array<{ name: string; label: string; phrase: string }> {
        if (!conversation) {
            throw new NodeOperationError(
                { message: 'Missing conversation' } as any,
                'Conversation content is required for chat posts'
            );
        }

        if (typeof conversation === 'string') {
            // Parse string format conversation
            const lines = conversation.split('\n').filter(line => line.trim().length > 0);
            return lines.map((line, index) => {
                const colonIndex = line.indexOf(':');
                if (colonIndex === -1) {
                    return {
                        name: `Speaker ${index + 1}`,
                        label: `Speaker ${index + 1}`,
                        phrase: line.trim(),
                    };
                }

                const name = line.substring(0, colonIndex).trim();
                const phrase = line.substring(colonIndex + 1).trim();

                return {
                    name: name || `Speaker ${index + 1}`,
                    label: name || `Speaker ${index + 1}`,
                    phrase,
                };
            });
        }

        if (Array.isArray(conversation)) {
            return conversation.map((item, index) => {
                if (typeof item === 'string') {
                    return {
                        name: `Speaker ${index + 1}`,
                        label: `Speaker ${index + 1}`,
                        phrase: item.trim(),
                    };
                }

                if (typeof item === 'object' && item !== null) {
                    return {
                        name: String(item.name || `Speaker ${index + 1}`).trim(),
                        label: String(item.label || item.name || `Speaker ${index + 1}`).trim(),
                        phrase: String(item.phrase || '').trim(),
                    };
                }

                throw new NodeOperationError(
                    { message: 'Invalid conversation format' } as any,
                    'Conversation items must be strings or objects with name and phrase properties'
                );
            });
        }

        throw new NodeOperationError(
            { message: 'Invalid conversation format' } as any,
            'Conversation must be a string or array of conversation items'
        );
    }

    /**
     * Validates file upload data
     */
    public static validateFileData(data: any, allowedTypes: string[] = []): void {
        if (!data) {
            throw new NodeOperationError(
                { message: 'Missing file data' } as any,
                'File data is required for upload operations'
            );
        }

        // Check if it's a Buffer or base64 string
        if (!Buffer.isBuffer(data) && typeof data !== 'string') {
            throw new NodeOperationError(
                { message: 'Invalid file data format' } as any,
                'File data must be a Buffer or base64 string'
            );
        }

        // Validate file size (10MB limit for most Tumblr uploads)
        const maxSize = 10 * 1024 * 1024; // 10MB
        const size = Buffer.isBuffer(data) ? data.length : Buffer.from(data, 'base64').length;

        if (size > maxSize) {
            throw new NodeOperationError(
                { message: 'File too large' } as any,
                `File size (${Math.round(size / 1024 / 1024)}MB) exceeds maximum allowed size (10MB)`
            );
        }

        // Validate MIME type if allowedTypes is provided
        if (allowedTypes.length > 0) {
            // This is a basic implementation - in a real scenario, you'd use a proper MIME type detection library
            const mimeType = this.detectMimeType(data);
            if (mimeType && !allowedTypes.includes(mimeType)) {
                throw new NodeOperationError(
                    { message: 'Invalid file type' } as any,
                    `File type '${mimeType}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`
                );
            }
        }
    }

    /**
     * Basic MIME type detection from file headers
     */
    private static detectMimeType(data: unknown): string | null {
        let buffer: Buffer;

        if (Buffer.isBuffer(data)) {
            buffer = data;
        } else if (typeof data === 'string') {
            try {
                buffer = Buffer.from(data, 'base64');
            } catch {
                return null;
            }
        } else {
            return null;
        }

        // Check file signatures (magic numbers)
        if (buffer.length < 4) return null;

        const header = buffer.subarray(0, 12);

        // JPEG
        if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
            return 'image/jpeg';
        }

        // PNG
        if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
            return 'image/png';
        }

        // GIF
        if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) {
            return 'image/gif';
        }

        // WebP
        if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
            header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) {
            return 'image/webp';
        }

        // MP4
        if (header.subarray(4, 8).toString() === 'ftyp') {
            return 'video/mp4';
        }

        return null;
    }

    /**
     * Validates post ID format
     */
    public static validatePostId(postId: string): string {
        if (!postId || typeof postId !== 'string') {
            throw new NodeOperationError(
                { message: 'Invalid post ID' } as any,
                'Post ID is required and must be a string'
            );
        }

        const trimmedId = postId.trim();

        if (!/^\d+$/.test(trimmedId)) {
            throw new NodeOperationError(
                { message: 'Invalid post ID format' } as any,
                'Post ID must be a numeric string'
            );
        }

        return trimmedId;
    }

    /**
     * Validates and sanitizes search query
     */
    public static validateSearchQuery(query: string): string {
        if (!query || typeof query !== 'string') {
            throw new NodeOperationError(
                { message: 'Invalid search query' } as any,
                'Search query is required and must be a string'
            );
        }

        const trimmed = query.trim();

        if (trimmed.length === 0) {
            throw new NodeOperationError(
                { message: 'Empty search query' } as any,
                'Search query cannot be empty'
            );
        }

        if (trimmed.length > 500) {
            throw new NodeOperationError(
                { message: 'Search query too long' } as any,
                'Search query cannot exceed 500 characters'
            );
        }

        // Remove potentially dangerous characters
        const sanitized = trimmed.replace(/[<>'"&]/g, '');

        return sanitized;
    }

    /**
     * Validates pagination parameters
     */
    public static validatePagination(limit?: number, offset?: number): { limit: number; offset: number } {
        const validatedLimit = limit !== undefined ? limit : 20;
        const validatedOffset = offset !== undefined ? offset : 0;

        if (typeof validatedLimit !== 'number' || validatedLimit < 1 || validatedLimit > 50) {
            throw new NodeOperationError(
                { message: 'Invalid limit parameter' } as any,
                'Limit must be a number between 1 and 50'
            );
        }

        if (typeof validatedOffset !== 'number' || validatedOffset < 0) {
            throw new NodeOperationError(
                { message: 'Invalid offset parameter' } as any,
                'Offset must be a non-negative number'
            );
        }

        return { limit: validatedLimit, offset: validatedOffset };
    }

    /**
     * Validates date/time parameters
     */
    public static validateDateTime(dateTime: any, fieldName: string = 'Date'): Date | null {
        if (!dateTime) return null;

        let date: Date;

        if (dateTime instanceof Date) {
            date = dateTime;
        } else if (typeof dateTime === 'string') {
            date = new Date(dateTime);
        } else if (typeof dateTime === 'number') {
            date = new Date(dateTime * 1000); // Assume Unix timestamp
        } else {
            throw new NodeOperationError(
                { message: 'Invalid date format' } as any,
                `${fieldName} must be a Date object, ISO string, or Unix timestamp`
            );
        }

        if (isNaN(date.getTime())) {
            throw new NodeOperationError(
                { message: 'Invalid date value' } as any,
                `${fieldName} is not a valid date`
            );
        }

        // Check if date is in the past (for scheduling)
        const now = new Date();
        if (date < now) {
            throw new NodeOperationError(
                { message: 'Date in the past' } as any,
                `${fieldName} cannot be in the past`
            );
        }

        // Check if date is too far in the future (1 year limit)
        const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        if (date > oneYearFromNow) {
            throw new NodeOperationError(
                { message: 'Date too far in future' } as any,
                `${fieldName} cannot be more than 1 year in the future`
            );
        }

        return date;
    }

    /**
     * Validates reblog key format
     */
    public static validateReblogKey(reblogKey: string): string {
        if (!reblogKey || typeof reblogKey !== 'string') {
            throw new NodeOperationError(
                { message: 'Invalid reblog key' } as any,
                'Reblog key is required and must be a string'
            );
        }

        const trimmed = reblogKey.trim();

        if (trimmed.length === 0) {
            throw new NodeOperationError(
                { message: 'Empty reblog key' } as any,
                'Reblog key cannot be empty'
            );
        }

        // Reblog keys are typically alphanumeric with some special characters
        if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
            throw new NodeOperationError(
                { message: 'Invalid reblog key format' } as any,
                'Reblog key contains invalid characters'
            );
        }

        return trimmed;
    }

    /**
     * Validates and sanitizes comment content
     */
    public static validateComment(comment: string): string {
        if (!comment || typeof comment !== 'string') {
            return '';
        }

        const trimmed = comment.trim();

        if (trimmed.length > 4096) {
            throw new NodeOperationError(
                { message: 'Comment too long' } as any,
                'Comment cannot exceed 4096 characters'
            );
        }

        // Sanitize HTML content
        return this.validateAndSanitizeHtml(trimmed);
    }

    /**
     * Validates operation parameters against schema
     */
    public static validateOperationParams(
        resource: string,
        operation: string,
        params: IDataObject
    ): IDataObject {
        // Import ValidationSchemas here to avoid circular dependency
        const { ValidationSchemas } = require('./ValidationSchemas');

        const schema = ValidationSchemas.getSchema(resource, operation);

        if (!schema) {
            // If no specific schema found, perform basic validation
            return this.performBasicValidation(params);
        }

        return this.validateAndSanitize(params, schema);
    }

    /**
     * Performs basic validation when no specific schema is available
     */
    private static performBasicValidation(params: IDataObject): IDataObject {
        const sanitized: IDataObject = {};

        for (const [key, value] of Object.entries(params)) {
            // Skip undefined/null values
            if (value === undefined || value === null) {
                continue;
            }

            // Basic sanitization
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value);
            } else if (Array.isArray(value)) {
                sanitized[key] = value.map(item =>
                    typeof item === 'string' ? this.sanitizeString(item) : item
                );
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * Validates batch operation parameters
     */
    public static validateBatchParams(items: any[], maxBatchSize: number = 50): any[] {
        if (!Array.isArray(items)) {
            throw new NodeOperationError(
                { message: 'Invalid batch data' } as any,
                'Batch items must be an array'
            );
        }

        if (items.length === 0) {
            throw new NodeOperationError(
                { message: 'Empty batch' } as any,
                'Batch cannot be empty'
            );
        }

        if (items.length > maxBatchSize) {
            throw new NodeOperationError(
                { message: 'Batch too large' } as any,
                `Batch size (${items.length}) exceeds maximum allowed size (${maxBatchSize})`
            );
        }

        return items;
    }

    /**
     * Validates API rate limiting parameters
     */
    public static validateRateLimitParams(requestsPerHour?: number): number {
        const defaultLimit = 1000; // Tumblr's default limit
        const maxLimit = 5000; // Conservative maximum

        if (requestsPerHour === undefined) {
            return defaultLimit;
        }

        if (typeof requestsPerHour !== 'number' || requestsPerHour < 1) {
            throw new NodeOperationError(
                { message: 'Invalid rate limit' } as any,
                'Requests per hour must be a positive number'
            );
        }

        if (requestsPerHour > maxLimit) {
            throw new NodeOperationError(
                { message: 'Rate limit too high' } as any,
                `Requests per hour (${requestsPerHour}) exceeds maximum allowed (${maxLimit})`
            );
        }

        return requestsPerHour;
    }

    /**
     * Validates webhook URL for security
     */
    public static validateWebhookUrl(url: string): string {
        if (!url || typeof url !== 'string') {
            throw new NodeOperationError(
                { message: 'Invalid webhook URL' } as any,
                'Webhook URL is required and must be a string'
            );
        }

        const validatedUrl = this.validateUrl(url, 'Webhook URL');

        try {
            const urlObj = new URL(validatedUrl);

            // Prevent localhost and private IP ranges for security
            const hostname = urlObj.hostname.toLowerCase();

            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
                throw new NodeOperationError(
                    { message: 'Security violation' } as any,
                    'Webhook URL cannot point to localhost'
                );
            }

            // Check for private IP ranges
            if (this.isPrivateIP(hostname)) {
                throw new NodeOperationError(
                    { message: 'Security violation' } as any,
                    'Webhook URL cannot point to private IP addresses'
                );
            }

            return validatedUrl;
        } catch (error) {
            if (error instanceof NodeOperationError) {
                throw error;
            }
            throw new NodeOperationError(
                { message: 'Invalid webhook URL' } as any,
                'Webhook URL is not valid'
            );
        }
    }

    /**
     * Checks if an IP address is in a private range
     */
    private static isPrivateIP(hostname: string): boolean {
        // This is a simplified check - in production, you'd use a proper IP validation library
        const privateRanges = [
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^192\.168\./,
            /^169\.254\./, // Link-local
            /^fc00:/, // IPv6 private
            /^fe80:/, // IPv6 link-local
        ];

        return privateRanges.some(range => range.test(hostname));
    }

    /**
     * Validates content encoding
     */
    public static validateContentEncoding(content: string, encoding: string = 'utf8'): boolean {
        if (!content || typeof content !== 'string') {
            return true; // Empty content is valid
        }

        try {
            // Try to encode and decode to validate
            const buffer = Buffer.from(content, encoding as any);
            const decoded = buffer.toString(encoding as any);
            return decoded === content;
        } catch {
            return false;
        }
    }

    /**
     * Validates and normalizes user input for security
     */
    public static securityValidation(input: any): any {
        if (typeof input === 'string') {
            // Remove null bytes and control characters
            let sanitized = input.replace(/\u0000/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

            // Normalize Unicode
            sanitized = sanitized.normalize('NFC');

            // Check for suspicious patterns
            const suspiciousPatterns = [
                /<script/i,
                /javascript:/i,
                /vbscript:/i,
                /data:text\/html/i,
                /on\w+\s*=/i, // Event handlers
            ];

            for (const pattern of suspiciousPatterns) {
                if (pattern.test(sanitized)) {
                    throw new NodeOperationError(
                        { message: 'Security violation' } as any,
                        'Input contains potentially dangerous content'
                    );
                }
            }

            return sanitized;
        }

        if (Array.isArray(input)) {
            return input.map(item => this.securityValidation(item));
        }

        if (typeof input === 'object' && input !== null) {
            const sanitized: IDataObject = {};
            for (const [key, value] of Object.entries(input)) {
                sanitized[key] = this.securityValidation(value) as any;
            }
            return sanitized;
        }

        return input;
    }
}