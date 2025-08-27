import { ValidationSchemas } from '../nodes/Tumblr/ValidationSchemas';
import { DataValidator } from '../nodes/Tumblr/DataValidator';
import { NodeOperationError } from 'n8n-workflow';

describe('ValidationSchemas', () => {
    describe('Schema Retrieval', () => {
        it('should return correct schema for known operations', () => {
            const textPostSchema = ValidationSchemas.getSchema('post', 'create_text');
            expect(textPostSchema).toBe(ValidationSchemas.TEXT_POST);

            const blogInfoSchema = ValidationSchemas.getSchema('blog', 'info');
            expect(blogInfoSchema).toBe(ValidationSchemas.BLOG_INFO);

            const queueAddSchema = ValidationSchemas.getSchema('queue', 'add');
            expect(queueAddSchema).toBe(ValidationSchemas.QUEUE_ADD);
        });

        it('should return null for unknown operations', () => {
            const unknownSchema = ValidationSchemas.getSchema('unknown', 'operation');
            expect(unknownSchema).toBeNull();
        });

        it('should handle case insensitive operation names', () => {
            const schema1 = ValidationSchemas.getSchema('POST', 'CREATE_TEXT');
            const schema2 = ValidationSchemas.getSchema('post', 'create_text');
            expect(schema1).toBe(schema2);
        });
    });

    describe('Text Post Schema', () => {
        it('should validate valid text post data', () => {
            const validData = {
                blogName: 'myblog',
                title: 'Test Post',
                body: 'This is a test post content',
                tags: ['test', 'blog', 'content'],
                state: 'published',
                format: 'html',
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.TEXT_POST)).not.toThrow();
        });

        it('should require blogName', () => {
            const invalidData = {
                title: 'Test Post',
                body: 'Content',
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.TEXT_POST))
                .toThrow(NodeOperationError);
        });

        it('should validate blog name format', () => {
            const invalidData = {
                blogName: 'invalid blog name!',
                title: 'Test Post',
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.TEXT_POST))
                .toThrow(NodeOperationError);
        });

        it('should validate title length', () => {
            const invalidData = {
                blogName: 'myblog',
                title: 'a'.repeat(251), // Too long
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.TEXT_POST))
                .toThrow(NodeOperationError);
        });

        it('should validate body length', () => {
            const invalidData = {
                blogName: 'myblog',
                body: 'a'.repeat(4097), // Too long
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.TEXT_POST))
                .toThrow(NodeOperationError);
        });

        it('should validate state values', () => {
            const invalidData = {
                blogName: 'myblog',
                state: 'invalid-state',
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.TEXT_POST))
                .toThrow(NodeOperationError);
        });

        it('should validate format values', () => {
            const invalidData = {
                blogName: 'myblog',
                format: 'invalid-format',
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.TEXT_POST))
                .toThrow(NodeOperationError);
        });

        it('should validate slug format', () => {
            const invalidData = {
                blogName: 'myblog',
                slug: 'invalid slug with spaces',
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.TEXT_POST))
                .toThrow(NodeOperationError);
        });
    });

    describe('Photo Post Schema', () => {
        it('should validate valid photo post data', () => {
            const validData = {
                blogName: 'myblog',
                caption: 'A beautiful photo',
                photos: [
                    { url: 'https://example.com/photo1.jpg', caption: 'Photo 1' },
                    { url: 'https://example.com/photo2.jpg', altText: 'Alt text' },
                ],
                tags: ['photo', 'art'],
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.PHOTO_POST)).not.toThrow();
        });

        it('should require photos array', () => {
            const invalidData = {
                blogName: 'myblog',
                caption: 'A photo without photos',
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.PHOTO_POST))
                .toThrow(NodeOperationError);
        });

        it('should validate photos array length', () => {
            const invalidData = {
                blogName: 'myblog',
                photos: [], // Empty array
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.PHOTO_POST))
                .toThrow(NodeOperationError);
        });

        it('should validate photos array max length', () => {
            const photos = Array.from({ length: 11 }, (_, i) => ({ url: `https://example.com/photo${i}.jpg` }));
            const invalidData = {
                blogName: 'myblog',
                photos,
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.PHOTO_POST))
                .toThrow(NodeOperationError);
        });

        it('should validate photo object structure', () => {
            const invalidData = {
                blogName: 'myblog',
                photos: [
                    { caption: 'Photo without URL or data' },
                ],
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.PHOTO_POST))
                .toThrow(NodeOperationError);
        });
    });

    describe('Quote Post Schema', () => {
        it('should validate valid quote post data', () => {
            const validData = {
                blogName: 'myblog',
                quote: 'To be or not to be, that is the question.',
                source: 'William Shakespeare, Hamlet',
                tags: ['quote', 'shakespeare'],
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.QUOTE_POST)).not.toThrow();
        });

        it('should require quote text', () => {
            const invalidData = {
                blogName: 'myblog',
                source: 'Some author',
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.QUOTE_POST))
                .toThrow(NodeOperationError);
        });

        it('should validate quote length', () => {
            const invalidData = {
                blogName: 'myblog',
                quote: 'a'.repeat(4097), // Too long
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.QUOTE_POST))
                .toThrow(NodeOperationError);
        });

        it('should validate source length', () => {
            const invalidData = {
                blogName: 'myblog',
                quote: 'Valid quote',
                source: 'a'.repeat(501), // Too long
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.QUOTE_POST))
                .toThrow(NodeOperationError);
        });
    });

    describe('Link Post Schema', () => {
        it('should validate valid link post data', () => {
            const validData = {
                blogName: 'myblog',
                url: 'https://example.com/article',
                title: 'Interesting Article',
                description: 'This is a very interesting article about technology.',
                tags: ['link', 'technology'],
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.LINK_POST)).not.toThrow();
        });

        it('should require URL', () => {
            const invalidData = {
                blogName: 'myblog',
                title: 'Article without URL',
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.LINK_POST))
                .toThrow(NodeOperationError);
        });

        it('should validate URL format', () => {
            const invalidData = {
                blogName: 'myblog',
                url: 'not-a-valid-url',
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.LINK_POST))
                .toThrow(NodeOperationError);
        });

        it('should reject dangerous URL protocols', () => {
            const invalidData = {
                blogName: 'myblog',
                url: 'javascript:alert(1)',
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.LINK_POST))
                .toThrow(NodeOperationError);
        });
    });

    describe('Chat Post Schema', () => {
        it('should validate valid chat post data', () => {
            const validData = {
                blogName: 'myblog',
                title: 'Conversation with Friend',
                conversation: [
                    { name: 'Alice', phrase: 'Hello there!' },
                    { name: 'Bob', phrase: 'Hi Alice, how are you?' },
                ],
                tags: ['chat', 'conversation'],
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.CHAT_POST)).not.toThrow();
        });

        it('should require conversation', () => {
            const invalidData = {
                blogName: 'myblog',
                title: 'Chat without conversation',
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.CHAT_POST))
                .toThrow(NodeOperationError);
        });

        it('should validate conversation structure', () => {
            const invalidData = {
                blogName: 'myblog',
                conversation: [
                    { phrase: 'Hello without name' }, // Missing name
                ],
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.CHAT_POST))
                .toThrow(NodeOperationError);
        });

        it('should require non-empty conversation', () => {
            const invalidData = {
                blogName: 'myblog',
                conversation: [], // Empty conversation
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.CHAT_POST))
                .toThrow(NodeOperationError);
        });
    });

    describe('Video Post Schema', () => {
        it('should validate valid video post with URL', () => {
            const validData = {
                blogName: 'myblog',
                caption: 'Amazing video',
                videoUrl: 'https://example.com/video.mp4',
                tags: ['video', 'entertainment'],
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.VIDEO_POST)).not.toThrow();
        });

        it('should validate valid video post with data', () => {
            const validData = {
                blogName: 'myblog',
                caption: 'Amazing video',
                videoData: Buffer.from('fake video data'),
                tags: ['video', 'entertainment'],
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.VIDEO_POST)).not.toThrow();
        });

        it('should validate video URL format', () => {
            const invalidData = {
                blogName: 'myblog',
                videoUrl: 'not-a-valid-url',
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.VIDEO_POST))
                .toThrow(NodeOperationError);
        });

        it('should validate video data format', () => {
            const invalidData = {
                blogName: 'myblog',
                videoData: 123, // Invalid data type
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.VIDEO_POST))
                .toThrow(NodeOperationError);
        });
    });

    describe('Audio Post Schema', () => {
        it('should validate valid audio post', () => {
            const validData = {
                blogName: 'myblog',
                caption: 'Great song',
                audioUrl: 'https://example.com/song.mp3',
                trackName: 'My Favorite Song',
                artist: 'Great Artist',
                album: 'Best Album',
                tags: ['audio', 'music'],
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.AUDIO_POST)).not.toThrow();
        });

        it('should validate track metadata length', () => {
            const invalidData = {
                blogName: 'myblog',
                trackName: 'a'.repeat(201), // Too long
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.AUDIO_POST))
                .toThrow(NodeOperationError);
        });
    });

    describe('Post Management Schemas', () => {
        it('should validate post update data', () => {
            const validData = {
                blogName: 'myblog',
                postId: '123456789',
                title: 'Updated Title',
                body: 'Updated content',
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.POST_UPDATE)).not.toThrow();
        });

        it('should validate post deletion data', () => {
            const validData = {
                blogName: 'myblog',
                postId: '123456789',
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.POST_DELETE)).not.toThrow();
        });

        it('should validate post retrieval data', () => {
            const validData = {
                blogName: 'myblog',
                postId: '123456789',
                includeNotes: true,
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.POST_GET)).not.toThrow();
        });

        it('should require numeric post ID', () => {
            const invalidData = {
                blogName: 'myblog',
                postId: 'not-numeric',
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.POST_DELETE))
                .toThrow(NodeOperationError);
        });
    });

    describe('Posts Listing Schema', () => {
        it('should validate posts listing parameters', () => {
            const validData = {
                blogName: 'myblog',
                type: 'text',
                tag: 'technology',
                limit: 20,
                offset: 0,
                filter: 'text',
                reblogInfo: true,
                notesInfo: false,
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.POSTS_LIST)).not.toThrow();
        });

        it('should validate post type values', () => {
            const invalidData = {
                blogName: 'myblog',
                type: 'invalid-type',
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.POSTS_LIST))
                .toThrow(NodeOperationError);
        });

        it('should validate limit range', () => {
            const invalidData = {
                blogName: 'myblog',
                limit: 51, // Too high
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.POSTS_LIST))
                .toThrow(NodeOperationError);
        });

        it('should validate tag length', () => {
            const invalidData = {
                blogName: 'myblog',
                tag: 'a'.repeat(140), // Too long
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.POSTS_LIST))
                .toThrow(NodeOperationError);
        });
    });

    describe('Queue Schemas', () => {
        it('should validate queue add parameters', () => {
            const validData = {
                blogName: 'myblog',
                postId: '123456789',
                publishOn: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.QUEUE_ADD)).not.toThrow();
        });

        it('should validate queue get parameters', () => {
            const validData = {
                blogName: 'myblog',
                limit: 10,
                offset: 5,
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.QUEUE_GET)).not.toThrow();
        });
    });

    describe('Social Operation Schemas', () => {
        it('should validate like operation parameters', () => {
            const validData = {
                postId: '123456789',
                reblogKey: 'abc123def',
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.SOCIAL_LIKE)).not.toThrow();
        });

        it('should validate reblog operation parameters', () => {
            const validData = {
                blogName: 'myblog',
                postId: '123456789',
                reblogKey: 'abc123def',
                comment: 'Great post!',
                tags: ['reblog', 'awesome'],
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.SOCIAL_REBLOG)).not.toThrow();
        });

        it('should validate follow operation parameters', () => {
            const validData = {
                blogName: 'targetblog',
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.SOCIAL_FOLLOW)).not.toThrow();
        });
    });

    describe('Search Schemas', () => {
        it('should validate tag search parameters', () => {
            const validData = {
                tag: 'photography',
                before: 1234567890,
                limit: 20,
                filter: 'text',
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.SEARCH_TAG)).not.toThrow();
        });

        it('should validate keyword search parameters', () => {
            const validData = {
                query: 'tumblr api development',
                sort: 'recent',
                limit: 15,
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.SEARCH_KEYWORD)).not.toThrow();
        });

        it('should validate user content search parameters', () => {
            const validData = {
                blogName: 'myblog',
                query: 'javascript tutorial',
                type: 'text',
                limit: 10,
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.SEARCH_USER_CONTENT)).not.toThrow();
        });

        it('should require search query', () => {
            const invalidData = {
                // Missing required query
                sort: 'recent',
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.SEARCH_KEYWORD))
                .toThrow(NodeOperationError);
        });

        it('should validate search query length', () => {
            const invalidData = {
                query: 'a'.repeat(501), // Too long
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.SEARCH_KEYWORD))
                .toThrow(NodeOperationError);
        });
    });

    describe('File Upload Schema', () => {
        it('should validate valid file upload data', () => {
            const validData = {
                fileName: 'image.jpg',
                fileData: Buffer.from('fake image data'),
                mimeType: 'image/jpeg',
            };

            expect(() => DataValidator.validateAndSanitize(validData, ValidationSchemas.FILE_UPLOAD)).not.toThrow();
        });

        it('should reject dangerous file extensions', () => {
            const invalidData = {
                fileName: 'malware.exe',
                fileData: Buffer.from('fake data'),
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.FILE_UPLOAD))
                .toThrow(NodeOperationError);
        });

        it('should validate file name length', () => {
            const invalidData = {
                fileName: 'a'.repeat(256), // Too long
                fileData: Buffer.from('fake data'),
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.FILE_UPLOAD))
                .toThrow(NodeOperationError);
        });

        it('should validate MIME type', () => {
            const invalidData = {
                fileName: 'file.txt',
                fileData: Buffer.from('fake data'),
                mimeType: 'application/x-executable', // Not allowed
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.FILE_UPLOAD))
                .toThrow(NodeOperationError);
        });

        it('should validate file size', () => {
            const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
            const invalidData = {
                fileName: 'large.jpg',
                fileData: largeBuffer,
            };

            expect(() => DataValidator.validateAndSanitize(invalidData, ValidationSchemas.FILE_UPLOAD))
                .toThrow(NodeOperationError);
        });
    });

    describe('Schema Completeness', () => {
        it('should have all expected schemas', () => {
            const allSchemas = ValidationSchemas.getAllSchemas();
            const expectedSchemas = [
                'TEXT_POST',
                'PHOTO_POST',
                'QUOTE_POST',
                'LINK_POST',
                'CHAT_POST',
                'VIDEO_POST',
                'AUDIO_POST',
                'POST_UPDATE',
                'POST_DELETE',
                'POST_GET',
                'POSTS_LIST',
                'BLOG_INFO',
                'QUEUE_ADD',
                'QUEUE_GET',
                'DRAFT_CREATE',
                'SOCIAL_LIKE',
                'SOCIAL_REBLOG',
                'SOCIAL_FOLLOW',
                'SEARCH_TAG',
                'SEARCH_KEYWORD',
                'SEARCH_USER_CONTENT',
                'FILE_UPLOAD',
            ];

            expectedSchemas.forEach(schemaName => {
                expect(allSchemas).toHaveProperty(schemaName);
                expect(allSchemas[schemaName]).toBeDefined();
            });
        });

        it('should return consistent schemas from getSchema and getAllSchemas', () => {
            const textPostFromGet = ValidationSchemas.getSchema('post', 'create_text');
            const textPostFromAll = ValidationSchemas.getAllSchemas().TEXT_POST;
            expect(textPostFromGet).toBe(textPostFromAll);
        });
    });

    describe('Common Validation Rules', () => {
        it('should consistently validate blog names across schemas', () => {
            const testCases = [
                {
                    schema: ValidationSchemas.TEXT_POST,
                    validData: { blogName: 'valid-blog-name', title: 'Test', body: 'Content' },
                    invalidData: { blogName: 'invalid blog name!', title: 'Test', body: 'Content' }
                },
                {
                    schema: ValidationSchemas.PHOTO_POST,
                    validData: { blogName: 'valid-blog-name', photos: [{ url: 'https://example.com/photo.jpg' }] },
                    invalidData: { blogName: 'invalid blog name!', photos: [{ url: 'https://example.com/photo.jpg' }] }
                },
                {
                    schema: ValidationSchemas.BLOG_INFO,
                    validData: { blogName: 'valid-blog-name' },
                    invalidData: { blogName: 'invalid blog name!' }
                },
                {
                    schema: ValidationSchemas.QUEUE_ADD,
                    validData: { blogName: 'valid-blog-name', postId: '12345' },
                    invalidData: { blogName: 'invalid blog name!', postId: '12345' }
                },
            ];

            testCases.forEach(({ schema, validData, invalidData }) => {
                expect(() => DataValidator.validateAndSanitize(validData, schema)).not.toThrow();
                expect(() => DataValidator.validateAndSanitize(invalidData, schema)).toThrow();
            });
        });

        it('should consistently validate tags across schemas', () => {
            const schemas = [
                ValidationSchemas.TEXT_POST,
                ValidationSchemas.PHOTO_POST,
                ValidationSchemas.QUOTE_POST,
            ];

            const validTags = ['tag1', 'tag2'];
            const invalidTags = Array.from({ length: 31 }, (_, i) => `tag${i}`); // Too many

            const testCases = [
                {
                    schema: ValidationSchemas.TEXT_POST,
                    validData: { blogName: 'myblog', title: 'Test', body: 'Content', tags: validTags },
                    invalidData: { blogName: 'myblog', title: 'Test', body: 'Content', tags: invalidTags }
                },
                {
                    schema: ValidationSchemas.PHOTO_POST,
                    validData: { blogName: 'myblog', photos: [{ url: 'https://example.com/photo.jpg' }], tags: validTags },
                    invalidData: { blogName: 'myblog', photos: [{ url: 'https://example.com/photo.jpg' }], tags: invalidTags }
                },
                {
                    schema: ValidationSchemas.QUOTE_POST,
                    validData: { blogName: 'myblog', quote: 'Test quote', tags: validTags },
                    invalidData: { blogName: 'myblog', quote: 'Test quote', tags: invalidTags }
                },
            ];

            testCases.forEach(({ schema, validData, invalidData }) => {
                expect(() => DataValidator.validateAndSanitize(validData, schema)).not.toThrow();
                expect(() => DataValidator.validateAndSanitize(invalidData, schema)).toThrow();
            });
        });

        it('should consistently validate state values across schemas', () => {
            const schemas = [
                ValidationSchemas.TEXT_POST,
                ValidationSchemas.PHOTO_POST,
                ValidationSchemas.QUOTE_POST,
            ];

            const validStates = ['published', 'draft', 'queue', 'private'];
            const invalidState = 'invalid-state';

            const testCases = [
                {
                    schema: ValidationSchemas.TEXT_POST,
                    getValidData: (state: string) => ({ blogName: 'myblog', title: 'Test', body: 'Content', state }),
                    getInvalidData: () => ({ blogName: 'myblog', title: 'Test', body: 'Content', state: invalidState })
                },
                {
                    schema: ValidationSchemas.PHOTO_POST,
                    getValidData: (state: string) => ({ blogName: 'myblog', photos: [{ url: 'https://example.com/photo.jpg' }], state }),
                    getInvalidData: () => ({ blogName: 'myblog', photos: [{ url: 'https://example.com/photo.jpg' }], state: invalidState })
                },
                {
                    schema: ValidationSchemas.QUOTE_POST,
                    getValidData: (state: string) => ({ blogName: 'myblog', quote: 'Test quote', state }),
                    getInvalidData: () => ({ blogName: 'myblog', quote: 'Test quote', state: invalidState })
                },
            ];

            testCases.forEach(({ schema, getValidData, getInvalidData }) => {
                validStates.forEach(state => {
                    const data = getValidData(state);
                    expect(() => DataValidator.validateAndSanitize(data, schema)).not.toThrow();
                });

                const invalidData = getInvalidData();
                expect(() => DataValidator.validateAndSanitize(invalidData, schema)).toThrow();
            });
        });
    });
});