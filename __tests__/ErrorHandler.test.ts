import { ErrorHandler, TumblrErrorType, TumblrError } from '../nodes/Tumblr/ErrorHandler';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

describe('ErrorHandler', () => {
    let errorHandler: ErrorHandler;

    afterEach(() => {
        if (errorHandler) {
            errorHandler.destroy();
        }
    });

    beforeEach(() => {
        errorHandler = new ErrorHandler();
    });

    describe('classifyError', () => {
        it('should classify HTTP 401 as authentication error', () => {
            const httpError = {
                response: {
                    status: 401,
                    data: { message: 'Unauthorized' },
                },
            };

            const result = errorHandler.classifyError(httpError);

            expect(result.type).toBe(TumblrErrorType.AUTHENTICATION);
            expect(result.code).toBe(401);
            expect(result.retryable).toBe(false);
            expect(result.message).toContain('Unauthorized');
        });

        it('should classify HTTP 403 as authentication error', () => {
            const httpError = {
                response: {
                    status: 403,
                    data: { message: 'Forbidden' },
                },
            };

            const result = errorHandler.classifyError(httpError);

            expect(result.type).toBe(TumblrErrorType.AUTHENTICATION);
            expect(result.code).toBe(403);
            expect(result.retryable).toBe(false);
        });

        it('should classify HTTP 429 as rate limit error with retry after', () => {
            const httpError = {
                response: {
                    status: 429,
                    data: { message: 'Rate limit exceeded' },
                    headers: { 'retry-after': '60' },
                },
            };

            const result = errorHandler.classifyError(httpError);

            expect(result.type).toBe(TumblrErrorType.RATE_LIMIT);
            expect(result.code).toBe(429);
            expect(result.retryable).toBe(true);
            expect(result.retryAfter).toBe(60);
        });

        it('should classify HTTP 400 as validation error', () => {
            const httpError = {
                response: {
                    status: 400,
                    data: {
                        errors: { title: 'Title is required', body: 'Body cannot be empty' }
                    },
                },
            };

            const result = errorHandler.classifyError(httpError);

            expect(result.type).toBe(TumblrErrorType.VALIDATION);
            expect(result.code).toBe(400);
            expect(result.retryable).toBe(false);
        });

        it('should classify HTTP 404 as API error', () => {
            const httpError = {
                response: {
                    status: 404,
                    data: { message: 'The blog was not found' },
                },
            };

            const result = errorHandler.classifyError(httpError);

            expect(result.type).toBe(TumblrErrorType.API_ERROR);
            expect(result.code).toBe(404);
            expect(result.retryable).toBe(false);
            expect(result.message).toContain('Blog not found');
        });

        it('should classify HTTP 500 as retryable API error', () => {
            const httpError = {
                response: {
                    status: 500,
                    data: { message: 'Internal server error' },
                },
            };

            const result = errorHandler.classifyError(httpError);

            expect(result.type).toBe(TumblrErrorType.API_ERROR);
            expect(result.code).toBe(500);
            expect(result.retryable).toBe(true);
        });

        it('should classify HTTP 502, 503, 504 as retryable API errors', () => {
            const statusCodes = [502, 503, 504];

            statusCodes.forEach(status => {
                const httpError = {
                    response: {
                        status,
                        data: { message: 'Server error' },
                    },
                };

                const result = errorHandler.classifyError(httpError);

                expect(result.type).toBe(TumblrErrorType.API_ERROR);
                expect(result.code).toBe(status);
                expect(result.retryable).toBe(true);
            });
        });

        it('should classify network errors correctly', () => {
            const networkErrors = [
                { code: 'ECONNREFUSED', expectedMessage: 'Connection refused' },
                { code: 'ENOTFOUND', expectedMessage: 'DNS resolution failed' },
                { code: 'ETIMEDOUT', expectedMessage: 'Network timeout' },
            ];

            networkErrors.forEach(({ code, expectedMessage }) => {
                const networkError = { code, message: `Network error: ${code}` };
                const result = errorHandler.classifyError(networkError);

                expect(result.type).toBe(TumblrErrorType.NETWORK);
                expect(result.retryable).toBe(true);
                expect(result.message).toContain(expectedMessage);
                expect(result.details?.errorCode).toBe(code);
            });
        });

        it('should classify validation errors by name and message', () => {
            const validationError = {
                name: 'ValidationError',
                message: 'Validation failed',
                details: { title: 'Title is required' },
            };

            const result = errorHandler.classifyError(validationError);

            expect(result.type).toBe(TumblrErrorType.VALIDATION);
            expect(result.retryable).toBe(false);
            expect(result.details).toEqual(validationError.details);
        });

        it('should classify authentication errors by message content', () => {
            const authErrors = [
                { message: 'Invalid token provided' },
                { message: 'auth failed' },
                { message: 'credential error occurred' },
            ];

            authErrors.forEach(authError => {
                const result = errorHandler.classifyError(authError);

                expect(result.type).toBe(TumblrErrorType.AUTHENTICATION);
                expect(result.retryable).toBe(false);
            });
        });

        it('should classify unknown errors as fallback', () => {
            const unknownError = { message: 'Something went wrong' };
            const result = errorHandler.classifyError(unknownError);

            expect(result.type).toBe(TumblrErrorType.UNKNOWN);
            expect(result.retryable).toBe(false);
            expect(result.message).toContain('Unknown error occurred');
        });

        it('should handle errors without messages', () => {
            const errorWithoutMessage = {};
            const result = errorHandler.classifyError(errorWithoutMessage);

            expect(result.type).toBe(TumblrErrorType.UNKNOWN);
            expect(result.message).toContain('No error message available');
        });

        it('should include timestamp in all classified errors', () => {
            const error = { message: 'Test error' };
            const result = errorHandler.classifyError(error);

            expect(result.timestamp).toBeDefined();
            expect(new Date(result.timestamp)).toBeInstanceOf(Date);
        });
    });

    describe('formatErrorMessage', () => {
        it('should format error message with troubleshooting guidance', () => {
            const error: TumblrError = {
                type: TumblrErrorType.AUTHENTICATION,
                code: 401,
                message: 'Invalid credentials',
                timestamp: new Date().toISOString(),
                retryable: false,
            };

            const formatted = errorHandler.formatErrorMessage(error);

            expect(formatted).toContain('Tumblr API Error (authentication)');
            expect(formatted).toContain('Invalid credentials');
            expect(formatted).toContain('Troubleshooting:');
            expect(formatted).toContain('Verify your Tumblr API credentials');
        });

        it('should format error message without troubleshooting if none available', () => {
            const error: TumblrError = {
                type: TumblrErrorType.UNKNOWN,
                code: 500,
                message: 'Unknown error',
                timestamp: new Date().toISOString(),
                retryable: false,
            };

            // Mock getTroubleshootingGuidance to return empty string
            const spy = jest.spyOn(errorHandler as any, 'getTroubleshootingGuidance').mockReturnValue('');

            const formatted = errorHandler.formatErrorMessage(error);

            expect(formatted).toBe('Tumblr API Error (unknown): Unknown error');
            expect(formatted).not.toContain('Troubleshooting:');

            spy.mockRestore();
        });
    });

    describe('shouldRetry', () => {
        it('should return true for retryable errors', () => {
            const retryableError: TumblrError = {
                type: TumblrErrorType.RATE_LIMIT,
                code: 429,
                message: 'Rate limit exceeded',
                timestamp: new Date().toISOString(),
                retryable: true,
            };

            expect(errorHandler.shouldRetry(retryableError)).toBe(true);
        });

        it('should return false for non-retryable errors', () => {
            const nonRetryableError: TumblrError = {
                type: TumblrErrorType.AUTHENTICATION,
                code: 401,
                message: 'Unauthorized',
                timestamp: new Date().toISOString(),
                retryable: false,
            };

            expect(errorHandler.shouldRetry(nonRetryableError)).toBe(false);
        });
    });

    describe('getRetryDelay', () => {
        it('should return retryAfter value for rate limit errors', () => {
            const rateLimitError: TumblrError = {
                type: TumblrErrorType.RATE_LIMIT,
                code: 429,
                message: 'Rate limit exceeded',
                timestamp: new Date().toISOString(),
                retryable: true,
                retryAfter: 60,
            };

            const delay = errorHandler.getRetryDelay(rateLimitError, 1);
            expect(delay).toBe(60000); // 60 seconds in milliseconds
        });

        it('should calculate exponential backoff for other errors', () => {
            const networkError: TumblrError = {
                type: TumblrErrorType.NETWORK,
                code: 0,
                message: 'Connection failed',
                timestamp: new Date().toISOString(),
                retryable: true,
            };

            expect(errorHandler.getRetryDelay(networkError, 1)).toBe(1000); // 1 second
            expect(errorHandler.getRetryDelay(networkError, 2)).toBe(2000); // 2 seconds
            expect(errorHandler.getRetryDelay(networkError, 3)).toBe(4000); // 4 seconds
            expect(errorHandler.getRetryDelay(networkError, 4)).toBe(8000); // 8 seconds
        });

        it('should cap exponential backoff at 30 seconds', () => {
            const networkError: TumblrError = {
                type: TumblrErrorType.NETWORK,
                code: 0,
                message: 'Connection failed',
                timestamp: new Date().toISOString(),
                retryable: true,
            };

            const delay = errorHandler.getRetryDelay(networkError, 10);
            expect(delay).toBe(30000); // Capped at 30 seconds
        });
    });

    describe('createN8nError', () => {
        it('should create NodeOperationError for validation errors', () => {
            const validationError: TumblrError = {
                type: TumblrErrorType.VALIDATION,
                code: 400,
                message: 'Validation failed',
                timestamp: new Date().toISOString(),
                retryable: false,
            };

            const mockNode = { name: 'Tumblr' };
            const n8nError = errorHandler.createN8nError(validationError, mockNode);

            expect(n8nError).toBeInstanceOf(NodeOperationError);
            expect(n8nError.message).toContain('Validation failed');
        });

        it('should create NodeApiError for non-validation errors', () => {
            const apiError: TumblrError = {
                type: TumblrErrorType.API_ERROR,
                code: 500,
                message: 'Server error',
                timestamp: new Date().toISOString(),
                retryable: true,
                originalError: new Error('Original error'),
            };

            const mockNode = { name: 'Tumblr' };
            const n8nError = errorHandler.createN8nError(apiError, mockNode);

            expect(n8nError).toBeInstanceOf(NodeApiError);
        });

        it('should create NodeApiError with formatted message when no original error', () => {
            const error: TumblrError = {
                type: TumblrErrorType.NETWORK,
                code: 0,
                message: 'Network error',
                timestamp: new Date().toISOString(),
                retryable: true,
            };

            const mockNode = { name: 'Tumblr' };
            const n8nError = errorHandler.createN8nError(error, mockNode);

            expect(n8nError).toBeInstanceOf(NodeApiError);
        });
    });

    describe('private helper methods', () => {
        it('should extract retry-after header correctly', () => {
            const headers = { 'retry-after': '120' };
            const error = {
                response: { status: 429, data: {}, headers },
            };

            const result = errorHandler.classifyError(error);
            expect(result.retryAfter).toBe(120);
        });

        it('should handle case-insensitive retry-after header', () => {
            const headers = { 'Retry-After': '90' };
            const error = {
                response: { status: 429, data: {}, headers },
            };

            const result = errorHandler.classifyError(error);
            expect(result.retryAfter).toBe(90);
        });

        it('should handle invalid retry-after header', () => {
            const headers = { 'retry-after': 'invalid' };
            const error = {
                response: { status: 429, data: {}, headers },
            };

            const result = errorHandler.classifyError(error);
            expect(result.retryAfter).toBeUndefined();
        });

        it('should provide specific troubleshooting guidance for each error type', () => {
            const errorTypes = [
                { type: TumblrErrorType.AUTHENTICATION, expectedGuidance: 'Verify your Tumblr API credentials' },
                { type: TumblrErrorType.RATE_LIMIT, expectedGuidance: 'Reduce the frequency of API requests' },
                { type: TumblrErrorType.NETWORK, expectedGuidance: 'Check your internet connection' },
                { type: TumblrErrorType.VALIDATION, expectedGuidance: 'Review the input parameters' },
            ];

            errorTypes.forEach(({ type, expectedGuidance }) => {
                const error: TumblrError = {
                    type,
                    code: 400,
                    message: 'Test error',
                    timestamp: new Date().toISOString(),
                    retryable: false,
                };

                const formatted = errorHandler.formatErrorMessage(error);
                expect(formatted).toContain(expectedGuidance);
            });
        });
    });

    describe('Network Error Handling Integration', () => {
        beforeEach(() => {
            errorHandler = new ErrorHandler();
        });

        it('should execute operations with network retry', async () => {
            const mockOperation = jest.fn().mockResolvedValue('success');

            const result = await errorHandler.executeWithNetworkRetry(mockOperation, 'test_op');

            expect(result).toBe('success');
            expect(mockOperation).toHaveBeenCalledTimes(1);
        });

        it('should retry network operations on failure', async () => {
            const mockOperation = jest.fn()
                .mockRejectedValueOnce(Object.assign(new Error('Connection timeout'), { code: 'ETIMEDOUT' }))
                .mockResolvedValue('success');

            const result = await errorHandler.executeWithNetworkRetry(mockOperation, 'retry_test');

            expect(result).toBe('success');
            expect(mockOperation).toHaveBeenCalledTimes(2);
        });

        it('should throw error after max retries', async () => {
            const mockOperation = jest.fn().mockRejectedValue(
                Object.assign(new Error('Connection timeout'), { code: 'ETIMEDOUT' })
            );

            await expect(errorHandler.executeWithNetworkRetry(mockOperation, 'fail_test'))
                .rejects.toThrow();

            expect(mockOperation).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
        }, 15000);

        it('should provide network statistics', () => {
            const stats = errorHandler.getNetworkStats();

            expect(stats).toHaveProperty('totalRequests');
            expect(stats).toHaveProperty('failedRequests');
            expect(stats).toHaveProperty('activeConnections');
            expect(stats).toHaveProperty('averageResponseTime');
        });

        it('should provide HTTPS agent', () => {
            const agent = errorHandler.getHttpsAgent();

            expect(agent).toBeDefined();
            expect(agent.constructor.name).toBe('Agent');
        });

        it('should perform network health check', async () => {
            const healthResult = await errorHandler.performNetworkHealthCheck();

            expect(healthResult).toHaveProperty('healthy');
            expect(healthResult).toHaveProperty('latency');
            expect(healthResult).toHaveProperty('details');
        });

        it('should detect network failure patterns', () => {
            const errors = [
                {
                    type: TumblrErrorType.NETWORK,
                    code: 0,
                    message: 'Network error',
                    timestamp: new Date().toISOString(),
                    retryable: true,
                    details: { errorCode: 'ETIMEDOUT' },
                },
            ];

            const pattern = errorHandler.detectNetworkFailurePattern(errors);

            expect(pattern).toHaveProperty('pattern');
            expect(pattern).toHaveProperty('severity');
            expect(pattern).toHaveProperty('recommendation');
        });

        it('should classify network errors using NetworkErrorHandler', () => {
            const networkError = Object.assign(new Error('Connection timeout'), { code: 'ETIMEDOUT' });

            const classified = errorHandler.classifyError(networkError);

            expect(classified.type).toBe(TumblrErrorType.NETWORK);
            expect(classified.code).toBe(408);
            expect(classified.retryable).toBe(true);
            expect(classified.details?.operationName).toBe('api_operation');
        });
    });
});