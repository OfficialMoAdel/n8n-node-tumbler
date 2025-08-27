import { Tumblr } from '../nodes/Tumblr/Tumblr.node';
import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { TumblrAuthenticator } from '../nodes/Tumblr/TumblrAuthenticator';
import { OperationRouter } from '../nodes/Tumblr/OperationRouter';

// Mock the dependencies
jest.mock('../nodes/Tumblr/TumblrAuthenticator');
jest.mock('../nodes/Tumblr/OperationRouter');

describe('Tumblr Node', () => {
    let tumblrNode: Tumblr;
    let mockExecuteFunctions: Partial<IExecuteFunctions>;
    let mockAuthenticator: jest.Mocked<TumblrAuthenticator>;
    let mockRouter: jest.Mocked<OperationRouter>;

    beforeEach(() => {
        tumblrNode = new Tumblr();

        // Mock TumblrAuthenticator
        mockAuthenticator = new TumblrAuthenticator() as jest.Mocked<TumblrAuthenticator>;
        mockAuthenticator.authenticate = jest.fn();
        (TumblrAuthenticator as jest.Mock).mockImplementation(() => mockAuthenticator);

        // Mock OperationRouter
        mockRouter = new OperationRouter() as jest.Mocked<OperationRouter>;
        mockRouter.route = jest.fn();
        (OperationRouter as jest.Mock).mockImplementation(() => mockRouter);

        // Mock IExecuteFunctions
        mockExecuteFunctions = {
            getInputData: jest.fn(),
            getCredentials: jest.fn(),
            getNodeParameter: jest.fn(),
            continueOnFail: jest.fn().mockReturnValue(false),
            getNode: jest.fn().mockReturnValue({ type: 'tumblr', typeVersion: 1 }),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Node Description', () => {
        it('should have correct basic properties', () => {
            const description = tumblrNode.description;

            expect(description.displayName).toBe('Tumblr');
            expect(description.name).toBe('tumblr');
            expect(description.group).toEqual(['social']);
            expect(description.version).toBe(1);
            expect(description.description).toBe('Interact with Tumblr API');
            expect(description.icon).toBe('file:tumblr.svg');
            expect(description.subtitle).toBe('={{$parameter["operation"] + ": " + $parameter["resource"]}}');
        });

        it('should have correct defaults', () => {
            const description = tumblrNode.description;
            expect(description.defaults).toEqual({
                name: 'Tumblr',
            });
        });

        it('should have correct inputs and outputs', () => {
            const description = tumblrNode.description;
            expect(description.inputs).toEqual(['main']);
            expect(description.outputs).toEqual(['main']);
        });

        it('should have correct credentials configuration', () => {
            const description = tumblrNode.description;

            expect(description.credentials).toHaveLength(1);
            expect(description.credentials?.[0]).toEqual({
                name: 'tumblrOAuth2Api',
                required: true,
            });
        });

        it('should have all required resources', () => {
            const description = tumblrNode.description;
            const resourceField = description.properties?.find(prop => prop.name === 'resource');

            expect(resourceField).toBeDefined();
            expect(resourceField?.type).toBe('options');
            expect(resourceField?.noDataExpression).toBe(true);
            expect(resourceField?.default).toBe('post');

            const resourceOptions = resourceField?.options?.map((opt: any) => opt.value);
            expect(resourceOptions).toEqual(['blog', 'post', 'user', 'queue', 'draft', 'search']);
        });

        it('should have blog operations', () => {
            const description = tumblrNode.description;
            const blogOperationField = description.properties?.find(prop =>
                prop.name === 'operation' &&
                prop.displayOptions?.show?.resource?.includes('blog')
            );

            expect(blogOperationField).toBeDefined();
            expect(blogOperationField?.type).toBe('options');
            expect(blogOperationField?.default).toBe('getInfo');

            const operations = blogOperationField?.options?.map((opt: any) => opt.value);
            expect(operations).toEqual(['getInfo', 'getPosts']);
        });

        it('should have post operations', () => {
            const description = tumblrNode.description;
            const postOperationField = description.properties?.find(prop =>
                prop.name === 'operation' &&
                prop.displayOptions?.show?.resource?.includes('post')
            );

            expect(postOperationField).toBeDefined();
            expect(postOperationField?.type).toBe('options');
            expect(postOperationField?.default).toBe('create');

            const operations = postOperationField?.options?.map((opt: any) => opt.value);
            expect(operations).toEqual(['create', 'update', 'delete', 'get']);
        });

        it('should have user operations', () => {
            const description = tumblrNode.description;
            const userOperationField = description.properties?.find(prop =>
                prop.name === 'operation' &&
                prop.displayOptions?.show?.resource?.includes('user')
            );

            expect(userOperationField).toBeDefined();
            expect(userOperationField?.type).toBe('options');
            expect(userOperationField?.default).toBe('getInfo');

            const operations = userOperationField?.options?.map((opt: any) => opt.value);
            expect(operations).toEqual(['getInfo', 'getDashboard', 'getLikes']);
        });

        it('should have queue operations', () => {
            const description = tumblrNode.description;
            const queueOperationField = description.properties?.find(prop =>
                prop.name === 'operation' &&
                prop.displayOptions?.show?.resource?.includes('queue')
            );

            expect(queueOperationField).toBeDefined();
            expect(queueOperationField?.type).toBe('options');
            expect(queueOperationField?.default).toBe('add');

            const operations = queueOperationField?.options?.map((opt: any) => opt.value);
            expect(operations).toEqual(['add', 'get', 'remove']);
        });

        it('should have draft operations', () => {
            const description = tumblrNode.description;
            const draftOperationField = description.properties?.find(prop =>
                prop.name === 'operation' &&
                prop.displayOptions?.show?.resource?.includes('draft')
            );

            expect(draftOperationField).toBeDefined();
            expect(draftOperationField?.type).toBe('options');
            expect(draftOperationField?.default).toBe('create');

            const operations = draftOperationField?.options?.map((opt: any) => opt.value);
            expect(operations).toEqual(['create', 'get', 'update', 'delete', 'publish']);
        });

        it('should have search operations', () => {
            const description = tumblrNode.description;
            const searchOperationField = description.properties?.find(prop =>
                prop.name === 'operation' &&
                prop.displayOptions?.show?.resource?.includes('search')
            );

            expect(searchOperationField).toBeDefined();
            expect(searchOperationField?.type).toBe('options');
            expect(searchOperationField?.default).toBe('searchByKeyword');

            const operations = searchOperationField?.options?.map((opt: any) => opt.value);
            expect(operations).toContain('searchByTag');
            expect(operations).toContain('searchByKeyword');
            expect(operations).toContain('advancedSearch');
            expect(operations).toContain('getTagInfo');
            expect(operations).toContain('getTagSuggestions');
            expect(operations).toContain('getTrendingTags');
            expect(operations).toContain('getTrending');
        });

        it('should have search parameter fields', () => {
            const description = tumblrNode.description;

            // Tag field
            const tagField = description.properties?.find(prop =>
                prop.name === 'tag'
            );
            expect(tagField).toBeDefined();
            expect(tagField?.type).toBe('string');
            expect(tagField?.required).toBe(true);
            expect(tagField?.displayOptions?.show?.operation).toContain('searchByTag');
            expect(tagField?.displayOptions?.show?.operation).toContain('getTagInfo');

            // Keyword field
            const keywordField = description.properties?.find(prop =>
                prop.name === 'keyword'
            );
            expect(keywordField).toBeDefined();
            expect(keywordField?.type).toBe('string');
            expect(keywordField?.required).toBe(true);
            expect(keywordField?.displayOptions?.show?.operation).toContain('searchByKeyword');

            // Partial tag field
            const partialTagField = description.properties?.find(prop =>
                prop.name === 'partialTag'
            );
            expect(partialTagField).toBeDefined();
            expect(partialTagField?.type).toBe('string');
            expect(partialTagField?.required).toBe(true);
            expect(partialTagField?.displayOptions?.show?.operation).toContain('getTagSuggestions');
        });

        it('should have search options collections', () => {
            const description = tumblrNode.description;

            // Search options
            const searchOptionsField = description.properties?.find(prop =>
                prop.name === 'searchOptions'
            );
            expect(searchOptionsField).toBeDefined();
            expect(searchOptionsField?.type).toBe('collection');
            expect(searchOptionsField?.displayOptions?.show?.operation).toContain('searchByKeyword');
            expect(searchOptionsField?.displayOptions?.show?.operation).toContain('searchByTag');

            // Advanced options
            const advancedOptionsField = description.properties?.find(prop =>
                prop.name === 'advancedOptions'
            );
            expect(advancedOptionsField).toBeDefined();
            expect(advancedOptionsField?.type).toBe('collection');
            expect(advancedOptionsField?.displayOptions?.show?.operation).toContain('advancedSearch');

            // Trending options
            const trendingOptionsField = description.properties?.find(prop =>
                prop.name === 'trendingOptions'
            );
            expect(trendingOptionsField).toBeDefined();
            expect(trendingOptionsField?.type).toBe('collection');
            expect(trendingOptionsField?.displayOptions?.show?.operation).toContain('getTrending');
        });

        it('should have blog name field', () => {
            const description = tumblrNode.description;
            const blogNameField = description.properties?.find(prop =>
                prop.name === 'blogName'
            );

            expect(blogNameField).toBeDefined();
            expect(blogNameField?.type).toBe('string');
            expect(blogNameField?.required).toBe(true);
            expect(blogNameField?.placeholder).toBe('myblog.tumblr.com');
            expect(blogNameField?.displayOptions?.show?.resource).toContain('blog');
            expect(blogNameField?.displayOptions?.show?.resource).toContain('post');
            expect(blogNameField?.displayOptions?.show?.resource).toContain('queue');
            expect(blogNameField?.displayOptions?.show?.resource).toContain('draft');
        });

        it('should have limit field for specific operations', () => {
            const description = tumblrNode.description;
            const limitField = description.properties?.find(prop =>
                prop.name === 'limit'
            );

            expect(limitField).toBeDefined();
            expect(limitField?.type).toBe('number');
            expect(limitField?.default).toBe(10);
            expect(limitField?.displayOptions?.show?.operation).toContain('getTagSuggestions');
            expect(limitField?.displayOptions?.show?.operation).toContain('getTrendingTags');
            expect(limitField?.typeOptions?.minValue).toBe(1);
            expect(limitField?.typeOptions?.maxValue).toBe(50);
        });
    });

    describe('execute', () => {
        it('should execute blog operation successfully', async () => {
            const mockInputData: INodeExecutionData[] = [{ json: {} }];
            const mockCredentials = {
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                accessToken: 'test-access-token',
            };
            const mockClient = { api: 'mock-client' };
            const mockResult = { success: true, data: 'test-data' };

            (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
            (mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(mockCredentials);
            (mockExecuteFunctions.getNodeParameter as jest.Mock)
                .mockReturnValueOnce('blog') // resource
                .mockReturnValueOnce('getInfo') // operation
                .mockReturnValueOnce('test-blog') // blogName
                .mockReturnValueOnce({}); // additionalFields

            mockAuthenticator.authenticate.mockResolvedValue(mockClient as any);
            mockRouter.route.mockResolvedValue(mockResult);

            const result = await tumblrNode.execute.call(mockExecuteFunctions as IExecuteFunctions);

            expect(mockAuthenticator.authenticate).toHaveBeenCalledWith({
                id: 'tumblrOAuth2Api',
                name: 'tumblrOAuth2Api',
                type: 'tumblrOAuth2Api',
                data: mockCredentials,
            });

            expect(mockRouter.route).toHaveBeenCalledWith({
                resource: 'blog',
                operation: 'getInfo',
                blogName: 'test-blog',
                parameters: {},
            }, mockClient);

            expect(result).toEqual([[{
                json: {
                    success: true,
                    data: mockResult,
                    metadata: {
                        operation: 'blog:getInfo',
                        timestamp: expect.any(String),
                        blogName: 'test-blog',
                    },
                }
            }]]);
        });

        it('should execute search by tag operation successfully', async () => {
            const mockInputData: INodeExecutionData[] = [{ json: {} }];
            const mockCredentials = { clientId: 'test' };
            const mockClient = { api: 'mock-client' };
            const mockResult = { success: true, posts: [] };

            (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
            (mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(mockCredentials);
            (mockExecuteFunctions.getNodeParameter as jest.Mock)
                .mockReturnValueOnce('search') // resource
                .mockReturnValueOnce('searchByTag') // operation
                .mockReturnValueOnce('') // blogName (empty for search)
                .mockReturnValueOnce('photography') // tag
                .mockReturnValueOnce({ limit: 20 }); // searchOptions

            mockAuthenticator.authenticate.mockResolvedValue(mockClient as any);
            mockRouter.route.mockResolvedValue(mockResult);

            const result = await tumblrNode.execute.call(mockExecuteFunctions as IExecuteFunctions);

            expect(mockRouter.route).toHaveBeenCalledWith({
                resource: 'search',
                operation: 'searchByTag',
                blogName: '',
                parameters: {
                    tag: 'photography',
                    options: { limit: 20 },
                },
            }, mockClient);

            expect(result).toEqual([[{
                json: {
                    success: true,
                    data: mockResult,
                    metadata: {
                        operation: 'search:searchByTag',
                        timestamp: expect.any(String),
                        blogName: undefined,
                    },
                }
            }]]);
        });

        it('should execute search by keyword operation successfully', async () => {
            const mockInputData: INodeExecutionData[] = [{ json: {} }];
            const mockCredentials = { clientId: 'test' };
            const mockClient = { api: 'mock-client' };
            const mockResult = { success: true, posts: [] };

            (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
            (mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(mockCredentials);
            (mockExecuteFunctions.getNodeParameter as jest.Mock)
                .mockReturnValueOnce('search') // resource
                .mockReturnValueOnce('searchByKeyword') // operation
                .mockReturnValueOnce('') // blogName (empty for search)
                .mockReturnValueOnce('photography tips') // keyword
                .mockReturnValueOnce({ limit: 30, sortBy: 'notes' }); // searchOptions

            mockAuthenticator.authenticate.mockResolvedValue(mockClient as any);
            mockRouter.route.mockResolvedValue(mockResult);

            const result = await tumblrNode.execute.call(mockExecuteFunctions as IExecuteFunctions);

            expect(mockRouter.route).toHaveBeenCalledWith({
                resource: 'search',
                operation: 'searchByKeyword',
                blogName: '',
                parameters: {
                    keyword: 'photography tips',
                    options: { limit: 30, sortBy: 'notes' },
                },
            }, mockClient);

            expect(result).toEqual([[{
                json: {
                    success: true,
                    data: mockResult,
                    metadata: {
                        operation: 'search:searchByKeyword',
                        timestamp: expect.any(String),
                        blogName: undefined,
                    },
                }
            }]]);
        });

        it('should execute advanced search operation successfully', async () => {
            const mockInputData: INodeExecutionData[] = [{ json: {} }];
            const mockCredentials = { clientId: 'test' };
            const mockClient = { api: 'mock-client' };
            const mockResult = { success: true, posts: [] };

            const advancedOptions = {
                keyword: 'art',
                tags: 'digital,painting',
                postType: 'photo',
                minNotes: 10,
                limit: 50,
            };

            (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
            (mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(mockCredentials);
            (mockExecuteFunctions.getNodeParameter as jest.Mock)
                .mockReturnValueOnce('search') // resource
                .mockReturnValueOnce('advancedSearch') // operation
                .mockReturnValueOnce('') // blogName (empty for search)
                .mockReturnValueOnce(advancedOptions); // advancedOptions

            mockAuthenticator.authenticate.mockResolvedValue(mockClient as any);
            mockRouter.route.mockResolvedValue(mockResult);

            const result = await tumblrNode.execute.call(mockExecuteFunctions as IExecuteFunctions);

            expect(mockRouter.route).toHaveBeenCalledWith({
                resource: 'search',
                operation: 'advancedSearch',
                blogName: '',
                parameters: {
                    keyword: 'art',
                    tags: ['digital', 'painting'],
                    postType: 'photo',
                    minNotes: 10,
                    limit: 50,
                },
            }, mockClient);

            expect(result).toEqual([[{
                json: {
                    success: true,
                    data: mockResult,
                    metadata: {
                        operation: 'search:advancedSearch',
                        timestamp: expect.any(String),
                        blogName: undefined,
                    },
                }
            }]]);
        });

        it('should execute tag suggestions operation successfully', async () => {
            const mockInputData: INodeExecutionData[] = [{ json: {} }];
            const mockCredentials = { clientId: 'test' };
            const mockClient = { api: 'mock-client' };
            const mockResult = { success: true, suggestions: [] };

            (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
            (mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(mockCredentials);
            (mockExecuteFunctions.getNodeParameter as jest.Mock)
                .mockReturnValueOnce('search') // resource
                .mockReturnValueOnce('getTagSuggestions') // operation
                .mockReturnValueOnce('') // blogName (empty for search)
                .mockReturnValueOnce('photo') // partialTag
                .mockReturnValueOnce(15); // limit

            mockAuthenticator.authenticate.mockResolvedValue(mockClient as any);
            mockRouter.route.mockResolvedValue(mockResult);

            const result = await tumblrNode.execute.call(mockExecuteFunctions as IExecuteFunctions);

            expect(mockRouter.route).toHaveBeenCalledWith({
                resource: 'search',
                operation: 'getTagSuggestions',
                blogName: '',
                parameters: {
                    partialTag: 'photo',
                    limit: 15,
                },
            }, mockClient);

            expect(result).toEqual([[{
                json: {
                    success: true,
                    data: mockResult,
                    metadata: {
                        operation: 'search:getTagSuggestions',
                        timestamp: expect.any(String),
                        blogName: undefined,
                    },
                }
            }]]);
        });

        it('should execute trending tags operation successfully', async () => {
            const mockInputData: INodeExecutionData[] = [{ json: {} }];
            const mockCredentials = { clientId: 'test' };
            const mockClient = { api: 'mock-client' };
            const mockResult = { success: true, trending_tags: [] };

            (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
            (mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(mockCredentials);
            (mockExecuteFunctions.getNodeParameter as jest.Mock)
                .mockReturnValueOnce('search') // resource
                .mockReturnValueOnce('getTrendingTags') // operation
                .mockReturnValueOnce('') // blogName (empty for search)
                .mockReturnValueOnce(25); // limit

            mockAuthenticator.authenticate.mockResolvedValue(mockClient as any);
            mockRouter.route.mockResolvedValue(mockResult);

            const result = await tumblrNode.execute.call(mockExecuteFunctions as IExecuteFunctions);

            expect(mockRouter.route).toHaveBeenCalledWith({
                resource: 'search',
                operation: 'getTrendingTags',
                blogName: '',
                parameters: {
                    limit: 25,
                },
            }, mockClient);

            expect(result).toEqual([[{
                json: {
                    success: true,
                    data: mockResult,
                    metadata: {
                        operation: 'search:getTrendingTags',
                        timestamp: expect.any(String),
                        blogName: undefined,
                    },
                }
            }]]);
        });

        it('should execute trending content operation successfully', async () => {
            const mockInputData: INodeExecutionData[] = [{ json: {} }];
            const mockCredentials = { clientId: 'test' };
            const mockClient = { api: 'mock-client' };
            const mockResult = { success: true, trending: {} };

            const trendingOptions = {
                timeframe: '24h',
                limit: 20,
                includeContent: true,
                includeTags: false,
            };

            (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
            (mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(mockCredentials);
            (mockExecuteFunctions.getNodeParameter as jest.Mock)
                .mockReturnValueOnce('search') // resource
                .mockReturnValueOnce('getTrending') // operation
                .mockReturnValueOnce('') // blogName (empty for search)
                .mockReturnValueOnce(trendingOptions); // trendingOptions

            mockAuthenticator.authenticate.mockResolvedValue(mockClient as any);
            mockRouter.route.mockResolvedValue(mockResult);

            const result = await tumblrNode.execute.call(mockExecuteFunctions as IExecuteFunctions);

            expect(mockRouter.route).toHaveBeenCalledWith({
                resource: 'search',
                operation: 'getTrending',
                blogName: '',
                parameters: {
                    options: trendingOptions,
                },
            }, mockClient);

            expect(result).toEqual([[{
                json: {
                    success: true,
                    data: mockResult,
                    metadata: {
                        operation: 'search:getTrending',
                        timestamp: expect.any(String),
                        blogName: undefined,
                    },
                }
            }]]);
        });

        it('should handle authentication errors', async () => {
            const mockInputData: INodeExecutionData[] = [{ json: {} }];

            (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
            (mockExecuteFunctions.getCredentials as jest.Mock).mockRejectedValue(new Error('Auth failed'));

            await expect(
                tumblrNode.execute.call(mockExecuteFunctions as IExecuteFunctions)
            ).rejects.toThrow('Auth failed');
        });

        it('should handle operation errors', async () => {
            const mockInputData: INodeExecutionData[] = [{ json: {} }];
            const mockCredentials = { clientId: 'test' };
            const mockClient = { api: 'mock-client' };

            (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
            (mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(mockCredentials);
            (mockExecuteFunctions.getNodeParameter as jest.Mock)
                .mockReturnValueOnce('blog')
                .mockReturnValueOnce('getInfo')
                .mockReturnValueOnce('test-blog');

            mockAuthenticator.authenticate.mockResolvedValue(mockClient as any);
            mockRouter.route.mockRejectedValue(new NodeOperationError(
                { message: 'Operation failed' } as any,
                'Operation failed'
            ));

            await expect(
                tumblrNode.execute.call(mockExecuteFunctions as IExecuteFunctions)
            ).rejects.toThrow(NodeOperationError);
        });

        it('should process multiple input items', async () => {
            const mockInputData: INodeExecutionData[] = [
                { json: {} },
                { json: {} },
            ];
            const mockCredentials = { clientId: 'test' };
            const mockClient = { api: 'mock-client' };
            const mockResult = { success: true };

            (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
            (mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(mockCredentials);
            (mockExecuteFunctions.getNodeParameter as jest.Mock)
                .mockImplementation((paramName: string, itemIndex: number) => {
                    if (paramName === 'resource') return 'blog';
                    if (paramName === 'operation') return 'getInfo';
                    if (paramName === 'blogName') return 'test-blog';
                    if (paramName === 'additionalFields') return {};
                    return undefined;
                });

            mockAuthenticator.authenticate.mockResolvedValue(mockClient as any);
            mockRouter.route.mockResolvedValue(mockResult);

            const result = await tumblrNode.execute.call(mockExecuteFunctions as IExecuteFunctions);

            expect(mockAuthenticator.authenticate).toHaveBeenCalledTimes(2);
            expect(mockRouter.route).toHaveBeenCalledTimes(2);
            expect(result).toEqual([
                [
                    {
                        json: {
                            success: true,
                            data: mockResult,
                            metadata: {
                                operation: 'blog:getInfo',
                                timestamp: expect.any(String),
                                blogName: 'test-blog',
                            },
                        }
                    },
                    {
                        json: {
                            success: true,
                            data: mockResult,
                            metadata: {
                                operation: 'blog:getInfo',
                                timestamp: expect.any(String),
                                blogName: 'test-blog',
                            },
                        }
                    },
                ]
            ]);
        });

        it('should handle empty input data', async () => {
            const mockInputData: INodeExecutionData[] = [];

            (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);

            const result = await tumblrNode.execute.call(mockExecuteFunctions as IExecuteFunctions);

            expect(result).toEqual([[]]);
            expect(mockAuthenticator.authenticate).not.toHaveBeenCalled();
            expect(mockRouter.route).not.toHaveBeenCalled();
        });

        it('should handle missing credentials gracefully', async () => {
            const mockInputData: INodeExecutionData[] = [{ json: {} }];

            (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
            (mockExecuteFunctions.getCredentials as jest.Mock).mockRejectedValue(new Error('No credentials'));
            (mockExecuteFunctions.getNodeParameter as jest.Mock)
                .mockReturnValueOnce('blog')
                .mockReturnValueOnce('getInfo');

            await expect(
                tumblrNode.execute.call(mockExecuteFunctions as IExecuteFunctions)
            ).rejects.toThrow('No credentials');
        });

        it('should handle parameter retrieval errors', async () => {
            const mockInputData: INodeExecutionData[] = [{ json: {} }];
            const mockCredentials = { clientId: 'test' };

            (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
            (mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(mockCredentials);
            (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(() => {
                throw new Error('Parameter error');
            });

            await expect(
                tumblrNode.execute.call(mockExecuteFunctions as IExecuteFunctions)
            ).rejects.toThrow('Parameter error');
        });
    });
});