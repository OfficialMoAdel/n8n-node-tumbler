import { postOperations, postOperationOptions, postValidationRules, postHelpText } from '../nodes/Tumblr/descriptions/PostDescription';

describe('PostDescription', () => {
    describe('postOperations', () => {
        it('should contain all required post operation parameters', () => {
            expect(postOperations).toBeDefined();
            expect(Array.isArray(postOperations)).toBe(true);
            expect(postOperations.length).toBeGreaterThan(0);
        });

        it('should have blog name parameter with correct configuration', () => {
            const blogNameParam = postOperations.find(param => param.name === 'blogName');
            expect(blogNameParam).toBeDefined();
            expect(blogNameParam?.required).toBe(true);
            expect(blogNameParam?.type).toBe('string');
            expect(blogNameParam?.displayOptions?.show?.resource).toContain('post');
        });

        it('should have post ID parameter for update/delete/get operations', () => {
            const postIdParam = postOperations.find(param => param.name === 'postId');
            expect(postIdParam).toBeDefined();
            expect(postIdParam?.required).toBe(true);
            expect(postIdParam?.type).toBe('string');
            expect(postIdParam?.displayOptions?.show?.operation).toEqual(['update', 'delete', 'get']);
        });

        it('should have post type parameter for create operation', () => {
            const postTypeParam = postOperations.find(param => param.name === 'postType');
            expect(postTypeParam).toBeDefined();
            expect(postTypeParam?.required).toBe(true);
            expect(postTypeParam?.type).toBe('options');
            expect(postTypeParam?.displayOptions?.show?.operation).toContain('create');
        });

        it('should have type-specific fields for different post types', () => {
            // Text post fields
            const titleParam = postOperations.find(param => param.name === 'title');
            expect(titleParam?.displayOptions?.show?.postType).toContain('text');

            const bodyParam = postOperations.find(param => param.name === 'body');
            expect(bodyParam?.displayOptions?.show?.postType).toContain('text');

            // Photo post fields
            const photoUrlParam = postOperations.find(param => param.name === 'photoUrl');
            expect(photoUrlParam?.displayOptions?.show?.postType).toContain('photo');

            // Quote post fields
            const quoteParam = postOperations.find(param => param.name === 'quote');
            expect(quoteParam?.displayOptions?.show?.postType).toContain('quote');

            // Link post fields
            const urlParam = postOperations.find(param => param.name === 'url');
            expect(urlParam?.displayOptions?.show?.postType).toContain('link');

            // Chat post fields
            const conversationParam = postOperations.find(param => param.name === 'conversation');
            expect(conversationParam?.displayOptions?.show?.postType).toContain('chat');

            // Video post fields
            const videoUrlParam = postOperations.find(param => param.name === 'videoUrl');
            expect(videoUrlParam?.displayOptions?.show?.postType).toContain('video');

            // Audio post fields
            const audioUrlParam = postOperations.find(param => param.name === 'audioUrl');
            expect(audioUrlParam?.displayOptions?.show?.postType).toContain('audio');
        });

        it('should have common fields for all post types', () => {
            const tagsParam = postOperations.find(param => param.name === 'tags');
            expect(tagsParam).toBeDefined();
            expect(tagsParam?.displayOptions?.show?.operation).toEqual(['create', 'update']);

            const stateParam = postOperations.find(param => param.name === 'state');
            expect(stateParam).toBeDefined();
            expect(stateParam?.type).toBe('options');
        });

        it('should have additional options collection', () => {
            const additionalOptions = postOperations.find(param => param.name === 'additionalOptions');
            expect(additionalOptions).toBeDefined();
            expect(additionalOptions?.type).toBe('collection');
            expect(additionalOptions?.displayOptions?.show?.operation).toEqual(['create', 'update']);
        });

        it('should have get options for get operation', () => {
            const getOptions = postOperations.find(param => param.name === 'getOptions');
            expect(getOptions).toBeDefined();
            expect(getOptions?.type).toBe('collection');
            expect(getOptions?.displayOptions?.show?.operation).toContain('get');
        });
    });

    describe('postOperationOptions', () => {
        it('should have correct structure and properties', () => {
            expect(postOperationOptions).toBeDefined();
            expect(postOperationOptions.displayName).toBe('Operation');
            expect(postOperationOptions.name).toBe('operation');
            expect(postOperationOptions.type).toBe('options');
            expect(postOperationOptions.displayOptions?.show?.resource).toContain('post');
        });

        it('should contain all post operations', () => {
            const expectedOperations = ['create', 'update', 'delete', 'get'];
            const actualOperations = postOperationOptions.options?.map(option =>
                'value' in option ? option.value : ''
            ) || [];

            expectedOperations.forEach(operation => {
                expect(actualOperations).toContain(operation);
            });
        });

        it('should have proper descriptions and actions for each operation', () => {
            postOperationOptions.options?.forEach(option => {
                if ('value' in option) {
                    expect(option.name).toBeDefined();
                    expect(option.value).toBeDefined();
                    expect(option.description).toBeDefined();
                    expect(option.action).toBeDefined();
                    expect(typeof option.description).toBe('string');
                    expect(typeof option.action).toBe('string');
                }
            });
        });
    });

    describe('postValidationRules', () => {
        describe('validatePostId', () => {
            it('should accept valid post IDs', () => {
                const validIds = ['123456789', '1', '999999999999'];
                validIds.forEach(id => {
                    expect(postValidationRules.validatePostId(id)).toBeNull();
                });
            });

            it('should reject invalid post IDs', () => {
                const invalidIds = ['', '   ', 'abc123', '123abc', 'not-a-number'];
                invalidIds.forEach(id => {
                    expect(postValidationRules.validatePostId(id)).not.toBeNull();
                });
            });

            it('should return specific error messages', () => {
                expect(postValidationRules.validatePostId('')).toContain('required');
                expect(postValidationRules.validatePostId('abc')).toContain('numeric');
            });
        });

        describe('validateTextPost', () => {
            it('should accept valid text posts', () => {
                expect(postValidationRules.validateTextPost('Title', '')).toBeNull();
                expect(postValidationRules.validateTextPost('', 'Body content')).toBeNull();
                expect(postValidationRules.validateTextPost('Title', 'Body')).toBeNull();
            });

            it('should reject posts without title or body', () => {
                expect(postValidationRules.validateTextPost('', '')).toContain('require either');
                expect(postValidationRules.validateTextPost('   ', '   ')).toContain('require either');
            });

            it('should reject titles that are too long', () => {
                const longTitle = 'a'.repeat(251);
                expect(postValidationRules.validateTextPost(longTitle, 'body')).toContain('too long');
            });
        });

        describe('validateUrl', () => {
            it('should accept valid URLs', () => {
                const validUrls = [
                    'https://example.com',
                    'http://test.org',
                    'https://subdomain.example.com/path?query=value',
                ];
                validUrls.forEach(url => {
                    expect(postValidationRules.validateUrl(url)).toBeNull();
                });
            });

            it('should reject invalid URLs', () => {
                const invalidUrls = ['', 'not-a-url', 'just-text', 'http://'];
                invalidUrls.forEach(url => {
                    expect(postValidationRules.validateUrl(url)).not.toBeNull();
                });
            });

            it('should use custom field name in error message', () => {
                const error = postValidationRules.validateUrl('invalid', 'Photo URL');
                expect(error).toContain('Photo URL');
            });
        });

        describe('validateQuotePost', () => {
            it('should accept valid quotes', () => {
                expect(postValidationRules.validateQuotePost('A valid quote')).toBeNull();
                expect(postValidationRules.validateQuotePost('a'.repeat(2000))).toBeNull();
            });

            it('should reject empty quotes', () => {
                expect(postValidationRules.validateQuotePost('')).toContain('required');
                expect(postValidationRules.validateQuotePost('   ')).toContain('required');
            });

            it('should reject quotes that are too long', () => {
                const longQuote = 'a'.repeat(2001);
                expect(postValidationRules.validateQuotePost(longQuote)).toContain('too long');
            });
        });

        describe('validateChatPost', () => {
            it('should accept valid chat format', () => {
                const validChats = [
                    'Person A: Hello\nPerson B: Hi there',
                    'User1: How are you?\nUser2: I\'m good, thanks!',
                ];
                validChats.forEach(chat => {
                    expect(postValidationRules.validateChatPost(chat)).toBeNull();
                });
            });

            it('should reject empty conversations', () => {
                expect(postValidationRules.validateChatPost('')).toContain('required');
                expect(postValidationRules.validateChatPost('   ')).toContain('required');
            });

            it('should reject invalid chat format', () => {
                const invalidChats = [
                    'Just text without colon',
                    'Person A: Hello\nInvalid line without colon',
                ];
                invalidChats.forEach(chat => {
                    expect(postValidationRules.validateChatPost(chat)).toContain('Name: Message');
                });
            });
        });

        describe('validateTags', () => {
            it('should accept valid tags', () => {
                const validTags = [
                    'tag1, tag2, tag3',
                    'photography',
                    '',
                    'a'.repeat(139),
                ];
                validTags.forEach(tags => {
                    expect(postValidationRules.validateTags(tags)).toBeNull();
                });
            });

            it('should reject too many tags', () => {
                const tooManyTags = Array(31).fill('tag').join(', ');
                expect(postValidationRules.validateTags(tooManyTags)).toContain('Maximum 30 tags');
            });

            it('should reject tags that are too long', () => {
                const longTag = 'a'.repeat(140);
                expect(postValidationRules.validateTags(longTag)).toContain('139 characters');
            });
        });
    });

    describe('postHelpText', () => {
        it('should contain help text for all operations', () => {
            const expectedOperations = ['create', 'update', 'delete', 'get'];
            expectedOperations.forEach(operation => {
                expect(postHelpText[operation as keyof typeof postHelpText]).toBeDefined();
            });
        });

        it('should have proper structure for each help text entry', () => {
            Object.values(postHelpText).forEach(helpEntry => {
                expect(helpEntry.description).toBeDefined();
                expect(helpEntry.examples).toBeDefined();
                expect(helpEntry.notes).toBeDefined();
                expect(Array.isArray(helpEntry.examples)).toBe(true);
                expect(Array.isArray(helpEntry.notes)).toBe(true);
                expect(typeof helpEntry.description).toBe('string');
            });
        });

        it('should have non-empty examples and notes', () => {
            Object.values(postHelpText).forEach(helpEntry => {
                expect(helpEntry.examples.length).toBeGreaterThan(0);
                expect(helpEntry.notes.length).toBeGreaterThan(0);
                helpEntry.examples.forEach(example => {
                    expect(typeof example).toBe('string');
                    expect(example.length).toBeGreaterThan(0);
                });
                helpEntry.notes.forEach(note => {
                    expect(typeof note).toBe('string');
                    expect(note.length).toBeGreaterThan(0);
                });
            });
        });
    });

    describe('Post Type Configuration', () => {
        it('should have all supported post types in postType options', () => {
            const postTypeParam = postOperations.find(param => param.name === 'postType');
            const expectedTypes = ['text', 'photo', 'quote', 'link', 'chat', 'video', 'audio'];

            expect(postTypeParam?.options).toBeDefined();
            const actualTypes = postTypeParam?.options?.map(option =>
                'value' in option ? option.value : ''
            ) || [];

            expectedTypes.forEach(type => {
                expect(actualTypes).toContain(type);
            });
        });

        it('should have conditional field display based on post type', () => {
            const typeSpecificFields = [
                { name: 'title', types: ['text'] },
                { name: 'body', types: ['text'] },
                { name: 'photoUrl', types: ['photo'] },
                { name: 'quote', types: ['quote'] },
                { name: 'source', types: ['quote'] },
                { name: 'url', types: ['link'] },
                { name: 'conversation', types: ['chat'] },
                { name: 'videoUrl', types: ['video'] },
                { name: 'audioUrl', types: ['audio'] },
            ];

            typeSpecificFields.forEach(field => {
                const param = postOperations.find(p => p.name === field.name);
                expect(param?.displayOptions?.show?.postType).toEqual(field.types);
            });
        });

        it('should have proper required field configuration', () => {
            const requiredFields = [
                { name: 'blogName', required: true },
                { name: 'postId', required: true },
                { name: 'postType', required: true },
                { name: 'photoUrl', required: true },
                { name: 'quote', required: true },
                { name: 'url', required: true },
                { name: 'conversation', required: true },
                { name: 'videoUrl', required: true },
                { name: 'audioUrl', required: true },
            ];

            requiredFields.forEach(field => {
                const param = postOperations.find(p => p.name === field.name);
                expect(param?.required).toBe(field.required);
            });
        });
    });

    describe('Parameter Configuration', () => {
        it('should have proper display options for conditional parameters', () => {
            postOperations.forEach(param => {
                if (param.displayOptions?.show) {
                    expect(param.displayOptions.show).toBeDefined();

                    // Check that resource is properly set
                    if (param.displayOptions.show.resource) {
                        expect(param.displayOptions.show.resource).toContain('post');
                    }
                }
            });
        });

        it('should have proper type configurations', () => {
            postOperations.forEach(param => {
                expect(param.type).toBeDefined();
                expect(['string', 'number', 'boolean', 'options', 'collection', 'dateTime'].includes(param.type)).toBe(true);

                // Check collection parameters have options
                if (param.type === 'collection') {
                    expect(param.options).toBeDefined();
                    expect(Array.isArray(param.options)).toBe(true);
                }

                // Check options parameters have options array
                if (param.type === 'options') {
                    expect(param.options).toBeDefined();
                    expect(Array.isArray(param.options)).toBe(true);
                }
            });
        });

        it('should have proper typeOptions for text areas', () => {
            const textAreaFields = ['body', 'caption', 'quote', 'description', 'conversation'];

            textAreaFields.forEach(fieldName => {
                const param = postOperations.find(p => p.name === fieldName);
                if (param) {
                    expect(param.typeOptions?.rows).toBeDefined();
                    expect(typeof param.typeOptions?.rows).toBe('number');
                }
            });
        });
    });
});