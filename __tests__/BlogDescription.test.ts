import { blogOperations, blogOperationOptions, blogValidationRules, blogHelpText } from '../nodes/Tumblr/descriptions/BlogDescription';

describe('BlogDescription', () => {
    describe('blogOperations', () => {
        it('should contain all required blog operation parameters', () => {
            expect(blogOperations).toBeDefined();
            expect(Array.isArray(blogOperations)).toBe(true);
            expect(blogOperations.length).toBeGreaterThan(0);
        });

        it('should have blog name parameter with correct configuration', () => {
            const blogNameParam = blogOperations.find(param => param.name === 'blogName');
            expect(blogNameParam).toBeDefined();
            expect(blogNameParam?.required).toBe(true);
            expect(blogNameParam?.type).toBe('string');
            expect(blogNameParam?.displayOptions?.show?.resource).toContain('blog');
        });

        it('should have additional fields for getInfo operation', () => {
            const additionalFields = blogOperations.find(param => param.name === 'additionalFields');
            expect(additionalFields).toBeDefined();
            expect(additionalFields?.type).toBe('collection');
            expect(additionalFields?.displayOptions?.show?.operation).toContain('getInfo');
        });

        it('should have post filters for getPosts operation', () => {
            const postFilters = blogOperations.find(param => param.name === 'postFilters');
            expect(postFilters).toBeDefined();
            expect(postFilters?.type).toBe('collection');
            expect(postFilters?.displayOptions?.show?.operation).toContain('getPosts');
        });

        it('should have search query for searchPosts operation', () => {
            const searchQuery = blogOperations.find(param => param.name === 'searchQuery');
            expect(searchQuery).toBeDefined();
            expect(searchQuery?.required).toBe(true);
            expect(searchQuery?.type).toBe('string');
            expect(searchQuery?.displayOptions?.show?.operation).toContain('searchPosts');
        });

        it('should have follower options for getFollowers operation', () => {
            const followerOptions = blogOperations.find(param => param.name === 'followerOptions');
            expect(followerOptions).toBeDefined();
            expect(followerOptions?.type).toBe('collection');
            expect(followerOptions?.displayOptions?.show?.operation).toContain('getFollowers');
        });
    });

    describe('blogOperationOptions', () => {
        it('should have correct structure and properties', () => {
            expect(blogOperationOptions).toBeDefined();
            expect(blogOperationOptions.displayName).toBe('Operation');
            expect(blogOperationOptions.name).toBe('operation');
            expect(blogOperationOptions.type).toBe('options');
            expect(blogOperationOptions.displayOptions?.show?.resource).toContain('blog');
        });

        it('should contain all blog operations', () => {
            const expectedOperations = ['getInfo', 'getPosts', 'getFollowers', 'searchPosts'];
            const actualOperations = blogOperationOptions.options?.map(option =>
                'value' in option ? option.value : ''
            ) || [];

            expectedOperations.forEach(operation => {
                expect(actualOperations).toContain(operation);
            });
        });

        it('should have proper descriptions and actions for each operation', () => {
            blogOperationOptions.options?.forEach(option => {
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

    describe('blogValidationRules', () => {
        describe('validateBlogName', () => {
            it('should accept valid blog names', () => {
                const validNames = [
                    'myblog',
                    'my-blog',
                    'my_blog',
                    'myblog123',
                    'myblog.tumblr.com',
                    'my-blog-123.tumblr.com',
                ];

                validNames.forEach(name => {
                    expect(blogValidationRules.validateBlogName(name)).toBeNull();
                });
            });

            it('should reject invalid blog names', () => {
                const invalidNames = [
                    '',
                    '   ',
                    'my blog', // spaces
                    'my@blog', // special characters
                    'my#blog', // special characters
                    'a'.repeat(101), // too long
                ];

                invalidNames.forEach(name => {
                    expect(blogValidationRules.validateBlogName(name)).not.toBeNull();
                });
            });

            it('should return specific error messages', () => {
                expect(blogValidationRules.validateBlogName('')).toContain('required');
                expect(blogValidationRules.validateBlogName('my@blog')).toContain('invalid characters');
                expect(blogValidationRules.validateBlogName('a'.repeat(101))).toContain('too long');
            });
        });

        describe('validatePostLimit', () => {
            it('should accept valid limits', () => {
                const validLimits = [1, 10, 20, 50];
                validLimits.forEach(limit => {
                    expect(blogValidationRules.validatePostLimit(limit)).toBeNull();
                });
            });

            it('should reject invalid limits', () => {
                expect(blogValidationRules.validatePostLimit(0)).toContain('at least 1');
                expect(blogValidationRules.validatePostLimit(-1)).toContain('at least 1');
                expect(blogValidationRules.validatePostLimit(51)).toContain('cannot exceed 50');
            });
        });

        describe('validateOffset', () => {
            it('should accept valid offsets', () => {
                const validOffsets = [0, 10, 100, 1000];
                validOffsets.forEach(offset => {
                    expect(blogValidationRules.validateOffset(offset)).toBeNull();
                });
            });

            it('should reject negative offsets', () => {
                expect(blogValidationRules.validateOffset(-1)).toContain('cannot be negative');
                expect(blogValidationRules.validateOffset(-10)).toContain('cannot be negative');
            });
        });

        describe('validateSearchQuery', () => {
            it('should accept valid search queries', () => {
                const validQueries = [
                    'photography',
                    'my search query',
                    'a'.repeat(500), // max length
                ];

                validQueries.forEach(query => {
                    expect(blogValidationRules.validateSearchQuery(query)).toBeNull();
                });
            });

            it('should reject invalid search queries', () => {
                expect(blogValidationRules.validateSearchQuery('')).toContain('required');
                expect(blogValidationRules.validateSearchQuery('a')).toContain('at least 2 characters');
                expect(blogValidationRules.validateSearchQuery('a'.repeat(501))).toContain('too long');
            });
        });
    });

    describe('blogHelpText', () => {
        it('should contain help text for all operations', () => {
            const expectedOperations = ['getInfo', 'getPosts', 'getFollowers', 'searchPosts'];
            expectedOperations.forEach(operation => {
                expect(blogHelpText[operation as keyof typeof blogHelpText]).toBeDefined();
            });
        });

        it('should have proper structure for each help text entry', () => {
            Object.values(blogHelpText).forEach(helpEntry => {
                expect(helpEntry.description).toBeDefined();
                expect(helpEntry.examples).toBeDefined();
                expect(helpEntry.notes).toBeDefined();
                expect(Array.isArray(helpEntry.examples)).toBe(true);
                expect(Array.isArray(helpEntry.notes)).toBe(true);
                expect(typeof helpEntry.description).toBe('string');
            });
        });

        it('should have non-empty examples and notes', () => {
            Object.values(blogHelpText).forEach(helpEntry => {
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

    describe('Parameter Configuration', () => {
        it('should have proper display options for conditional parameters', () => {
            blogOperations.forEach(param => {
                if (param.displayOptions?.show) {
                    expect(param.displayOptions.show).toBeDefined();

                    // Check that resource is properly set
                    if (param.displayOptions.show.resource) {
                        expect(param.displayOptions.show.resource).toContain('blog');
                    }

                    // Check that operation-specific parameters have operation conditions
                    if (param.displayOptions.show.operation) {
                        expect(Array.isArray(param.displayOptions.show.operation)).toBe(true);
                        expect(param.displayOptions.show.operation.length).toBeGreaterThan(0);
                    }
                }
            });
        });

        it('should have proper type configurations', () => {
            blogOperations.forEach(param => {
                expect(param.type).toBeDefined();
                expect(['string', 'number', 'boolean', 'options', 'collection'].includes(param.type)).toBe(true);

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

        it('should have proper validation constraints for numeric parameters', () => {
            blogOperations.forEach(param => {
                if (param.type === 'number' && param.typeOptions) {
                    // Check that min/max values are properly set
                    if (param.typeOptions.minValue !== undefined) {
                        expect(typeof param.typeOptions.minValue).toBe('number');
                    }
                    if (param.typeOptions.maxValue !== undefined) {
                        expect(typeof param.typeOptions.maxValue).toBe('number');
                    }

                    // Check that min <= max if both are set
                    if (param.typeOptions.minValue !== undefined && param.typeOptions.maxValue !== undefined) {
                        expect(param.typeOptions.minValue).toBeLessThanOrEqual(param.typeOptions.maxValue);
                    }
                }
            });
        });
    });
});