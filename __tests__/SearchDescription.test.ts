import { searchOperations, searchFields } from '../nodes/Tumblr/descriptions/SearchDescription';

describe('SearchDescription', () => {
    describe('searchOperations', () => {
        it('should have correct structure', () => {
            expect(searchOperations).toHaveLength(1);

            const operationField = searchOperations[0];
            expect(operationField.displayName).toBe('Operation');
            expect(operationField.name).toBe('operation');
            expect(operationField.type).toBe('options');
            expect(operationField.noDataExpression).toBe(true);
            expect(operationField.default).toBe('searchByTag');
        });

        it('should have all required operations', () => {
            const operationField = searchOperations[0];
            const operations = operationField.options?.map((op: any) => op.value) || [];

            const expectedOperations = [
                'searchByTag',
                'getTagInfo',
                'getTagSuggestions',
                'getTrendingTags',
                'searchByKeyword',
                'advancedSearch',
                'getTrending',
                'searchUserContent',
            ];

            expect(operations).toEqual(expectedOperations);
        });

        it('should have correct display options', () => {
            const operationField = searchOperations[0];
            expect(operationField.displayOptions).toEqual({
                show: {
                    resource: ['search'],
                },
            });
        });

        it('should have proper operation descriptions', () => {
            const operationField = searchOperations[0];
            const operations = operationField.options || [];

            operations.forEach((operation: any) => {
                expect(operation).toHaveProperty('name');
                expect(operation).toHaveProperty('value');
                expect(operation).toHaveProperty('description');
                expect(operation).toHaveProperty('action');
                expect(typeof operation.name).toBe('string');
                expect(typeof operation.value).toBe('string');
                expect(typeof operation.description).toBe('string');
                expect(typeof operation.action).toBe('string');
            });
        });
    });

    describe('searchFields', () => {
        it('should have all required field types', () => {
            const fieldNames = searchFields.map(field => field.name);

            const expectedFields = [
                'tag',
                'options',
                'partialTag',
                'limit',
                'keyword',
                'searchParams',
                'searchParams', // Advanced search
                'options', // Trending options
                'searchParams', // User content search
            ];

            // Check that all expected field types are present
            expect(fieldNames).toContain('tag');
            expect(fieldNames).toContain('partialTag');
            expect(fieldNames).toContain('keyword');
            expect(fieldNames).toContain('limit');
            expect(fieldNames).toContain('options');
            expect(fieldNames).toContain('searchParams');
        });

        it('should have correct tag field configuration', () => {
            const tagField = searchFields.find(field =>
                field.name === 'tag' &&
                field.displayOptions?.show?.operation?.includes('searchByTag')
            );

            expect(tagField).toBeDefined();
            expect(tagField?.displayName).toBe('Tag');
            expect(tagField?.type).toBe('string');
            expect(tagField?.required).toBe(true);
            expect(tagField?.default).toBe('');
            expect(tagField?.description).toBe('The tag to search for');
        });

        it('should have correct partial tag field configuration', () => {
            const partialTagField = searchFields.find(field =>
                field.name === 'partialTag'
            );

            expect(partialTagField).toBeDefined();
            expect(partialTagField?.displayName).toBe('Partial Tag');
            expect(partialTagField?.type).toBe('string');
            expect(partialTagField?.required).toBe(true);
            expect(partialTagField?.displayOptions?.show?.operation).toContain('getTagSuggestions');
        });

        it('should have correct keyword field configuration', () => {
            const keywordField = searchFields.find(field =>
                field.name === 'keyword'
            );

            expect(keywordField).toBeDefined();
            expect(keywordField?.displayName).toBe('Keyword');
            expect(keywordField?.type).toBe('string');
            expect(keywordField?.required).toBe(true);
            expect(keywordField?.displayOptions?.show?.operation).toContain('searchByKeyword');
        });

        it('should have correct limit field configurations', () => {
            const limitFields = searchFields.filter(field => field.name === 'limit');

            expect(limitFields.length).toBeGreaterThan(0);

            limitFields.forEach(field => {
                expect(field.type).toBe('number');
                expect(field.typeOptions?.minValue).toBe(1);
                expect(typeof field.default).toBe('number');
            });
        });

        it('should have search by tag options collection', () => {
            const tagOptionsField = searchFields.find(field =>
                field.name === 'options' &&
                field.displayOptions?.show?.operation?.includes('searchByTag')
            );

            expect(tagOptionsField).toBeDefined();
            expect(tagOptionsField?.type).toBe('collection');
            expect(tagOptionsField?.options).toBeDefined();

            const options = tagOptionsField?.options || [];
            const optionNames = options.map((opt: any) => opt.name);

            expect(optionNames).toContain('limit');
            expect(optionNames).toContain('before');
            expect(optionNames).toContain('filter');
        });

        it('should have keyword search options collection', () => {
            const keywordOptionsField = searchFields.find(field =>
                field.name === 'options' &&
                field.displayOptions?.show?.operation?.includes('searchByKeyword')
            );

            expect(keywordOptionsField).toBeDefined();
            expect(keywordOptionsField?.type).toBe('collection');
            expect(keywordOptionsField?.options).toBeDefined();

            const options = keywordOptionsField?.options || [];
            const optionNames = options.map((opt: any) => opt.name);

            expect(optionNames).toContain('limit');
            expect(optionNames).toContain('type');
            expect(optionNames).toContain('sortBy');
            expect(optionNames).toContain('sortOrder');
            expect(optionNames).toContain('page');
            expect(optionNames).toContain('pageSize');
        });

        it('should have advanced search parameters collection', () => {
            const advancedSearchField = searchFields.find(field =>
                field.name === 'searchParams' &&
                field.displayOptions?.show?.operation?.includes('advancedSearch')
            );

            expect(advancedSearchField).toBeDefined();
            expect(advancedSearchField?.type).toBe('collection');
            expect(advancedSearchField?.options).toBeDefined();

            const options = advancedSearchField?.options || [];
            const optionNames = options.map((opt: any) => opt.name);

            expect(optionNames).toContain('keyword');
            expect(optionNames).toContain('tags');
            expect(optionNames).toContain('postType');
            expect(optionNames).toContain('dateFrom');
            expect(optionNames).toContain('dateTo');
            expect(optionNames).toContain('minNotes');
            expect(optionNames).toContain('maxNotes');
            expect(optionNames).toContain('limit');
            expect(optionNames).toContain('sortBy');
            expect(optionNames).toContain('sortOrder');
        });

        it('should have trending options collection', () => {
            const trendingOptionsField = searchFields.find(field =>
                field.name === 'options' &&
                field.displayOptions?.show?.operation?.includes('getTrending')
            );

            expect(trendingOptionsField).toBeDefined();
            expect(trendingOptionsField?.type).toBe('collection');
            expect(trendingOptionsField?.options).toBeDefined();

            const options = trendingOptionsField?.options || [];
            const optionNames = options.map((opt: any) => opt.name);

            expect(optionNames).toContain('timeframe');
            expect(optionNames).toContain('limit');
            expect(optionNames).toContain('includeContent');
            expect(optionNames).toContain('includeTags');
            expect(optionNames).toContain('includeTopics');
        });

        it('should have user content search parameters collection', () => {
            const userContentField = searchFields.find(field =>
                field.name === 'searchParams' &&
                field.displayOptions?.show?.operation?.includes('searchUserContent')
            );

            expect(userContentField).toBeDefined();
            expect(userContentField?.type).toBe('collection');
            expect(userContentField?.options).toBeDefined();

            const options = userContentField?.options || [];
            const optionNames = options.map((opt: any) => opt.name);

            expect(optionNames).toContain('blogName');
            expect(optionNames).toContain('keyword');
            expect(optionNames).toContain('tags');
            expect(optionNames).toContain('postType');
            expect(optionNames).toContain('dateFrom');
            expect(optionNames).toContain('dateTo');
            expect(optionNames).toContain('minNotes');
            expect(optionNames).toContain('maxNotes');
            expect(optionNames).toContain('limit');
            expect(optionNames).toContain('offset');
            expect(optionNames).toContain('sortBy');
            expect(optionNames).toContain('sortOrder');
            expect(optionNames).toContain('page');
            expect(optionNames).toContain('pageSize');
        });

        it('should have correct post type options', () => {
            const postTypeFields = searchFields.filter(field =>
                field.type === 'collection'
            ).flatMap(field => field.options || [])
                .filter((option: any) => option.name === 'postType' || option.name === 'type');

            postTypeFields.forEach((field: any) => {
                expect(field.type).toBe('options');
                const values = field.options?.map((opt: any) => opt.value) || [];

                expect(values).toContain('text');
                expect(values).toContain('photo');
                expect(values).toContain('quote');
                expect(values).toContain('link');
                expect(values).toContain('chat');
                expect(values).toContain('video');
                expect(values).toContain('audio');
            });
        });

        it('should have correct sort options', () => {
            const sortFields = searchFields.filter(field =>
                field.type === 'collection'
            ).flatMap(field => field.options || [])
                .filter((option: any) => option.name === 'sortBy');

            sortFields.forEach((field: any) => {
                expect(field.type).toBe('options');
                const values = field.options?.map((opt: any) => opt.value) || [];

                expect(values).toContain('timestamp');
                expect(values).toContain('notes');
                expect(values).toContain('title');
                expect(values).toContain('type');
            });
        });

        it('should have correct sort order options', () => {
            const sortOrderFields = searchFields.filter(field =>
                field.type === 'collection'
            ).flatMap(field => field.options || [])
                .filter((option: any) => option.name === 'sortOrder');

            sortOrderFields.forEach((field: any) => {
                expect(field.type).toBe('options');
                const values = field.options?.map((opt: any) => opt.value) || [];

                expect(values).toContain('desc');
                expect(values).toContain('asc');
                expect(field.default).toBe('desc');
            });
        });

        it('should have correct timeframe options for trending', () => {
            const trendingOptionsField = searchFields.find(field =>
                field.name === 'options' &&
                field.displayOptions?.show?.operation?.includes('getTrending')
            );

            const timeframeOption = trendingOptionsField?.options?.find((opt: any) => opt.name === 'timeframe') as any;

            expect(timeframeOption).toBeDefined();
            expect(timeframeOption?.type).toBe('options');

            const values = timeframeOption?.options?.map((opt: any) => opt.value) || [];
            expect(values).toContain('1h');
            expect(values).toContain('6h');
            expect(values).toContain('24h');
            expect(values).toContain('7d');
            expect(values).toContain('30d');
            expect(timeframeOption?.default).toBe('24h');
        });

        it('should have correct boolean options for trending', () => {
            const trendingOptionsField = searchFields.find(field =>
                field.name === 'options' &&
                field.displayOptions?.show?.operation?.includes('getTrending')
            );

            const booleanOptions = ['includeContent', 'includeTags', 'includeTopics'];

            booleanOptions.forEach(optionName => {
                const option = trendingOptionsField?.options?.find((opt: any) => opt.name === optionName) as any;
                expect(option).toBeDefined();
                expect(option?.type).toBe('boolean');
                expect(option?.default).toBe(true);
            });
        });

        it('should have correct date field types', () => {
            const dateFields = searchFields.filter(field =>
                field.type === 'collection'
            ).flatMap(field => field.options || [])
                .filter((option: any) => option.name === 'dateFrom' || option.name === 'dateTo');

            dateFields.forEach((field: any) => {
                expect(field.type).toBe('dateTime');
                expect(field.default).toBe('');
            });
        });

        it('should have correct number field configurations', () => {
            const numberFields = searchFields.filter(field =>
                field.type === 'collection'
            ).flatMap(field => field.options || [])
                .filter((option: any) =>
                    option.name === 'minNotes' ||
                    option.name === 'maxNotes' ||
                    option.name === 'page' ||
                    option.name === 'pageSize' ||
                    option.name === 'offset'
                );

            numberFields.forEach((field: any) => {
                expect(field.type).toBe('number');
                expect(field.typeOptions?.minValue).toBeGreaterThanOrEqual(0);
            });
        });

        it('should have proper display options for all fields', () => {
            searchFields.forEach(field => {
                expect(field.displayOptions).toBeDefined();
                expect(field.displayOptions?.show).toBeDefined();
                expect(field.displayOptions?.show?.resource).toContain('search');
                expect(field.displayOptions?.show?.operation).toBeDefined();
                expect(Array.isArray(field.displayOptions?.show?.operation)).toBe(true);
            });
        });

        it('should have consistent field naming and structure', () => {
            searchFields.forEach(field => {
                expect(field).toHaveProperty('displayName');
                expect(field).toHaveProperty('name');
                expect(field).toHaveProperty('type');
                expect(field).toHaveProperty('displayOptions');

                expect(typeof field.displayName).toBe('string');
                expect(typeof field.name).toBe('string');
                expect(typeof field.type).toBe('string');

                if (field.required !== undefined) {
                    expect(typeof field.required).toBe('boolean');
                }

                if (field.default !== undefined) {
                    expect(['string', 'number', 'boolean', 'object'].includes(typeof field.default)).toBe(true);
                }
            });
        });
    });
});