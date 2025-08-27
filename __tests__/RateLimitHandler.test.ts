import { RateLimitHandler, DEFAULT_RETRY_CONFIG, RetryConfig } from '../nodes/Tumblr/RateLimitHandler';
import { TumblrError, TumblrErrorType } from '../nodes/Tumblr/ErrorHandler';

describe('RateLimitHandler', () => {
    let rateLimitHandler: RateLimitHandler;
    const testUserId = 'test-user-123';

    beforeEach(() => {
        rateLimitHandler = new RateLimitHandler();
    });

    describe('checkRateLimit', () => {
        it('should allow requests within rate limit', async () => {
            const canMakeRequest = await rateLimitHandler.checkRateLimit(testUserId);
            expect(canMakeRequest).toBe(true);
        });

        it('should track request counts correctly', async () => {
            // Make several requests
            for (let i = 0; i < 5; i++) {
                rateLimitHandler.recordRequest(testUserId);
            }

            const status = rateLimitHandler.getRateLimitStatus(testUserId);
            expect(status.requestCount).toBe(5);
            expect(status.userId).toBe(testUserId);
            expect(status.limit).toBe(1000);
        });

        it('should reset counter after time window', async () => {
            // Record some requests
            rateLimitHandler.recordRequest(testUserId);
            rateLimitHandler.recordRequest(testUserId);

            // Mock Date.now to simulate time passing
            const originalNow = Date.now;
            const mockNow = jest.fn(() => originalNow() + 3700000); // 1 hour + 1 minute
            Date.now = mockNow;

            const canMakeRequest = await rateLimitHandler.checkRateLimit(testUserId);
            expect(canMakeRequest).toBe(true);

            const status = rateLimitHandler.getRateLimitStatus(testUserId);
            expect(status.requestCount).toBe(0);

            Date.now = originalNow;
        });

        it('should prevent requests when rate limit is exceeded', async () => {
            // First check rate limit to initialize the user
            await rateLimitHandler.checkRateLimit(testUserId);

            // Simulate exceeding rate limit
            for (let i = 0; i < 1000; i++) {
                rateLimitHandler.recordRequest(testUserId);
            }

            const canMakeRequest = await rateLimitHandler.checkRateLimit(testUserId);
            expect(canMakeRequest).toBe(false);
        });
    });

    describe('handleRateLimit', () => {
        it('should handle rate limit errors', async () => {
            const rateLimitError: TumblrError = {
                type: TumblrErrorType.RATE_LIMIT,
                code: 429,
                message: 'Rate limit exceeded',
                timestamp: new Date().toISOString(),
                retryable: true,
                retryAfter: 1, // 1 second
            };

            // Mock the delay method to avoid actual waiting
            const delaySpy = jest.spyOn(rateLimitHandler as any, 'delay').mockResolvedValue(undefined);

            await rateLimitHandler.handleRateLimit(rateLimitError);

            expect(delaySpy).toHaveBeenCalledWith(1000); // 1 second in milliseconds
            delaySpy.mockRestore();
        });

        it('should use default delay when no retry-after is specified', async () => {
            const rateLimitError: TumblrError = {
                type: TumblrErrorType.RATE_LIMIT,
                code: 429,
                message: 'Rate limit exceeded',
                timestamp: new Date().toISOString(),
                retryable: true,
            };

            const delaySpy = jest.spyOn(rateLimitHandler as any, 'delay').mockResolvedValue(undefined);

            await rateLimitHandler.handleRateLimit(rateLimitError);

            expect(delaySpy).toHaveBeenCalledWith(60000); // 60 seconds default
            delaySpy.mockRestore();
        });

        it('should not wait for non-rate-limit errors', async () => {
            const networkError: TumblrError = {
                type: TumblrErrorType.NETWORK,
                code: 0,
                message: 'Network error',
                timestamp: new Date().toISOString(),
                retryable: true,
            };

            const delaySpy = jest.spyOn(rateLimitHandler as any, 'delay');

            await rateLimitHandler.handleRateLimit(networkError);

            expect(delaySpy).not.toHaveBeenCalled();
            delaySpy.mockRestore();
        });
    });

    describe('executeWithRetry', () => {
        it('should execute operation successfully on first try', async () => {
            const mockOperation = jest.fn().mockResolvedValue('success');

            const result = await rateLimitHandler.executeWithRetry(mockOperation);

            expect(result).toBe('success');
            expect(mockOperation).toHaveBeenCalledTimes(1);
        });

        it('should not retry on non-retryable errors', async () => {
            const validationError: TumblrError = {
                type: TumblrErrorType.VALIDATION,
                code: 400,
                message: 'Validation failed',
                timestamp: new Date().toISOString(),
                retryable: false,
            };

            const mockOperation = jest.fn().mockRejectedValue(validationError);

            await expect(rateLimitHandler.executeWithRetry(mockOperation)).rejects.toEqual(validationError);
            expect(mockOperation).toHaveBeenCalledTimes(1);
        });

        it('should retry on retryable errors with mocked delays', async () => {
            const networkError = {
                code: 'ECONNREFUSED',
                message: 'Connection refused',
            };

            const mockOperation = jest
                .fn()
                .mockRejectedValueOnce(networkError)
                .mockRejectedValueOnce(networkError)
                .mockResolvedValue('success');

            // Mock the delay method to avoid actual waiting
            const delaySpy = jest.spyOn(rateLimitHandler as any, 'delay').mockResolvedValue(undefined);

            const result = await rateLimitHandler.executeWithRetry(mockOperation);

            expect(result).toBe('success');
            expect(mockOperation).toHaveBeenCalledTimes(3);
            expect(delaySpy).toHaveBeenCalledTimes(2); // Two retry delays

            delaySpy.mockRestore();
        });

        it('should respect maximum retry attempts', async () => {
            const networkError = {
                code: 'ETIMEDOUT',
                message: 'Timeout',
            };

            const mockOperation = jest.fn().mockRejectedValue(networkError);
            const config: Partial<RetryConfig> = { maxRetries: 2 };

            // Mock the delay method
            const delaySpy = jest.spyOn(rateLimitHandler as any, 'delay').mockResolvedValue(undefined);

            await expect(rateLimitHandler.executeWithRetry(mockOperation, config)).rejects.toEqual(networkError);
            expect(mockOperation).toHaveBeenCalledTimes(3); // 1 initial + 2 retries

            delaySpy.mockRestore();
        });

        it('should handle rate limit errors with user tracking', async () => {
            const rateLimitError: TumblrError = {
                type: TumblrErrorType.RATE_LIMIT,
                code: 429,
                message: 'Rate limit exceeded',
                timestamp: new Date().toISOString(),
                retryable: true,
                retryAfter: 1,
            };

            const mockOperation = jest
                .fn()
                .mockRejectedValueOnce(rateLimitError)
                .mockResolvedValue('success');

            // Mock the delay and handleRateLimit methods
            const delaySpy = jest.spyOn(rateLimitHandler as any, 'delay').mockResolvedValue(undefined);
            const handleRateLimitSpy = jest.spyOn(rateLimitHandler, 'handleRateLimit').mockResolvedValue(undefined);

            const result = await rateLimitHandler.executeWithRetry(mockOperation, {}, testUserId);

            expect(result).toBe('success');
            expect(mockOperation).toHaveBeenCalledTimes(2);
            expect(handleRateLimitSpy).toHaveBeenCalledWith(rateLimitError);

            delaySpy.mockRestore();
            handleRateLimitSpy.mockRestore();
        });
    });

    describe('createRateLimitedFunction', () => {
        it('should create a rate-limited version of a function', async () => {
            const originalFunction = jest.fn().mockResolvedValue('success');
            const rateLimitedFunction = rateLimitHandler.createRateLimitedFunction(
                originalFunction,
                {},
                testUserId
            );

            const result = await rateLimitedFunction('arg1', 'arg2');

            expect(result).toBe('success');
            expect(originalFunction).toHaveBeenCalledWith('arg1', 'arg2');
        });

        it('should apply retry logic to the wrapped function', async () => {
            const networkError = { code: 'ENOTFOUND' };
            const originalFunction = jest
                .fn()
                .mockRejectedValueOnce(networkError)
                .mockResolvedValue('success');

            const rateLimitedFunction = rateLimitHandler.createRateLimitedFunction(
                originalFunction,
                { maxRetries: 1 },
                testUserId
            );

            // Mock the delay method
            const delaySpy = jest.spyOn(rateLimitHandler as any, 'delay').mockResolvedValue(undefined);

            const result = await rateLimitedFunction('test');

            expect(result).toBe('success');
            expect(originalFunction).toHaveBeenCalledTimes(2);

            delaySpy.mockRestore();
        });
    });

    describe('utility methods', () => {
        it('should reset rate limit for specific user', () => {
            rateLimitHandler.recordRequest(testUserId);
            rateLimitHandler.recordRequest('other-user');

            rateLimitHandler.resetRateLimit(testUserId);

            const testUserStatus = rateLimitHandler.getRateLimitStatus(testUserId);
            const otherUserStatus = rateLimitHandler.getRateLimitStatus('other-user');

            expect(testUserStatus.requestCount).toBe(0);
            expect(otherUserStatus.requestCount).toBe(1);
        });

        it('should clear all rate limits', () => {
            rateLimitHandler.recordRequest(testUserId);
            rateLimitHandler.recordRequest('other-user');

            rateLimitHandler.clearAllRateLimits();

            const stats = rateLimitHandler.getStatistics();
            expect(stats.totalUsers).toBe(0);
            expect(stats.totalRequests).toBe(0);
        });

        it('should provide accurate statistics', async () => {
            // Initialize users by checking rate limits first
            await rateLimitHandler.checkRateLimit(testUserId);
            await rateLimitHandler.checkRateLimit('user2');

            rateLimitHandler.recordRequest(testUserId);
            rateLimitHandler.recordRequest('user2');
            rateLimitHandler.recordRequest('user2');

            const stats = rateLimitHandler.getStatistics();

            expect(stats.totalUsers).toBe(2);
            expect(stats.totalRequests).toBe(3);
            expect(stats.activeUsers).toBe(2);
        });
    });

    describe('error classification', () => {
        it('should identify retryable HTTP status codes', () => {
            const retryableErrors = [
                { response: { status: 429 } }, // Rate limit
                { response: { status: 500 } }, // Internal server error
                { response: { status: 502 } }, // Bad gateway
                { response: { status: 503 } }, // Service unavailable
                { response: { status: 504 } }, // Gateway timeout
            ];

            retryableErrors.forEach(error => {
                const shouldRetry = (rateLimitHandler as any).shouldRetryError(error, DEFAULT_RETRY_CONFIG.retryableErrorTypes);
                expect(shouldRetry).toBe(true);
            });
        });

        it('should not retry non-retryable HTTP status codes', () => {
            const nonRetryableErrors = [
                { response: { status: 400 } }, // Bad request
                { response: { status: 401 } }, // Unauthorized
                { response: { status: 403 } }, // Forbidden
                { response: { status: 404 } }, // Not found
            ];

            nonRetryableErrors.forEach(error => {
                const shouldRetry = (rateLimitHandler as any).shouldRetryError(error, DEFAULT_RETRY_CONFIG.retryableErrorTypes);
                expect(shouldRetry).toBe(false);
            });
        });

        it('should identify retryable network error codes', () => {
            const networkErrors = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'];

            networkErrors.forEach(code => {
                const error = { code, message: `Network error: ${code}` };
                const shouldRetry = (rateLimitHandler as any).shouldRetryError(error, DEFAULT_RETRY_CONFIG.retryableErrorTypes);
                expect(shouldRetry).toBe(true);
            });
        });

        it('should handle TumblrError objects correctly', () => {
            const retryableError: TumblrError = {
                type: TumblrErrorType.RATE_LIMIT,
                code: 429,
                message: 'Rate limit exceeded',
                timestamp: new Date().toISOString(),
                retryable: true,
            };

            const nonRetryableError: TumblrError = {
                type: TumblrErrorType.VALIDATION,
                code: 400,
                message: 'Validation failed',
                timestamp: new Date().toISOString(),
                retryable: false,
            };

            const shouldRetryFirst = (rateLimitHandler as any).shouldRetryError(retryableError, DEFAULT_RETRY_CONFIG.retryableErrorTypes);
            const shouldRetrySecond = (rateLimitHandler as any).shouldRetryError(nonRetryableError, DEFAULT_RETRY_CONFIG.retryableErrorTypes);

            expect(shouldRetryFirst).toBe(true);
            expect(shouldRetrySecond).toBe(false);
        });
    });

    describe('exponential backoff', () => {
        it('should calculate increasing delays with jitter', () => {
            const config = DEFAULT_RETRY_CONFIG;

            // Test multiple attempts to see increasing delays
            const delay1 = (rateLimitHandler as any).calculateBackoffDelay(1, config);
            const delay2 = (rateLimitHandler as any).calculateBackoffDelay(2, config);
            const delay3 = (rateLimitHandler as any).calculateBackoffDelay(3, config);

            expect(delay1).toBeGreaterThanOrEqual(config.baseDelay);
            expect(delay2).toBeGreaterThan(delay1);
            expect(delay3).toBeGreaterThan(delay2);

            // All delays should be capped at maxDelay
            expect(delay1).toBeLessThanOrEqual(config.maxDelay);
            expect(delay2).toBeLessThanOrEqual(config.maxDelay);
            expect(delay3).toBeLessThanOrEqual(config.maxDelay);
        });

        it('should respect maximum delay cap', () => {
            const config: RetryConfig = {
                ...DEFAULT_RETRY_CONFIG,
                maxDelay: 5000,
            };

            const delay = (rateLimitHandler as any).calculateBackoffDelay(10, config);
            expect(delay).toBeLessThanOrEqual(5000);
        });
    });

    describe('rate limit status', () => {
        it('should return correct rate limit information', () => {
            rateLimitHandler.recordRequest(testUserId);
            rateLimitHandler.recordRequest(testUserId);

            const status = rateLimitHandler.getRateLimitStatus(testUserId);

            expect(status.userId).toBe(testUserId);
            expect(status.requestCount).toBe(2);
            expect(status.limit).toBe(1000);
            expect(status.resetTime).toBeGreaterThan(Date.now());
        });

        it('should calculate time until reset correctly', async () => {
            // Initialize user by checking rate limit first
            await rateLimitHandler.checkRateLimit(testUserId);
            rateLimitHandler.recordRequest(testUserId);

            const timeUntilReset = (rateLimitHandler as any).getTimeUntilReset(testUserId);

            expect(timeUntilReset).toBeGreaterThan(0);
            expect(timeUntilReset).toBeLessThanOrEqual(3600); // Should be within 1 hour
        });
    });
});