import { DataValidator, ValidationErrorType, ValidationError, ValidationSchema } from '../nodes/Tumblr/DataValidator';
import { ValidationSchemas } from '../nodes/Tumblr/ValidationSchemas';
import { NodeOperationError } from 'n8n-workflow';

describe('DataValidator', () => {
    describe('Basic Validation', () => {
        it('should validate required fields', () => {
            const schema: ValidationSchema = {
                name: { required: true, type: 'string' },
                age: { required: false, type: 'number' },
            };

            const data = { age: 25 };
            const errors = DataValidator.validate(data, schema);

            expect(errors).toHaveLength(1);
            expect(errors[0].type).toBe(ValidationErrorType.REQUIRED_FIELD);
            expect(errors[0].field).toBe('name');
        });

        it('should validate field types correctly', () => {
            const schema: ValidationSchema = {
                name: { type: 'string' },
                age: { type: 'number' },
                active: { type: 'boolean' },
                tags: { type: 'array' },
                profile: { type: 'object' },
            };

            const data = {
                name: 123,
                age: 'twenty-five',
                active: 'yes',
                tags: 'tag1,tag2',
                profile: 'not an object',
            };

            const errors = DataValidator.validate(data, schema);

            expect(errors).toHaveLength(5);
            expect(errors.map(e => e.type)).toEqual([
                ValidationErrorType.INVALID_TYPE,
                ValidationErrorType.INVALID_TYPE,
                ValidationErrorType.INVALID_TYPE,
                ValidationErrorType.INVALID_TYPE,
                ValidationErrorType.INVALID_TYPE,
            ]);
        });

        it('should validate string length constraints', () => {
            const schema: ValidationSchema = {
                shortText: { type: 'string', minLength: 5, maxLength: 10 },
            };

            const shortData = { shortText: 'hi' };
            const longData = { shortText: 'this is way too long' };

            const shortErrors = DataValidator.validate(shortData, schema);
            const longErrors = DataValidator.validate(longData, schema);

            expect(shortErrors).toHaveLength(1);
            expect(shortErrors[0].type).toBe(ValidationErrorType.INVALID_LENGTH);

            expect(longErrors).toHaveLength(1);
            expect(longErrors[0].type).toBe(ValidationErrorType.INVALID_LENGTH);
        });

        it('should validate numeric range constraints', () => {
            const schema: ValidationSchema = {
                score: { type: 'number', min: 0, max: 100 },
            };

            const lowData = { score: -5 };
            const highData = { score: 150 };

            const lowErrors = DataValidator.validate(lowData, schema);
            const highErrors = DataValidator.validate(highData, schema);

            expect(lowErrors).toHaveLength(1);
            expect(lowErrors[0].type).toBe(ValidationErrorType.INVALID_VALUE);

            expect(highErrors).toHaveLength(1);
            expect(highErrors[0].type).toBe(ValidationErrorType.INVALID_VALUE);
        });

        it('should validate pattern constraints', () => {
            const schema: ValidationSchema = {
                code: { type: 'string', pattern: /^[A-Z]{3}\d{3}$/ },
            };

            const validData = { code: 'ABC123' };
            const invalidData = { code: 'abc123' };

            const validErrors = DataValidator.validate(validData, schema);
            const invalidErrors = DataValidator.validate(invalidData, schema);

            expect(validErrors).toHaveLength(0);
            expect(invalidErrors).toHaveLength(1);
            expect(invalidErrors[0].type).toBe(ValidationErrorType.INVALID_FORMAT);
        });

        it('should validate allowed values', () => {
            const schema: ValidationSchema = {
                status: { type: 'string', allowedValues: ['active', 'inactive', 'pending'] },
            };

            const validData = { status: 'active' };
            const invalidData = { status: 'unknown' };

            const validErrors = DataValidator.validate(validData, schema);
            const invalidErrors = DataValidator.validate(invalidData, schema);

            expect(validErrors).toHaveLength(0);
            expect(invalidErrors).toHaveLength(1);
            expect(invalidErrors[0].type).toBe(ValidationErrorType.INVALID_VALUE);
        });

        it('should use custom validators', () => {
            const schema: ValidationSchema = {
                email: {
                    type: 'string',
                    customValidator: (value: string) => {
                        if (!value.includes('@')) return 'Email must contain @ symbol';
                        return true;
                    },
                },
            };

            const validData = { email: 'test@example.com' };
            const invalidData = { email: 'invalid-email' };

            const validErrors = DataValidator.validate(validData, schema);
            const invalidErrors = DataValidator.validate(invalidData, schema);

            expect(validErrors).toHaveLength(0);
            expect(invalidErrors).toHaveLength(1);
            expect(invalidErrors[0].type).toBe(ValidationErrorType.INVALID_VALUE);
        });
    });

    describe('URL Validation', () => {
        it('should validate valid URLs', () => {
            const validUrls = [
                'https://example.com',
                'http://test.org/path',
                'https://subdomain.example.com/path?query=value',
            ];

            validUrls.forEach(url => {
                expect(() => DataValidator.validateUrl(url)).not.toThrow();
            });
        });

        it('should reject invalid URLs', () => {
            const invalidUrls = [
                'not-a-url',
                'ftp://example.com',
                'javascript:alert(1)',
                'data:text/html,<script>alert(1)</script>',
            ];

            invalidUrls.forEach(url => {
                expect(() => DataValidator.validateUrl(url)).toThrow(NodeOperationError);
            });
        });

        it('should reject dangerous protocols', () => {
            const dangerousUrls = [
                'javascript:alert(1)',
                'vbscript:msgbox(1)',
                'data:text/html,<script>alert(1)</script>',
                'file:///etc/passwd',
            ];

            dangerousUrls.forEach(url => {
                expect(() => DataValidator.validateUrl(url)).toThrow(NodeOperationError);
            });
        });
    });

    describe('Blog Name Validation', () => {
        it('should validate correct blog names', () => {
            const validNames = [
                'myblog',
                'my-blog',
                'my_blog',
                'blog123',
                'test-blog-name',
            ];

            validNames.forEach(name => {
                expect(() => DataValidator.validateBlogName(name)).not.toThrow();
            });
        });

        it('should handle .tumblr.com suffix', () => {
            const result = DataValidator.validateBlogName('myblog.tumblr.com');
            expect(result).toBe('myblog');
        });

        it('should reject invalid blog names', () => {
            const invalidNames = [
                '',
                'blog with spaces',
                'blog@special',
                'blog.with.dots',
                'blog/with/slashes',
            ];

            invalidNames.forEach(name => {
                expect(() => DataValidator.validateBlogName(name)).toThrow(NodeOperationError);
            });
        });
    });

    describe('Tags Validation', () => {
        it('should validate string tags', () => {
            const result = DataValidator.validateAndFormatTags('tag1, tag2, tag3');
            expect(result).toEqual(['tag1', 'tag2', 'tag3']);
        });

        it('should validate array tags', () => {
            const result = DataValidator.validateAndFormatTags(['tag1', 'tag2', 'tag3']);
            expect(result).toEqual(['tag1', 'tag2', 'tag3']);
        });

        it('should filter empty tags', () => {
            const result = DataValidator.validateAndFormatTags('tag1, , tag3, ');
            expect(result).toEqual(['tag1', 'tag3']);
        });

        it('should reject tags that are too long', () => {
            const longTag = 'a'.repeat(140);
            expect(() => DataValidator.validateAndFormatTags([longTag])).toThrow(NodeOperationError);
        });

        it('should reject too many tags', () => {
            const manyTags = Array.from({ length: 31 }, (_, i) => `tag${i}`);
            expect(() => DataValidator.validateAndFormatTags(manyTags)).toThrow(NodeOperationError);
        });
    });

    describe('Post ID Validation', () => {
        it('should validate numeric post IDs', () => {
            const validIds = ['123', '456789', '1'];

            validIds.forEach(id => {
                expect(() => DataValidator.validatePostId(id)).not.toThrow();
            });
        });

        it('should reject non-numeric post IDs', () => {
            const invalidIds = ['abc', '123abc', '', 'post-123'];

            invalidIds.forEach(id => {
                expect(() => DataValidator.validatePostId(id)).toThrow(NodeOperationError);
            });
        });
    });

    describe('Content Length Validation', () => {
        it('should accept content within limits', () => {
            const content = 'This is valid content';
            expect(() => DataValidator.validateContentLength(content, 100, 'Content')).not.toThrow();
        });

        it('should reject content exceeding limits', () => {
            const content = 'a'.repeat(101);
            expect(() => DataValidator.validateContentLength(content, 100, 'Content')).toThrow(NodeOperationError);
        });
    });

    describe('HTML Sanitization', () => {
        it('should remove script tags', () => {
            const html = '<p>Hello</p><script>alert(1)</script><p>World</p>';
            const result = DataValidator.validateAndSanitizeHtml(html);
            expect(result).toBe('<p>Hello</p><p>World</p>');
        });

        it('should remove dangerous event handlers', () => {
            const html = '<div onclick="alert(1)">Click me</div>';
            const result = DataValidator.validateAndSanitizeHtml(html);
            expect(result).toBe('<div >Click me</div>'); // Note: regex leaves a space
        });

        it('should remove dangerous protocols from links', () => {
            const html = '<a href="javascript:alert(1)">Link</a>';
            const result = DataValidator.validateAndSanitizeHtml(html);
            expect(result).toBe('<a >Link</a>'); // Note: regex leaves a space
        });
    });

    describe('Conversation Validation', () => {
        it('should parse string format conversation', () => {
            const conversation = 'Alice: Hello there\nBob: Hi Alice!';
            const result = DataValidator.validateConversation(conversation);

            expect(result).toEqual([
                { name: 'Alice', label: 'Alice', phrase: 'Hello there' },
                { name: 'Bob', label: 'Bob', phrase: 'Hi Alice!' },
            ]);
        });

        it('should handle array format conversation', () => {
            const conversation = [
                { name: 'Alice', phrase: 'Hello there' },
                { name: 'Bob', phrase: 'Hi Alice!' },
            ];
            const result = DataValidator.validateConversation(conversation);

            expect(result).toEqual([
                { name: 'Alice', label: 'Alice', phrase: 'Hello there' },
                { name: 'Bob', label: 'Bob', phrase: 'Hi Alice!' },
            ]);
        });

        it('should handle simple string array', () => {
            const conversation = ['Hello there', 'Hi back!'];
            const result = DataValidator.validateConversation(conversation);

            expect(result).toEqual([
                { name: 'Speaker 1', label: 'Speaker 1', phrase: 'Hello there' },
                { name: 'Speaker 2', label: 'Speaker 2', phrase: 'Hi back!' },
            ]);
        });

        it('should reject invalid conversation format', () => {
            expect(() => DataValidator.validateConversation(123)).toThrow(NodeOperationError);
            expect(() => DataValidator.validateConversation(null)).toThrow(NodeOperationError);
        });
    });

    describe('File Data Validation', () => {
        it('should validate Buffer file data', () => {
            const buffer = Buffer.from('test file content');
            expect(() => DataValidator.validateFileData(buffer)).not.toThrow();
        });

        it('should validate base64 string file data', () => {
            const base64 = Buffer.from('test file content').toString('base64');
            expect(() => DataValidator.validateFileData(base64)).not.toThrow();
        });

        it('should reject invalid file data types', () => {
            expect(() => DataValidator.validateFileData(123)).toThrow(NodeOperationError);
            expect(() => DataValidator.validateFileData({})).toThrow(NodeOperationError);
        });

        it('should reject files that are too large', () => {
            const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
            expect(() => DataValidator.validateFileData(largeBuffer)).toThrow(NodeOperationError);
        });

        it('should validate MIME types when provided', () => {
            const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG header
            expect(() => DataValidator.validateFileData(jpegBuffer, ['image/jpeg'])).not.toThrow();
            expect(() => DataValidator.validateFileData(jpegBuffer, ['image/png'])).toThrow(NodeOperationError);
        });
    });

    describe('Search Query Validation', () => {
        it('should validate normal search queries', () => {
            const query = 'tumblr photography';
            const result = DataValidator.validateSearchQuery(query);
            expect(result).toBe('tumblr photography');
        });

        it('should sanitize dangerous characters', () => {
            const query = 'search<script>alert(1)</script>';
            const result = DataValidator.validateSearchQuery(query);
            expect(result).toBe('searchscriptalert(1)/script');
        });

        it('should reject empty queries', () => {
            expect(() => DataValidator.validateSearchQuery('')).toThrow(NodeOperationError);
            expect(() => DataValidator.validateSearchQuery('   ')).toThrow(NodeOperationError);
        });

        it('should reject queries that are too long', () => {
            const longQuery = 'a'.repeat(501);
            expect(() => DataValidator.validateSearchQuery(longQuery)).toThrow(NodeOperationError);
        });
    });

    describe('Pagination Validation', () => {
        it('should validate correct pagination parameters', () => {
            const result = DataValidator.validatePagination(20, 10);
            expect(result).toEqual({ limit: 20, offset: 10 });
        });

        it('should use defaults for undefined parameters', () => {
            const result = DataValidator.validatePagination();
            expect(result).toEqual({ limit: 20, offset: 0 });
        });

        it('should reject invalid limit values', () => {
            expect(() => DataValidator.validatePagination(0, 0)).toThrow(NodeOperationError);
            expect(() => DataValidator.validatePagination(51, 0)).toThrow(NodeOperationError);
        });

        it('should reject negative offset values', () => {
            expect(() => DataValidator.validatePagination(20, -1)).toThrow(NodeOperationError);
        });
    });

    describe('DateTime Validation', () => {
        it('should validate Date objects', () => {
            const future = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
            const result = DataValidator.validateDateTime(future);
            expect(result).toBeInstanceOf(Date);
        });

        it('should validate ISO date strings', () => {
            const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const result = DataValidator.validateDateTime(future.toISOString());
            expect(result).toBeInstanceOf(Date);
        });

        it('should validate Unix timestamps', () => {
            const futureTimestamp = Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000);
            const result = DataValidator.validateDateTime(futureTimestamp);
            expect(result).toBeInstanceOf(Date);
        });

        it('should reject dates in the past', () => {
            const past = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
            expect(() => DataValidator.validateDateTime(past)).toThrow(NodeOperationError);
        });

        it('should reject dates too far in the future', () => {
            const farFuture = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000); // 2 years
            expect(() => DataValidator.validateDateTime(farFuture)).toThrow(NodeOperationError);
        });
    });

    describe('Security Validation', () => {
        it('should remove null bytes and control characters', () => {
            const input = 'Hello\x00World\x01Test';
            const result = DataValidator.securityValidation(input);
            expect(result).toBe('HelloWorldTest');
        });

        it('should detect and reject script tags', () => {
            const input = '<script>alert(1)</script>';
            expect(() => DataValidator.securityValidation(input)).toThrow(NodeOperationError);
        });

        it('should detect and reject javascript: URLs', () => {
            const input = 'javascript:alert(1)';
            expect(() => DataValidator.securityValidation(input)).toThrow(NodeOperationError);
        });

        it('should detect and reject event handlers', () => {
            const input = 'onclick="alert(1)"';
            expect(() => DataValidator.securityValidation(input)).toThrow(NodeOperationError);
        });

        it('should recursively validate arrays and objects', () => {
            const input = {
                text: 'Hello\x00World',
                items: ['Item\x01One', 'Item\x02Two'],
            };
            const result = DataValidator.securityValidation(input);
            expect(result).toEqual({
                text: 'HelloWorld',
                items: ['ItemOne', 'ItemTwo'],
            });
        });
    });

    describe('Webhook URL Validation', () => {
        it('should validate HTTPS URLs', () => {
            const url = 'https://example.com/webhook';
            const result = DataValidator.validateWebhookUrl(url);
            expect(result).toBe(url);
        });

        it('should reject localhost URLs', () => {
            const urls = [
                'http://localhost/webhook',
                'https://127.0.0.1/webhook',
                'http://::1/webhook',
            ];

            urls.forEach(url => {
                expect(() => DataValidator.validateWebhookUrl(url)).toThrow(NodeOperationError);
            });
        });

        it('should reject private IP addresses', () => {
            const urls = [
                'http://192.168.1.1/webhook',
                'http://10.0.0.1/webhook',
                'http://172.16.0.1/webhook',
            ];

            urls.forEach(url => {
                expect(() => DataValidator.validateWebhookUrl(url)).toThrow(NodeOperationError);
            });
        });
    });

    describe('Batch Validation', () => {
        it('should validate correct batch size', () => {
            const items = [1, 2, 3, 4, 5];
            const result = DataValidator.validateBatchParams(items, 10);
            expect(result).toEqual(items);
        });

        it('should reject empty batches', () => {
            expect(() => DataValidator.validateBatchParams([])).toThrow(NodeOperationError);
        });

        it('should reject batches that are too large', () => {
            const items = Array.from({ length: 51 }, (_, i) => i);
            expect(() => DataValidator.validateBatchParams(items, 50)).toThrow(NodeOperationError);
        });

        it('should reject non-array input', () => {
            expect(() => DataValidator.validateBatchParams('not an array' as any)).toThrow(NodeOperationError);
        });
    });

    describe('Schema Integration', () => {
        it('should validate text post data', () => {
            const validData = {
                blogName: 'myblog',
                title: 'Test Post',
                body: 'This is a test post',
                tags: ['test', 'blog'],
                state: 'published',
            };

            // Test with a simple schema for text posts
            const textSchema = {
                blogName: { required: true, type: 'string' as const },
                title: { type: 'string' as const },
                body: { type: 'string' as const },
                tags: { type: 'array' as const },
                state: { type: 'string' as const, allowedValues: ['published', 'draft', 'queue', 'private'] },
            };

            expect(() => DataValidator.validateAndSanitize(validData, textSchema)).not.toThrow();
        });

        it('should reject invalid text post data', () => {
            const invalidData = {
                // Missing required blogName
                title: 'Test Post',
                body: 'This is a test post',
                state: 'invalid-state', // Invalid state
            };

            const textSchema = {
                blogName: { required: true, type: 'string' as const },
                title: { type: 'string' as const },
                body: { type: 'string' as const },
                state: { type: 'string' as const, allowedValues: ['published', 'draft', 'queue', 'private'] },
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, textSchema)).toThrow(NodeOperationError);
        });

        it('should validate photo post data', () => {
            const validData = {
                blogName: 'myblog',
                caption: 'Test photo',
                photos: [{ url: 'https://example.com/photo.jpg' }],
                tags: ['photo', 'test'],
            };

            // Test with a simple schema for photo posts
            const photoSchema = {
                blogName: { required: true, type: 'string' as const },
                caption: { type: 'string' as const },
                photos: { required: true, type: 'array' as const },
                tags: { type: 'array' as const },
            };

            expect(() => DataValidator.validateAndSanitize(validData, photoSchema)).not.toThrow();
        });
    });

    describe('Error Formatting', () => {
        it('should format single validation error', () => {
            const schema: ValidationSchema = {
                name: { required: true, type: 'string' },
            };

            const data = {};

            expect(() => DataValidator.validateAndSanitize(data, schema)).toThrow(
                expect.objectContaining({
                    message: expect.stringContaining("Field 'name' is required"),
                })
            );
        });

        it('should format multiple validation errors', () => {
            const schema: ValidationSchema = {
                name: { required: true, type: 'string' },
                age: { required: true, type: 'number' },
            };

            const data = {};

            expect(() => DataValidator.validateAndSanitize(data, schema)).toThrow(
                expect.objectContaining({
                    message: expect.stringContaining('Validation failed with 2 errors'),
                })
            );
        });
    });
});