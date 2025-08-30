import { Agent } from 'https';
import { TumblrError, TumblrErrorType } from './ErrorHandler';

/**
 * Configuration options for network operations
 */
export interface NetworkConfig {
    timeout: number;
    maxRetries: number;
    retryDelay: number;
    maxRetryDelay: number;
    connectionPoolSize: number;
    keepAlive: boolean;
    keepAliveMsecs: number;
}

/**
 * Default network configuration
 */
export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
    timeout: 30000, // 30 seconds
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    maxRetryDelay: 30000, // 30 seconds
    connectionPoolSize: 10,
    keepAlive: true,
    keepAliveMsecs: 60000, // 1 minute
};

/**
 * Connection pool statistics
 */
export interface ConnectionPoolStats {
    activeConnections: number;
    idleConnections: number;
    totalRequests: number;
    failedRequests: number;
    averageResponseTime: number;
}

/**
 * Network operation result
 */
export interface NetworkOperationResult<T> {
    success: boolean;
    data?: T;
    error?: TumblrError;
    attempts: number;
    totalTime: number;
}

/**
 * Comprehensive network error handler for Tumblr API operations
 * Handles timeouts, connection retry logic, network failure detection and recovery,
 * and connection pooling management
 */
export class NetworkErrorHandler {
    private config: NetworkConfig;
    private httpsAgent: Agent;
    private connectionStats: ConnectionPoolStats;
    private requestTimes: number[] = [];

    constructor(config: Partial<NetworkConfig> = {}) {
        this.config = { ...DEFAULT_NETWORK_CONFIG, ...config };
        this.httpsAgent = this.createHttpsAgent();
        this.connectionStats = {
            activeConnections: 0,
            idleConnections: 0,
            totalRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
        };
    }

    /**
     * Creates and configures HTTPS agent for connection pooling
     */
    private createHttpsAgent(): Agent {
        return new Agent({
            keepAlive: this.config.keepAlive,
            keepAliveMsecs: this.config.keepAliveMsecs,
            maxSockets: this.config.connectionPoolSize,
            maxFreeSockets: Math.floor(this.config.connectionPoolSize / 2),
            timeout: this.config.timeout,
        });
    }

    /**
     * Executes a network operation with retry logic and error handling
     */
    public async executeWithRetry<T>(
        operation: () => Promise<T>,
        operationName: string = 'network_operation'
    ): Promise<NetworkOperationResult<T>> {
        const startTime = Date.now();
        let lastError: any;
        let attempts = 0;

        for (attempts = 1; attempts <= this.config.maxRetries + 1; attempts++) {
            try {
                this.connectionStats.totalRequests++;
                this.connectionStats.activeConnections++;

                const operationStartTime = Date.now();
                const result = await this.executeWithTimeout(operation);
                const operationTime = Date.now() - operationStartTime;

                this.connectionStats.activeConnections--;
                this.updateResponseTimeStats(operationTime);

                return {
                    success: true,
                    data: result,
                    attempts,
                    totalTime: Date.now() - startTime,
                };
            } catch (error) {
                this.connectionStats.activeConnections--;
                this.connectionStats.failedRequests++;
                lastError = error;

                const tumblrError = this.classifyNetworkError(error, operationName);

                // Don't retry if it's not a retryable error
                if (!this.shouldRetryNetworkError(tumblrError)) {
                    return {
                        success: false,
                        error: tumblrError,
                        attempts,
                        totalTime: Date.now() - startTime,
                    };
                }

                // Don't retry if we've reached max attempts
                if (attempts >= this.config.maxRetries + 1) {
                    break;
                }

                // Wait before retrying
                const delay = this.calculateRetryDelay(attempts, tumblrError);
                await this.delay(delay);
            }
        }

        // All retries exhausted
        const finalError = this.classifyNetworkError(lastError, operationName);
        return {
            success: false,
            error: finalError,
            attempts,
            totalTime: Date.now() - startTime,
        };
    }

