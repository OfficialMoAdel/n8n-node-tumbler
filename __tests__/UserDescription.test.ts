import { userOperations, userOperationOptions, userValidationRules, userHelpText } from '../nodes/Tumblr/descriptions/UserDescription';

describe('UserDescription', () => {
    describe('userOperations', () => {
        it('should contain all required user operation parameters', () => {
            expect(userOperations).toBeDefined();
            expect(Array.isArray(userOperations)).toBe(true);
            expect(userOperations.length).toBeGreaterThan(0);
        });

        it('should have user info options for getInfo operation', () => {
            const userInfoOptions = userOperations.find(param => param.name === 'userInfoOptions');
            expect(userInfoOptions).toBeDefined();
            expect(userInfoOptions?.type).toBe('collection');
            expect(userInfoOptions?.displayOptions?.show?.operation).toContain('getInfo');
        });

        it('should have dashboard options for getDashboard operation', () => {
            const dashboardOptions = userOperations.find(param => param.name === 'dashboardOptions');
            expect(dashboardOptions).toBeDefined();
            expect(dashboardOptions?.type).toBe('collection');
            expect(dashboardOptions?.displayOptions?.show?.operation).toContain('getDashboard');
        });

        it('should have likes options for getLikes operation', () => {
            const likesOptions = userOperations.find(param => param.name === 'likesOptions');
            expect(likesOptions).toBeDefined();
            expect(likesOptions?.type).toBe('collection');
            expect(likesOptions?.displayOptions?.show?.operation).toContain('getLikes');
        });

        it('should have following options for getFollowing operation', () => {
            const followingOptions = userOperations.find(param => param.name === 'followingOptions');
            expect(followingOptions).toBeDefined();
            expect(followingOptions?.type).toBe('collection');
            expect(followingOptions?.displayOptions?.show?.operation).toContain('getFollowing');
        });

        it('should have blog name parameter for follow/unfollow operations', () => {
            const blogNameParam = userOperations.find(param => param.name === 'blogName');
            expect(blogNameParam).toBeDefined();
            expect(blogNameParam?.required).toBe(true);
            expect(blogNameParam?.type).toBe('string');
            expect(blogNameParam?.displayOptions?.show?.operation).toEqual(['follow', 'unfollow']);
        });

        it('should have post ID and reblog key for social interactions', () => {
            const postIdParam = userOperations.find(param => param.name === 'postId');
            expect(postIdParam).toBeDefined();
            expect(postIdParam?.required).toBe(true);
            expect(postIdParam?.displayOptions?.show?.operation).toEqual(['like', 'unlike', 'reblog']);

            const reblogKeyParam = userOperations.find(param => param.name === 'reblogKey');
            expect(reblogKeyParam).toBeDefined();
            expect(reblogKeyParam?.required).toBe(true);
            expect(reblogKeyParam?.displayOptions?.show?.operation).toEqual(['like', 'unlike', 'reblog']);
        });

        it('should have reblog options for reblog operation', () => {
            const reblogOptions = userOperations.find(param => param.name === 'reblogOptions');
            expect(reblogOptions).toBeDefined();
            expect(reblogOptions?.type).toBe('collection');
            expect(reblogOptions?.displayOptions?.show?.operation).toContain('reblog');
        });

        it('should have batch parameters for batch operations', () => {
            const batchItems = userOperations.find(param => param.name === 'batchItems');
            expect(batchItems).toBeDefined();
            expect(batchItems?.type).toBe('string');
            expect(batchItems?.displayOptions?.show?.operation).toEqual(['batchLike', 'batchUnlike', 'batchFollow', 'batchUnfollow']);

            const batchOptions = userOperations.find(param => param.name === 'batchOptions');
            expect(batchOptions).toBeDefined();
            expect(batchOptions?.type).toBe('collection');
            expect(batchOptions?.displayOptions?.show?.operation).toEqual(['batchLike', 'batchUnlike', 'batchFollow', 'batchUnfollow']);
        });
    });

    describe('userOperationOptions', () => {
        it('should have correct structure and properties', () => {
            expect(userOperationOptions).toBeDefined();
            expect(userOperationOptions.displayName).toBe('Operation');
            expect(userOperationOptions.name).toBe('operation');
            expect(userOperationOptions.type).toBe('options');
            expect(userOperationOptions.displayOptions?.show?.resource).toContain('user');
        });

        it('should contain all user operations', () => {
            const expectedOperations = [
                'getInfo', 'getDashboard', 'getLikes', 'getFollowing',
                'follow', 'unfollow', 'like', 'unlike', 'reblog',
                'batchLike', 'batchUnlike', 'batchFollow', 'batchUnfollow'
            ];
            const actualOperations = userOperationOptions.options?.map(option =>
                'value' in option ? option.value : ''
            ) || [];

            expectedOperations.forEach(operation => {
                expect(actualOperations).toContain(operation);
            });
        });

        it('should have proper descriptions and actions for each operation', () => {
            userOperationOptions.options?.forEach(option => {
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

    describe('userValidationRules', () => {
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
                    expect(userValidationRules.validateBlogName(name)).toBeNull();
                });
            });

            it('should reject invalid blog names', () => {
                const invalidNames = [
                    '',
                    '   ',
                    'my blog', // spaces
                    'my@blog', // special characters
                    'my#blog', // special characters
                ];

                invalidNames.forEach(name => {
                    expect(userValidationRules.validateBlogName(name)).not.toBeNull();
                });
            });

            it('should return specific error messages', () => {
                expect(userValidationRules.validateBlogName('')).toContain('required');
                expect(userValidationRules.validateBlogName('my@blog')).toContain('invalid characters');
            });
        });

        describe('validateSocialInteraction', () => {
            it('should accept valid post ID and reblog key', () => {
                expect(userValidationRules.validateSocialInteraction('123456789', 'abcdef123456')).toBeNull();
                expect(userValidationRules.validateSocialInteraction('1', 'validkey')).toBeNull();
            });

            it('should reject invalid post IDs', () => {
                expect(userValidationRules.validateSocialInteraction('', 'validkey')).toContain('Post ID is required');
                expect(userValidationRules.validateSocialInteraction('abc123', 'validkey')).toContain('numeric');
            });

            it('should reject invalid reblog keys', () => {
                expect(userValidationRules.validateSocialInteraction('123', '')).toContain('Reblog key is required');
                expect(userValidationRules.validateSocialInteraction('123', 'short')).toContain('too short');
            });
        });

        describe('validateBatchItems', () => {
            it('should accept valid post batch items', () => {
                const validPostItems = [
                    '123456:abcdef123456',
                    '123456:abcdef123456, 789012:ghijkl789012',
                ];

                validPostItems.forEach(items => {
                    expect(userValidationRules.validateBatchItems(items, 'post')).toBeNull();
                });
            });

            it('should accept valid blog batch items', () => {
                const validBlogItems = [
                    'myblog',
                    'myblog, otherblog.tumblr.com',
                    'blog1.tumblr.com, blog2, blog3.tumblr.com',
                ];

                validBlogItems.forEach(items => {
                    expect(userValidationRules.validateBatchItems(items, 'blog')).toBeNull();
                });
            });

            it('should reject empty batch items', () => {
                expect(userValidationRules.validateBatchItems('', 'post')).toContain('required');
                expect(userValidationRules.validateBatchItems('   ', 'blog')).toContain('required');
            });

            it('should reject too many items', () => {
                const tooManyItems = Array(51).fill('123456:abcdef').join(', ');
                expect(userValidationRules.validateBatchItems(tooManyItems, 'post')).toContain('Maximum 50 items');
            });

            it('should reject invalid post format', () => {
                const invalidPostItems = [
                    '123456', // missing reblog key
                    'abc:def', // invalid post ID
                    '123:short', // reblog key too short
                ];

                invalidPostItems.forEach(items => {
                    expect(userValidationRules.validateBatchItems(items, 'post')).toContain('postId:reblogKey');
                });
            });

            it('should reject invalid blog format', () => {
                const invalidBlogItems = [
                    'my blog', // spaces
                    'my@blog', // special characters
                ];

                invalidBlogItems.forEach(items => {
                    expect(userValidationRules.validateBatchItems(items, 'blog')).toContain('Invalid blog name');
                });
            });
        });

        describe('validatePagination', () => {
            it('should accept valid pagination parameters', () => {
                expect(userValidationRules.validatePagination(20, 0)).toBeNull();
                expect(userValidationRules.validatePagination(50, 100)).toBeNull();
                expect(userValidationRules.validatePagination(1, 0)).toBeNull();
            });

            it('should reject invalid limits', () => {
                expect(userValidationRules.validatePagination(0, 0)).toContain('at least 1');
                expect(userValidationRules.validatePagination(51, 0)).toContain('cannot exceed 50');
            });

            it('should reject negative offsets', () => {
                expect(userValidationRules.validatePagination(20, -1)).toContain('cannot be negative');
            });
        });

        describe('validateTimestamp', () => {
            it('should accept valid timestamps', () => {
                const now = Math.floor(Date.now() / 1000);
                expect(userValidationRules.validateTimestamp(now, 'Test')).toBeNull();
                expect(userValidationRules.validateTimestamp(0, 'Test')).toBeNull();
            });

            it('should reject negative timestamps', () => {
                expect(userValidationRules.validateTimestamp(-1, 'Test')).toContain('cannot be negative');
            });

            it('should reject timestamps too far in future', () => {
                const farFuture = Math.floor(Date.now() / 1000) + (2 * 365 * 24 * 60 * 60); // 2 years from now
                expect(userValidationRules.validateTimestamp(farFuture, 'Test')).toContain('too far in the future');
            });

            it('should use custom field name in error message', () => {
                const error = userValidationRules.validateTimestamp(-1, 'Custom Field');
                expect(error).toContain('Custom Field');
            });
        });
    });

    describe('userHelpText', () => {
        it('should contain help text for all operations', () => {
            const expectedOperations = [
                'getInfo', 'getDashboard', 'getLikes', 'getFollowing',
                'follow', 'unfollow', 'like', 'unlike', 'reblog',
                'batchLike', 'batchUnlike', 'batchFollow', 'batchUnfollow'
            ];
            expectedOperations.forEach(operation => {
                expect(userHelpText[operation as keyof typeof userHelpText]).toBeDefined();
            });
        });

        it('should have proper structure for each help text entry', () => {
            Object.values(userHelpText).forEach(helpEntry => {
                expect(helpEntry.description).toBeDefined();
                expect(helpEntry.examples).toBeDefined();
                expect(helpEntry.notes).toBeDefined();
                expect(Array.isArray(helpEntry.examples)).toBe(true);
                expect(Array.isArray(helpEntry.notes)).toBe(true);
                expect(typeof helpEntry.description).toBe('string');
            });
        });

        it('should have non-empty examples and notes', () => {
            Object.values(userHelpText).forEach(helpEntry => {
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
            userOperations.forEach(param => {
                if (param.displayOptions?.show) {
                    expect(param.displayOptions.show).toBeDefined();

                    // Check that resource is properly set
                    if (param.displayOptions.show.resource) {
                        expect(param.displayOptions.show.resource).toContain('user');
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
            userOperations.forEach(param => {
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
            userOperations.forEach(param => {
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

        it('should have proper required field configuration', () => {
            const requiredFields = [
                { name: 'blogName', operations: ['follow', 'unfollow'] },
                { name: 'postId', operations: ['like', 'unlike', 'reblog'] },
                { name: 'reblogKey', operations: ['like', 'unlike', 'reblog'] },
            ];

            requiredFields.forEach(field => {
                const param = userOperations.find(p => p.name === field.name);
                expect(param?.required).toBe(true);
                expect(param?.displayOptions?.show?.operation).toEqual(field.operations);
            });
        });
    });

    describe('Collection Options', () => {
        it('should have proper options in collection parameters', () => {
            const collectionParams = userOperations.filter(param => param.type === 'collection');

            collectionParams.forEach(param => {
                expect(param.options).toBeDefined();
                expect(Array.isArray(param.options)).toBe(true);
                expect(param.options!.length).toBeGreaterThan(0);

                param.options!.forEach(option => {
                    if ('displayName' in option && 'type' in option) {
                        expect(option.displayName).toBeDefined();
                        expect(option.name).toBeDefined();
                        expect(option.type).toBeDefined();
                        expect(typeof option.displayName).toBe('string');
                        expect(typeof option.name).toBe('string');
                    }
                });
            });
        });

        it('should have proper default values for collection options', () => {
            const collectionParams = userOperations.filter(param => param.type === 'collection');

            collectionParams.forEach(param => {
                param.options!.forEach(option => {
                    if ('default' in option) {
                        expect(option.default).toBeDefined();
                    }
                });
            });
        });
    });
});