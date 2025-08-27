import { TumblrError, TumblrErrorType } from './ErrorHandler';

/**
 * Interface for rate limit information
 */
export interface RateLimitInfo {
    userId: string;
    requestCount: number;
    resetTime: number;
    limit: number;
}

/**
 * Interface for retry configuration
 */
export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableErrorTypes: TumblrErrorType[];
}

/**
 * Default retry configuration following Tumblr API best practices
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    retryableErrorTypes: [
        TumblrErrorType.RATE_LIMIT,
        TumblrErrorType.NETWORK,
        TumblrErrorType.API_ERROR, // Only for 5xx errors
    ],
};

/**
 * Comprehensive rate limiting and retry handler for Tumblr API operations
 * Implements automatic retry mechanisms with exponential backoff
 */
export class RateLimitHandler {
    private requestCounts: Map<string, number> = new Map();
    private resetTimes: Map<string, number> = new Map();
    private readonly TUMBLR_RATE_LIMIT = 1000; // 1000 requests per hour per user
    private readonly RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds

    /**
     * Checks if the user has exceeded rate limits
     */
    public async checkRateLimit(userId: string): Promise<boolean> {
        const now = Date.now();
        const resetTime = this.resetTimes.get(userId);

        // If no reset time exists or window has passed, reset counter
        if (!resetTime || now >= resetTime) {
            this.requestCounts.set(userId, 0);
            this.resetTimes.set(userId, now + this.RATE_LIMIT_WINDOW);
        }

        const currentCount = this.requestCounts.get(userId) || 0;
        return currentCount < this.TUMBLR_RATE_LIMIT;
    }

    /**
     * Records a request for rate limiting tracking
     */
    public recordRequest(userId: string): void {
        const currentCount = this.requestCounts.get(userId) || 0;
        this.requestCounts.set(userId, currentCount + 1);
    }

    /**
     * Gets current rate limit status for a user
     */
    public getRateLimitStatus(userId: string): RateLimitInfo {
        const now = Date.now();
        const resetTime = this.resetTimes.get(userId) || now + this.RATE_LIMIT_WINDOW;
        const requestCount = this.requestCounts.get(userId) || 0;

        return {
            userId,
            requestCount,
            resetTime,
            limit: this.TUMBLR_RATE_LIMIT,
        };
    }

    /**
     * Handles rate limit errors by waiting for the appropriate time
     */
    public async handleRateLimit(error: TumblrError): Promise<void> {
        if (error.type !== TumblrErrorType.RATE_LIMIT) {
            return;
        }

        const waitTime = error.retryAfter ? error.retryAfter * 1000 : this.getDefaultRateLimitDelay();

        console.log(`Rate limit exceeded. Waiting ${waitTime}ms before retry...`);
        await this.delay(waitTime);
    }

    /**
     * Executes an operation with automatic retry logic
     */
    public async executeWithRetry<T>(
        operation: () => Promise<T>,
        config: Partial<RetryConfig> = {},
        userId?: string
    ): Promise<T> {
        const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
        let lastError: TumblrError | Error | null = null;

        for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
            try {
                // Check rate limit before making request
                if (userId && !(await this.checkRateLimit(userId))) {
                    const rateLimitError: TumblrError = {
                        type: TumblrErrorType.RATE_LIMIT,
                        code: 429,
                        message: 'Rate limit exceeded - too many requests',
                        timestamp: new Date().toISOString(),
                        retryable: true,
                        retryAfter: this.getTimeUntilReset(userId),
                    };

                    if (attempt <= finalConfig.maxRetries) {
                        await this.handleRateLimit(rateLimitError);
                        continue;
                    } else {
                        throw rateLimitError;
                    }
                }

                // Record the request attempt
                if (userId) {
                    this.recordRequest(userId);
                }

                // Execute the operation
                const result = await operation();
                return result;

            } catch (error: any) {
                lastError = error;

                // Don't retry on the last attempt
                if (attempt > finalConfig.maxRetries) {
                    break;
                }

                // Check if error is retryable
                if (!this.shouldRetryError(error, finalConfig.retryableErrorTypes)) {
                    break;
                }

                // Handle specific error types
                if (error.type === TumblrErrorType.RATE_LIMIT) {
                    await this.handleRateLimit(error);
                } else {
                    // Calculate and wait for backoff delay
                    const delay = this.calculateBackoffDelay(attempt, finalConfig);
                    console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
                    await this.delay(delay);
                }
            }
        }

