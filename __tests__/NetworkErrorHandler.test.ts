import { NetworkErrorHandler, DEFAULT_NETWORK_CONFIG, NetworkConfig } from '../nodes/Tumblr/NetworkErrorHandler';
import { TumblrErrorType } from '../nodes/Tumblr/ErrorHandler';

describe('NetworkErrorHandler', () => {
    let networkHandler: NetworkErrorHandler;

    beforeEach(() => {
        networkHandler = new NetworkErrorHandler();
    });

    afterEach(() => {
        networkHandler.destroy();
    });

    describe('Constructor and Configuration', () => {
        it('should initialize with default configuration', () => {
            const handler = new NetworkErrorHandler();
            const stats = handler.getConnectionStats();

            expect(stats.totalRequests).toBe(0);
            expect(stats.failedRequests).toBe(0);
            expect(stats.activeConnections).toBe(0);

            handler.destroy();
        });

        it('should accept custom configuration', () => {
            const customConfig: Partial<NetworkConfig> = {
                timeout: 5000,
                maxRetries: 5,
                connectionPoolSize: 20,
            };

            const handler = new NetworkErrorHandler(customConfig);
            expect(handler).toBeDefined();

            handler.destroy();
        });

        it('should update configuration dynamically', () => {
            const newConfig = { timeout: 15000, maxRetries: 2 };
            networkHandler.updateConfig(newConfig);

            // Configuration should be updated (we can't directly test private config,
            // but we can test that the method doesn't throw)
            expect(() => networkHandler.updateConfig(newConfig)).not.toThrow();
        });
    });

    describe('Network Error Classification', () => {
        it('should classify timeout errors correctly', () => {
            const timeoutError = new Error('Operation timed out after 30000ms');
            timeoutError.name = 'TimeoutError';

            const classified = networkHandler.classifyNetworkError(timeoutError, 'test_operation');

            expect(classified.type).toBe(TumblrErrorType.NETWORK);
            expect(classified.code).toBe(408);
            expect(classified.message).toContain('Network timeout');
            expect(classified.message).toContain('test_operation');
            expect(classified.retryable).toBe(true);
            expect(classified.details?.operationName).toBe('test_operation');
        });

        it('should classify ETIMEDOUT errors correctly', () => {
            const error: any = new Error('Socket timeout');
            error.code = 'ETIMEDOUT';

            const classified = networkHandler.classifyNetworkError(error, 'api_call');

            expect(classified.type).toBe(TumblrErrorType.NETWORK);
            expect(classified.code).toBe(408);
            expect(classified.retryable).toBe(true);
            expect(classified.details?.errorCode).toBe('ETIMEDOUT');
        });

        it('should classify connection refused errors correctly', () => {
            const error: any = new Error('Connection refused');
            error.code = 'ECONNREFUSED';
            error.hostname = 'api.tumblr.com';
            error.port = 443;

            const classified = networkHandler.classifyNetworkError(error, 'connect');

            expect(classified.type).toBe(TumblrErrorType.NETWORK);
            expect(classified.message).toContain('Connection refused');
            expect(classified.retryable).toBe(true);
            expect(classified.details?.host).toBe('api.tumblr.com');
            expect(classified.details?.port).toBe(443);
        });

        it('should classify DNS resolution errors correctly', () => {
            const error: any = new Error('getaddrinfo ENOTFOUND api.tumblr.com');
            error.code = 'ENOTFOUND';
            error.hostname = 'api.tumblr.com';

            const classified = networkHandler.classifyNetworkError(error, 'dns_lookup');

            expect(classified.type).toBe(TumblrErrorType.NETWORK);
            expect(classified.message).toContain('DNS resolution failed');
            expect(classified.retryable).toBe(true);
            expect(classified.details?.hostname).toBe('api.tumblr.com');
        });

        it('should classify network unreachable errors correctly', () => {
            const error: any = new Error('Network is unreachable');
            error.code = 'ENETUNREACH';

            const classified = networkHandler.classifyNetworkError(error, 'network_call');

            expect(classified.type).toBe(TumblrErrorType.NETWORK);
            expect(classified.message).toContain('Network unreachable');
            expect(classified.retryable).toBe(true);
        });

        it('should classify connection reset errors correctly', () => {
            const error: any = new Error('Connection reset by peer');
            error.code = 'ECONNRESET';

            const classified = networkHandler.classifyNetworkError(error, 'data_transfer');

            expect(classified.type).toBe(TumblrErrorType.NETWORK);
            expect(classified.message).toContain('Connection reset');
            expect(classified.retryable).toBe(true);
        });

        it('should classify socket hang up errors correctly', () => {
            const error: any = new Error('socket hang up');
            error.code = 'ECONNABORTED';

            const classified = networkHandler.classifyNetworkError(error, 'upload');

            expect(classified.type).toBe(TumblrErrorType.NETWORK);
            expect(classified.message).toContain('Connection aborted');
            expect(classified.retryable).toBe(true);
        });

        it('should classify SSL certificate errors correctly', () => {
            const error: any = new Error('certificate verify failed');
            error.code = 'CERT_UNTRUSTED';
            error.reason = 'certificate verify failed';

            const classified = networkHandler.classifyNetworkError(error, 'ssl_handshake');

            expect(classified.type).toBe(TumblrErrorType.NETWORK);
            expect(classified.message).toContain('SSL/TLS error');
            expect(classified.retryable).toBe(false); // SSL errors should not be retryable
            expect(classified.details?.reason).toBe('certificate verify failed');
        });

        it('should classify generic network errors correctly', () => {
            const error = new Error('Unknown network error');

            const classified = networkHandler.classifyNetworkError(error, 'generic_op');

            expect(classified.type).toBe(TumblrErrorType.NETWORK);
            expect(classified.message).toContain('Network error during generic_op');
            expect(classified.retryable).toBe(true);
        });
    });

    describe('Retry Logic', () => {
        it('should determine retryable errors correctly', () => {
            const retryableError = {
                type: TumblrErrorType.NETWORK,
                code: 0,
                message: 'Connection timeout',
                timestamp: new Date().toISOString(),
                retryable: true,
                details: { errorCode: 'ETIMEDOUT' },
            };

            expect(networkHandler.shouldRetryNetworkError(retryableError)).toBe(true);
        });

        it('should not retry SSL certificate errors', () => {
            const sslError = {
                type: TumblrErrorType.NETWORK,
                code: 0,
                message: 'SSL error',
                timestamp: new Date().toISOString(),
                retryable: true,
                details: { errorCode: 'CERT_UNTRUSTED' },
            };

            expect(networkHandler.shouldRetryNetworkError(sslError)).toBe(false);
        });

        it('should not retry non-retryable errors', () => {
            const nonRetryableError = {
                type: TumblrErrorType.NETWORK,
                code: 0,
                message: 'Non-retryable error',
                timestamp: new Date().toISOString(),
                retryable: false,
                details: {},
            };

            expect(networkHandler.shouldRetryNetworkError(nonRetryableError)).toBe(false);
        });

        it('should calculate retry delay with exponential backoff', () => {
            const error = {
                type: TumblrErrorType.NETWORK,
                code: 0,
                message: 'Network error',
                timestamp: new Date().toISOString(),
                retryable: true,
                details: {},
            };

            const delay1 = networkHandler.calculateRetryDelay(1, error);
            const delay2 = networkHandler.calculateRetryDelay(2, error);
            const delay3 = networkHandler.calculateRetryDelay(3, error);

            expect(delay1).toBeGreaterThanOrEqual(DEFAULT_NETWORK_CONFIG.retryDelay);
            expect(delay2).toBeGreaterThan(delay1);
            expect(delay3).toBeGreaterThan(delay2);
            expect(delay3).toBeLessThanOrEqual(DEFAULT_NETWORK_CONFIG.maxRetryDelay);
        });

        it('should use retry-after value when provided', () => {
            const errorWithRetryAfter = {
                type: TumblrErrorType.NETWORK,
                code: 429,
                message: 'Rate limited',
                timestamp: new Date().toISOString(),
                retryable: true,
                retryAfter: 5,
                details: {},
            };

            const delay = networkHandler.calculateRetryDelay(1, errorWithRetryAfter);
            expect(delay).toBe(5000); // 5 seconds in milliseconds
        });
    });

    describe('Execute with Retry', () => {
        it('should execute successful operation without retry', async () => {
            const mockOperation = jest.fn().mockResolvedValue('success');

            const result = await networkHandler.executeWithRetry(mockOperation, 'test_op');

            expect(result.success).toBe(true);
            expect(result.data).toBe('success');
            expect(result.attempts).toBe(1);
            expect(mockOperation).toHaveBeenCalledTimes(1);
        });

        it('should retry on retryable network errors', async () => {
            const mockOperation = jest.fn()
                .mockRejectedValueOnce(Object.assign(new Error('Connection timeout'), { code: 'ETIMEDOUT' }))
                .mockRejectedValueOnce(Object.assign(new Error('Connection timeout'), { code: 'ETIMEDOUT' }))
                .mockResolvedValue('success');

            const result = await networkHandler.executeWithRetry(mockOperation, 'retry_test');

            expect(result.success).toBe(true);
            expect(result.data).toBe('success');
            expect(result.attempts).toBe(3);
            expect(mockOperation).toHaveBeenCalledTimes(3);
        });

        it('should not retry on non-retryable errors', async () => {
            const sslError = Object.assign(new Error('SSL error'), { code: 'CERT_UNTRUSTED' });
            const mockOperation = jest.fn().mockRejectedValue(sslError);

            const result = await networkHandler.executeWithRetry(mockOperation, 'ssl_test');

            expect(result.success).toBe(false);
            expect(result.attempts).toBe(1);
            expect(result.error?.retryable).toBe(false);
            expect(mockOperation).toHaveBeenCalledTimes(1);
        });

        it('should stop retrying after max attempts', async () => {
            const timeoutError = Object.assign(new Error('Timeout'), { code: 'ETIMEDOUT' });
            const mockOperation = jest.fn().mockRejectedValue(timeoutError);

            const customHandler = new NetworkErrorHandler({ maxRetries: 2 });
            const result = await customHandler.executeWithRetry(mockOperation, 'max_retry_test');

            expect(result.success).toBe(false);
            expect(result.attempts).toBe(3); // 1 initial + 2 retries
            expect(mockOperation).toHaveBeenCalledTimes(3);

            customHandler.destroy();
        });

        it('should handle timeout during operation execution', async () => {
            const slowOperation = () => new Promise(resolve => setTimeout(resolve, 100000)); // 100 seconds

            const fastHandler = new NetworkErrorHandler({ timeout: 100 }); // 100ms timeout
            const result = await fastHandler.executeWithRetry(slowOperation, 'timeout_test');

            expect(result.success).toBe(false);
            expect(result.error?.message).toContain('timed out');

            fastHandler.destroy();
        }, 10000);
    });

    describe('Network Failure Pattern Detection', () => {
        it('should detect no errors pattern', () => {
            const pattern = networkHandler.detectNetworkFailurePattern([]);

            expect(pattern.pattern).toBe('no_errors');
            expect(pattern.severity).toBe('low');
            expect(pattern.recommendation).toContain('normally');
        });

        it('should detect high timeout rate pattern', () => {
            const timeoutErrors = Array(6).fill(null).map(() => ({
                type: TumblrErrorType.NETWORK,
                code: 408,
                message: 'Network timeout during operation',
                timestamp: new Date().toISOString(),
                retryable: true,
                details: { errorCode: 'ETIMEDOUT' },
            }));

            const pattern = networkHandler.detectNetworkFailurePattern(timeoutErrors);

            expect(pattern.pattern).toBe('high_timeout_rate');
            expect(pattern.severity).toBe('high');
            expect(pattern.recommendation).toContain('timeout');
        });

        it('should detect connection instability pattern', () => {
            const connectionErrors = Array(6).fill(null).map(() => ({
                type: TumblrErrorType.NETWORK,
                code: 0,
                message: 'Connection refused',
                timestamp: new Date().toISOString(),
                retryable: true,
                details: { errorCode: 'ECONNREFUSED' },
            }));

            const pattern = networkHandler.detectNetworkFailurePattern(connectionErrors);

            expect(pattern.pattern).toBe('connection_instability');
            expect(pattern.severity).toBe('high');
            expect(pattern.recommendation).toContain('connectivity');
        });

        it('should detect DNS resolution failure pattern', () => {
            const dnsErrors = Array(4).fill(null).map(() => ({
                type: TumblrErrorType.NETWORK,
                code: 0,
                message: 'DNS resolution failed',
                timestamp: new Date().toISOString(),
                retryable: true,
                details: { errorCode: 'ENOTFOUND' },
            }));

            const pattern = networkHandler.detectNetworkFailurePattern(dnsErrors);

            expect(pattern.pattern).toBe('dns_resolution_failure');
            expect(pattern.severity).toBe('medium');
            expect(pattern.recommendation).toContain('DNS');
        });

        it('should detect general network instability pattern', () => {
            const mixedErrors = [
                { type: TumblrErrorType.NETWORK, code: 0, message: 'Error 1', timestamp: new Date().toISOString(), retryable: true, details: { errorCode: 'ETIMEDOUT' } },
                { type: TumblrErrorType.NETWORK, code: 0, message: 'Error 2', timestamp: new Date().toISOString(), retryable: true, details: { errorCode: 'ECONNRESET' } },
                { type: TumblrErrorType.NETWORK, code: 0, message: 'Error 3', timestamp: new Date().toISOString(), retryable: true, details: { errorCode: 'ENOTFOUND' } },
                { type: TumblrErrorType.NETWORK, code: 0, message: 'Error 4', timestamp: new Date().toISOString(), retryable: true, details: { errorCode: 'ETIMEDOUT' } },
                { type: TumblrErrorType.NETWORK, code: 0, message: 'Error 5', timestamp: new Date().toISOString(), retryable: true, details: { errorCode: 'ECONNREFUSED' } },
            ];

            const pattern = networkHandler.detectNetworkFailurePattern(mixedErrors);

            expect(pattern.pattern).toBe('general_network_instability');
            expect(pattern.severity).toBe('medium');
            expect(pattern.recommendation).toContain('unstable');
        });

        it('should detect sporadic errors pattern', () => {
            const sporadicErrors = [
                { type: TumblrErrorType.NETWORK, code: 0, message: 'Error 1', timestamp: new Date().toISOString(), retryable: true, details: {} },
                { type: TumblrErrorType.NETWORK, code: 0, message: 'Error 2', timestamp: new Date().toISOString(), retryable: true, details: {} },
            ];

            const pattern = networkHandler.detectNetworkFailurePattern(sporadicErrors);

            expect(pattern.pattern).toBe('sporadic_errors');
            expect(pattern.severity).toBe('low');
            expect(pattern.recommendation).toContain('normal');
        });
    });

    describe('Connection Pool Management', () => {
        it('should provide HTTPS agent for connection pooling', () => {
            const agent = networkHandler.getHttpsAgent();

            expect(agent).toBeDefined();
            expect(agent.constructor.name).toBe('Agent');
        });

        it('should track connection statistics', () => {
            const initialStats = networkHandler.getConnectionStats();

            expect(initialStats.totalRequests).toBe(0);
            expect(initialStats.failedRequests).toBe(0);
            expect(initialStats.activeConnections).toBe(0);
            expect(initialStats.averageResponseTime).toBe(0);
        });

        it('should reset connection statistics', () => {
            networkHandler.resetConnectionStats();
            const stats = networkHandler.getConnectionStats();

            expect(stats.totalRequests).toBe(0);
            expect(stats.failedRequests).toBe(0);
            expect(stats.activeConnections).toBe(0);
            expect(stats.averageResponseTime).toBe(0);
        });

        it('should update statistics during operations', async () => {
            const mockOperation = jest.fn().mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve('success'), 10))
            );

            await networkHandler.executeWithRetry(mockOperation, 'stats_test');
            const stats = networkHandler.getConnectionStats();

            expect(stats.totalRequests).toBe(1);
            expect(stats.failedRequests).toBe(0);
            expect(stats.averageResponseTime).toBeGreaterThan(0);
        });
    });

    describe('Health Check', () => {
        it('should perform network health check', async () => {
            const healthResult = await networkHandler.performHealthCheck();

            expect(healthResult).toHaveProperty('healthy');
            expect(healthResult).toHaveProperty('latency');
            expect(healthResult).toHaveProperty('details');
            expect(typeof healthResult.latency).toBe('number');
        });
    });

    describe('Resource Management', () => {
        it('should destroy resources properly', () => {
            const handler = new NetworkErrorHandler();

            expect(() => handler.destroy()).not.toThrow();

            const stats = handler.getConnectionStats();
            expect(stats.totalRequests).toBe(0);
        });
    });
});