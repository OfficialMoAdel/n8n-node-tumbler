import { queueOperations, queueOperationOptions, draftOperationOptions, queueValidationRules, queueHelpText } from '../nodes/Tumblr/descriptions/QueueDescription';

describe('QueueDescription', () => {
    describe('queueOperations', () => {
        it('should contain all required queue operation parameters', () => {
            expect(queueOperations).toBeDefined();
            expect(Array.isArray(queueOperations)).toBe(true);
            expect(queueOperations.length).toBeGreaterThan(0);
        });

        it('should have blog name parameter with correct configuration', () => {
            const blogNameParam = queueOperations.find(param => param.name === 'blogName');
            expect(blogNameParam).toBeDefined();
            expect(blogNameParam?.required).toBe(true);
            expect(blogNameParam?.type).toBe('string');
            expect(blogNameParam?.displayOptions?.show?.resource).toEqual(['queue', 'draft']);
        });

        it('should have post ID parameter for specific operations', () => {
            const postIdParam = queueOperations.find(param => param.name === 'postId');
            expect(postIdParam).toBeDefined();
            expect(postIdParam?.required).toBe(true);
            expect(postIdParam?.type).toBe('string');
            expect(postIdParam?.displayOptions?.show?.operation).toEqual(['remove', 'update', 'publish', 'get']);
        });

        it('should have post type parameter for add/create operations', () => {
            const postTypeParam = queueOperations.find(param => param.name === 'postType');
            expect(postTypeParam).toBeDefined();
            expect(postTypeParam?.required).toBe(true);
            expect(postTypeParam?.type).toBe('options');
            expect(postTypeParam?.displayOptions?.show?.operation).toEqual(['add', 'create']);
        });

        it('should have type-specific content fields', () => {
            // Text post fields
            const titleParam = queueOperations.find(param => param.name === 'title');
            expect(titleParam?.displayOptions?.show?.postType).toContain('text');

            const bodyParam = queueOperations.find(param => param.name === 'body');
            expect(bodyParam?.displayOptions?.show?.postType).toContain('text');

            // Photo post fields
            const photoUrlParam = queueOperations.find(param => param.name === 'photoUrl');
            expect(photoUrlParam?.displayOptions?.show?.postType).toContain('photo');

            // Quote post fields
            const quoteParam = queueOperations.find(param => param.name === 'quote');
            expect(quoteParam?.displayOptions?.show?.postType).toContain('quote');
        });

        it('should have queue-specific scheduling parameters', () => {
            const scheduleTimeParam = queueOperations.find(param => param.name === 'scheduleTime');
            expect(scheduleTimeParam).toBeDefined();
            expect(scheduleTimeParam?.type).toBe('dateTime');
            expect(scheduleTimeParam?.displayOptions?.show?.resource).toContain('queue');

            const queuePositionParam = queueOperations.find(param => param.name === 'queuePosition');
            expect(queuePositionParam).toBeDefined();
            expect(queuePositionParam?.type).toBe('number');
            expect(queuePositionParam?.displayOptions?.show?.operation).toEqual(['add', 'reorder']);
        });

        it('should have common post parameters', () => {
            const tagsParam = queueOperations.find(param => param.name === 'tags');
            expect(tagsParam).toBeDefined();
            expect(tagsParam?.displayOptions?.show?.operation).toEqual(['add', 'create', 'update']);

            const additionalOptions = queueOperations.find(param => param.name === 'additionalOptions');
            expect(additionalOptions).toBeDefined();
            expect(additionalOptions?.type).toBe('collection');
        });

        it('should have list options for get operations', () => {
            const listOptions = queueOperations.find(param => param.name === 'listOptions');
            expect(listOptions).toBeDefined();
            expect(listOptions?.type).toBe('collection');
            expect(listOptions?.displayOptions?.show?.operation).toEqual(['get', 'getAll']);
        });

        it('should have reorder parameters', () => {
            const postIdsParam = queueOperations.find(param => param.name === 'postIds');
            expect(postIdsParam).toBeDefined();
            expect(postIdsParam?.type).toBe('string');
            expect(postIdsParam?.displayOptions?.show?.operation).toContain('reorder');
        });

        it('should have publish options for draft operations', () => {
            const publishOptions = queueOperations.find(param => param.name === 'publishOptions');
            expect(publishOptions).toBeDefined();
            expect(publishOptions?.type).toBe('collection');
            expect(publishOptions?.displayOptions?.show?.operation).toContain('publish');
        });
    });

    describe('queueOperationOptions', () => {
        it('should have correct structure and properties', () => {
            expect(queueOperationOptions).toBeDefined();
            expect(queueOperationOptions.displayName).toBe('Operation');
            expect(queueOperationOptions.name).toBe('operation');
            expect(queueOperationOptions.type).toBe('options');
            expect(queueOperationOptions.displayOptions?.show?.resource).toContain('queue');
        });

        it('should contain all queue operations', () => {
            const expectedOperations = ['add', 'get', 'remove', 'update', 'reorder', 'getStats'];
            const actualOperations = queueOperationOptions.options?.map(option =>
                'value' in option ? option.value : ''
            ) || [];

            expectedOperations.forEach(operation => {
                expect(actualOperations).toContain(operation);
            });
        });

        it('should have proper descriptions and actions for each operation', () => {
            queueOperationOptions.options?.forEach(option => {
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

    describe('draftOperationOptions', () => {
        it('should have correct structure and properties', () => {
            expect(draftOperationOptions).toBeDefined();
            expect(draftOperationOptions.displayName).toBe('Operation');
            expect(draftOperationOptions.name).toBe('operation');
            expect(draftOperationOptions.type).toBe('options');
            expect(draftOperationOptions.displayOptions?.show?.resource).toContain('draft');
        });

        it('should contain all draft operations', () => {
            const expectedOperations = ['create', 'getAll', 'get', 'update', 'remove', 'publish'];
            const actualOperations = draftOperationOptions.options?.map(option =>
                'value' in option ? option.value : ''
            ) || [];

            expectedOperations.forEach(operation => {
                expect(actualOperations).toContain(operation);
            });
        });

        it('should have proper descriptions and actions for each operation', () => {
            draftOperationOptions.options?.forEach(option => {
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

    describe('queueValidationRules', () => {
        describe('validatePostId', () => {
            it('should accept valid post IDs', () => {
                const validIds = ['123456789', '1', '999999999999'];
                validIds.forEach(id => {
                    expect(queueValidationRules.validatePostId(id)).toBeNull();
                });
            });

            it('should reject invalid post IDs', () => {
                const invalidIds = ['', '   ', 'abc123', '123abc', 'not-a-number'];
                invalidIds.forEach(id => {
                    expect(queueValidationRules.validatePostId(id)).not.toBeNull();
                });
            });

            it('should return specific error messages', () => {
                expect(queueValidationRules.validatePostId('')).toContain('required');
                expect(queueValidationRules.validatePostId('abc')).toContain('numeric');
            });
        });

        describe('validateQueuePosition', () => {
            it('should accept valid queue positions', () => {
                const validPositions = [0, 1, 10, 100, 1000];
                validPositions.forEach(position => {
                    expect(queueValidationRules.validateQueuePosition(position)).toBeNull();
                });
            });

            it('should reject invalid queue positions', () => {
                expect(queueValidationRules.validateQueuePosition(-1)).toContain('cannot be negative');
                expect(queueValidationRules.validateQueuePosition(1001)).toContain('unreasonably high');
            });
        });

        describe('validateScheduleTime', () => {
            it('should accept valid schedule times', () => {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 1);

                expect(queueValidationRules.validateScheduleTime('')).toBeNull(); // Optional
                expect(queueValidationRules.validateScheduleTime(futureDate.toISOString())).toBeNull();
            });

            it('should reject invalid schedule times', () => {
                const pastDate = new Date();
                pastDate.setDate(pastDate.getDate() - 1);

                const farFutureDate = new Date();
                farFutureDate.setFullYear(farFutureDate.getFullYear() + 2);

                expect(queueValidationRules.validateScheduleTime('invalid-date')).toContain('Invalid date');
                expect(queueValidationRules.validateScheduleTime(pastDate.toISOString())).toContain('cannot be in the past');
                expect(queueValidationRules.validateScheduleTime(farFutureDate.toISOString())).toContain('more than 1 year');
            });
        });

        describe('validatePostIdsList', () => {
            it('should accept valid post IDs lists', () => {
                const validLists = [
                    '123456789',
                    '123456789, 987654321',
                    '1, 2, 3, 4, 5',
                ];

                validLists.forEach(list => {
                    expect(queueValidationRules.validatePostIdsList(list)).toBeNull();
                });
            });

            it('should reject invalid post IDs lists', () => {
                expect(queueValidationRules.validatePostIdsList('')).toContain('required');
                expect(queueValidationRules.validatePostIdsList('abc, 123')).toContain('numeric values');
                expect(queueValidationRules.validatePostIdsList('123, 123')).toContain('Duplicate');
            });

            it('should reject too many post IDs', () => {
                const tooManyIds = Array(101).fill('123').join(', ');
                expect(queueValidationRules.validatePostIdsList(tooManyIds)).toContain('Maximum 100');
            });
        });

        describe('validatePostContent', () => {
            it('should validate text post content', () => {
                expect(queueValidationRules.validatePostContent('text', { title: 'Test' })).toBeNull();
                expect(queueValidationRules.validatePostContent('text', { body: 'Content' })).toBeNull();
                expect(queueValidationRules.validatePostContent('text', {})).toContain('require either');
            });

            it('should validate photo post content', () => {
                expect(queueValidationRules.validatePostContent('photo', { photoUrl: 'http://example.com/image.jpg' })).toBeNull();
                expect(queueValidationRules.validatePostContent('photo', {})).toContain('require a photo URL');
            });

            it('should validate quote post content', () => {
                expect(queueValidationRules.validatePostContent('quote', { quote: 'Test quote' })).toBeNull();
                expect(queueValidationRules.validatePostContent('quote', {})).toContain('require quote text');
            });

            it('should validate link post content', () => {
                expect(queueValidationRules.validatePostContent('link', { url: 'http://example.com' })).toBeNull();
                expect(queueValidationRules.validatePostContent('link', {})).toContain('require a URL');
            });

            it('should validate chat post content', () => {
                expect(queueValidationRules.validatePostContent('chat', { conversation: 'A: Hello\nB: Hi' })).toBeNull();
                expect(queueValidationRules.validatePostContent('chat', {})).toContain('require conversation');
            });

            it('should validate video post content', () => {
                expect(queueValidationRules.validatePostContent('video', { videoUrl: 'http://example.com/video.mp4' })).toBeNull();
                expect(queueValidationRules.validatePostContent('video', {})).toContain('require a video URL');
            });

            it('should validate audio post content', () => {
                expect(queueValidationRules.validatePostContent('audio', { audioUrl: 'http://example.com/audio.mp3' })).toBeNull();
                expect(queueValidationRules.validatePostContent('audio', {})).toContain('require an audio URL');
            });
        });
    });

    describe('queueHelpText', () => {
        it('should contain help text for all queue operations', () => {
            const expectedQueueOperations = ['add', 'get', 'remove', 'update', 'reorder', 'getStats'];
            expectedQueueOperations.forEach(operation => {
                expect(queueHelpText.queue[operation as keyof typeof queueHelpText.queue]).toBeDefined();
            });
        });

        it('should contain help text for all draft operations', () => {
            const expectedDraftOperations = ['create', 'getAll', 'get', 'update', 'remove', 'publish'];
            expectedDraftOperations.forEach(operation => {
                expect(queueHelpText.draft[operation as keyof typeof queueHelpText.draft]).toBeDefined();
            });
        });

        it('should have proper structure for each help text entry', () => {
            const allHelpEntries = [
                ...Object.values(queueHelpText.queue),
                ...Object.values(queueHelpText.draft),
            ];

            allHelpEntries.forEach(helpEntry => {
                expect(helpEntry.description).toBeDefined();
                expect(helpEntry.examples).toBeDefined();
                expect(helpEntry.notes).toBeDefined();
                expect(Array.isArray(helpEntry.examples)).toBe(true);
                expect(Array.isArray(helpEntry.notes)).toBe(true);
                expect(typeof helpEntry.description).toBe('string');
            });
        });

        it('should have non-empty examples and notes', () => {
            const allHelpEntries = [
                ...Object.values(queueHelpText.queue),
                ...Object.values(queueHelpText.draft),
            ];

            allHelpEntries.forEach(helpEntry => {
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
            queueOperations.forEach(param => {
                if (param.displayOptions?.show) {
                    expect(param.displayOptions.show).toBeDefined();

                    // Check that resource is properly set
                    if (param.displayOptions.show.resource) {
                        const validResources = ['queue', 'draft'];
                        const paramResources = param.displayOptions.show.resource;
                        paramResources.forEach(resource => {
                            expect(validResources).toContain(resource);
                        });
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
            queueOperations.forEach(param => {
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

        it('should have proper validation constraints for numeric parameters', () => {
            queueOperations.forEach(param => {
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
                const param = queueOperations.find(p => p.name === field.name);
                expect(param?.required).toBe(field.required);
            });
        });
    });

    describe('Post Type Configuration', () => {
        it('should have all supported post types in postType options', () => {
            const postTypeParam = queueOperations.find(param => param.name === 'postType');
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
                const param = queueOperations.find(p => p.name === field.name);
                expect(param?.displayOptions?.show?.postType).toEqual(field.types);
            });
        });
    });
});