    /**
     * Executes operation with timeout handling
     */
    private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Operation timed out after ${this.config.timeout}ms`));
            }, this.config.timeout);

            operation()
                .then((result) => {
                    clearTimeout(timeoutId);
                    resolve(result);
                })
                .catch((error) => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
    }

    /**
     * Classifies network-related errors
     */
    public classifyNetworkError(error: any, operationName: string): TumblrError {
        const timestamp = new Date().toISOString();

        // Timeout errors
        if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT' || error.name === 'TimeoutError') {
            return {
                type: TumblrErrorType.NETWORK,
                code: 408,
                message: `Network timeout during ${operationName} - Operation exceeded ${this.config.timeout}ms limit`,
                details: {
                    operationName,
                    timeout: this.config.timeout,
                    errorCode: error.code,
                },
                timestamp,
                retryable: true,
                originalError: error,
            };
        }

        // Connection refused
        if (error.code === 'ECONNREFUSED') {
            return {
                type: TumblrErrorType.NETWORK,
                code: 0,
                message: `Connection refused during ${operationName} - Unable to connect to Tumblr API server`,
                details: {
                    operationName,
                    errorCode: error.code,
                    host: error.hostname || 'api.tumblr.com',
                    port: error.port || 443,
                },
                timestamp,
                retryable: true,
                originalError: error,
            };
        }

        // DNS resolution failure
        if (error.code === 'ENOTFOUND') {
            return {
                type: TumblrErrorType.NETWORK,
                code: 0,
                message: `DNS resolution failed during ${operationName} - Cannot resolve Tumblr API hostname`,
                details: {
                    operationName,
                    errorCode: error.code,
                    hostname: error.hostname || 'api.tumblr.com',
                },
                timestamp,
                retryable: true,
                originalError: error,
            };
        }

        // Network unreachable
        if (error.code === 'ENETUNREACH') {
            return {
                type: TumblrErrorType.NETWORK,
                code: 0,
                message: `Network unreachable during ${operationName} - Cannot reach Tumblr API server`,
                details: {
                    operationName,
                    errorCode: error.code,
                },
                timestamp,
                retryable: true,
                originalError: error,
            };
        }

        // Connection reset
        if (error.code === 'ECONNRESET') {
            return {
                type: TumblrErrorType.NETWORK,
                code: 0,
                message: `Connection reset during ${operationName} - Server closed the connection unexpectedly`,
                details: {
                    operationName,
                    errorCode: error.code,
                },
                timestamp,
                retryable: true,
                originalError: error,
            };
        }

        // Socket hang up
        if (error.code === 'ECONNABORTED' || error.message?.includes('socket hang up')) {
            return {
                type: TumblrErrorType.NETWORK,
                code: 0,
                message: `Connection aborted during ${operationName} - Socket connection was terminated`,
                details: {
                    operationName,
                    errorCode: error.code,
                },
                timestamp,
                retryable: true,
                originalError: error,
            };
        }

        // SSL/TLS errors
        if (error.code?.startsWith('CERT_') || error.message?.includes('certificate')) {
            return {
                type: TumblrErrorType.NETWORK,
                code: 0,
                message: `SSL/TLS error during ${operationName} - Certificate validation failed`,
                details: {
                    operationName,
                    errorCode: error.code,
                    reason: error.reason,
                },
                timestamp,
                retryable: false, // SSL errors are usually not retryable
                originalError: error,
            };
        }

        // Generic network error
        return {
            type: TumblrErrorType.NETWORK,
            code: 0,
            message: `Network error during ${operationName}: ${error.message || 'Unknown network error'}`,
            details: {
                operationName,
                errorCode: error.code,
                originalMessage: error.message,
            },
            timestamp,
            retryable: true,
            originalError: error,
        };
    }

    /**
     * Determines if a network error should be retried
     */
    public shouldRetryNetworkError(error: TumblrError): boolean {
        // Don't retry SSL/certificate errors
        if (error.details?.errorCode?.startsWith('CERT_')) {
            return false;
        }

        // Don't retry if explicitly marked as non-retryable
        if (!error.retryable) {
            return false;
        }

        // Retry network errors by default
        return error.type === TumblrErrorType.NETWORK;
    }

    /**
     * Calculates retry delay with exponential backoff
     */
    public calculateRetryDelay(attempt: number, error: TumblrError): number {
        // Use specific retry-after if provided
        if (error.retryAfter) {
            return error.retryAfter * 1000;
        }

        // Exponential backoff with jitter
        const baseDelay = this.config.retryDelay;
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
        const totalDelay = exponentialDelay + jitter;

        return Math.min(totalDelay, this.config.maxRetryDelay);
    }

    /**
     * Detects network failure patterns and suggests recovery actions
     */
    public detectNetworkFailurePattern(errors: TumblrError[]): {
        pattern: string;
        severity: 'low' | 'medium' | 'high';
        recommendation: string;
    } {
        if (errors.length === 0) {
            return {
                pattern: 'no_errors',
                severity: 'low',
                recommendation: 'Network is operating normally',
            };
        }

        const recentErrors = errors.slice(-10); // Last 10 errors
        // const errorCodes = recentErrors.map(e => e.details?.errorCode).filter(Boolean);
        const timeoutErrors = recentErrors.filter(e => e.message.includes('timeout')).length;
        const connectionErrors = recentErrors.filter(e =>
            e.details?.errorCode === 'ECONNREFUSED' ||
            e.details?.errorCode === 'ECONNRESET'
        ).length;
        const dnsErrors = recentErrors.filter(e => e.details?.errorCode === 'ENOTFOUND').length;

        // High timeout rate
        if (timeoutErrors >= 5) {
            return {
                pattern: 'high_timeout_rate',
                severity: 'high',
                recommendation: 'Increase timeout values or check network latency. Consider reducing request frequency.',
            };
        }

        // Frequent connection issues
        if (connectionErrors >= 5) {
            return {
                pattern: 'connection_instability',
                severity: 'high',
                recommendation: 'Check network connectivity and firewall settings. Tumblr API may be experiencing issues.',
            };
        }

        // DNS resolution problems
        if (dnsErrors >= 3) {
            return {
                pattern: 'dns_resolution_failure',
                severity: 'medium',
                recommendation: 'Check DNS settings and network configuration. Try using alternative DNS servers.',
            };
        }

        // Mixed errors
        if (recentErrors.length >= 5) {
            return {
                pattern: 'general_network_instability',
                severity: 'medium',
                recommendation: 'Network appears unstable. Consider implementing circuit breaker pattern or reducing request rate.',
            };
        }

        return {
            pattern: 'sporadic_errors',
            severity: 'low',
            recommendation: 'Occasional network errors are normal. Monitor for patterns.',
        };
    }

    /**
     * Gets the configured HTTPS agent for connection pooling
     */
    public getHttpsAgent(): Agent {
        return this.httpsAgent;
    }

    /**
     * Gets current connection pool statistics
     */
    public getConnectionStats(): ConnectionPoolStats {
        return { ...this.connectionStats };
    }

    /**
     * Resets connection pool statistics
     */
    public resetConnectionStats(): void {
        this.connectionStats = {
            activeConnections: 0,
            idleConnections: 0,
            totalRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
        };
        this.requestTimes = [];
    }

    /**
     * Updates network configuration
     */
    public updateConfig(newConfig: Partial<NetworkConfig>): void {
        this.config = { ...this.config, ...newConfig };

        // Recreate HTTPS agent if connection-related settings changed
        if (newConfig.connectionPoolSize || newConfig.keepAlive || newConfig.keepAliveMsecs || newConfig.timeout) {
            this.httpsAgent.destroy();
            this.httpsAgent = this.createHttpsAgent();
        }
    }

    /**
     * Destroys the connection pool and cleans up resources
     */
    public destroy(): void {
        this.httpsAgent.destroy();
        this.resetConnectionStats();
    }

    /**
     * Updates response time statistics
     */
    private updateResponseTimeStats(responseTime: number): void {
        this.requestTimes.push(responseTime);

        // Keep only last 100 response times for average calculation
        if (this.requestTimes.length > 100) {
            this.requestTimes = this.requestTimes.slice(-100);
        }

        // Calculate average response time
        this.connectionStats.averageResponseTime =
            this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length;
    }

    /**
     * Utility method for creating delays
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Performs network health check
     */
    public async performHealthCheck(): Promise<{
        healthy: boolean;
        latency: number;
        details: string;
    }> {
        const startTime = Date.now();

        try {
            // Simple DNS resolution test
            const dns = require('dns').promises;
            await dns.lookup('api.tumblr.com');

            const latency = Date.now() - startTime;

            return {
                healthy: true,
                latency,
                details: `Network health check passed. DNS resolution took ${latency}ms`,
            };
        } catch (error: any) {
            const latency = Date.now() - startTime;

            return {
                healthy: false,
                latency,
                details: `Network health check failed: ${error.message}`,
            };
        }
    }
}