        // If we get here, all retries have been exhausted
        throw lastError || new Error('Operation failed after all retry attempts');
    }

    /**
     * Executes multiple operations with retry logic and respects rate limits
     */
    public async executeBatch<T>(
        operations: Array<() => Promise<T>>,
        config: Partial<RetryConfig> = {},
        userId?: string,
        batchDelay: number = 100
    ): Promise<T[]> {
        const results: T[] = [];

        for (let i = 0; i < operations.length; i++) {
            const operation = operations[i];

            // Add delay between batch operations to avoid overwhelming the API
            if (i > 0) {
                await this.delay(batchDelay);
            }

            const result = await this.executeWithRetry(operation, config, userId);
            results.push(result);
        }

        return results;
    }

    /**
     * Creates a rate-limited version of a function
     */
    public createRateLimitedFunction<T extends any[], R>(
        fn: (...args: T) => Promise<R>,
        config: Partial<RetryConfig> = {},
        userId?: string
    ): (...args: T) => Promise<R> {
        return async (...args: T): Promise<R> => {
            return this.executeWithRetry(() => fn(...args), config, userId);
        };
    }

    /**
     * Determines if an error should trigger a retry
     */
    private shouldRetryError(error: any, retryableTypes: TumblrErrorType[]): boolean {
        // Handle TumblrError objects
        if (error.type && retryableTypes.includes(error.type)) {
            // For API errors, only retry 5xx status codes
            if (error.type === TumblrErrorType.API_ERROR) {
                return error.code >= 500 && error.code < 600;
            }
            return true;
        }

        // Handle network errors by error code
        if (error.code) {
            const networkErrorCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'];
            return networkErrorCodes.includes(error.code);
        }

        // Handle HTTP status codes directly
        if (error.response?.status) {
            const status = error.response.status;
            return status === 429 || (status >= 500 && status < 600);
        }

        return false;
    }

    /**
     * Calculates exponential backoff delay with jitter
     */
    private calculateBackoffDelay(attempt: number, config: RetryConfig): number {
        const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);

        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * exponentialDelay;
        const totalDelay = exponentialDelay + jitter;

        // Cap at maximum delay
        return Math.min(totalDelay, config.maxDelay);
    }

    /**
     * Gets the default delay for rate limit errors when no retry-after header is present
     */
    private getDefaultRateLimitDelay(): number {
        // Default to 60 seconds for rate limit errors
        return 60000;
    }

    /**
     * Gets the time until rate limit reset for a user
     */
    private getTimeUntilReset(userId: string): number {
        const resetTime = this.resetTimes.get(userId) || Date.now();
        const timeUntilReset = Math.max(0, resetTime - Date.now());
        return Math.ceil(timeUntilReset / 1000); // Return in seconds
    }

    /**
     * Utility method to create a delay
     */
    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Resets rate limit counters for a user (useful for testing)
     */
    public resetRateLimit(userId: string): void {
        this.requestCounts.delete(userId);
        this.resetTimes.delete(userId);
    }

    /**
     * Clears all rate limit data (useful for cleanup)
     */
    public clearAllRateLimits(): void {
        this.requestCounts.clear();
        this.resetTimes.clear();
    }

    /**
     * Gets statistics about current rate limiting state
     */
    public getStatistics(): {
        totalUsers: number;
        activeUsers: number;
        totalRequests: number;
    } {
        const now = Date.now();
        let activeUsers = 0;
        let totalRequests = 0;

        for (const [userId, resetTime] of this.resetTimes.entries()) {
            if (resetTime > now) {
                activeUsers++;
            }
            totalRequests += this.requestCounts.get(userId) || 0;
        }

        return {
            totalUsers: this.requestCounts.size,
            activeUsers,
            totalRequests,
        };
    }
}