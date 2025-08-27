import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { NetworkErrorHandler } from './NetworkErrorHandler';

/**
 * Enumeration of Tumblr-specific error types for classification
 */
export enum TumblrErrorType {
    AUTHENTICATION = 'authentication',
    RATE_LIMIT = 'rate_limit',
    NETWORK = 'network',
    VALIDATION = 'validation',
    API_ERROR = 'api_error',
    UNKNOWN = 'unknown',
}

/**
 * Interface for structured Tumblr error information
 */
export interface TumblrError {
    type: TumblrErrorType;
    code: number;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    retryable: boolean;
    retryAfter?: number;
    originalError?: any;
}

/**
 * Comprehensive error handler for Tumblr API operations
 * Provides error classification, user-friendly messages, and troubleshooting guidance
 */
export class ErrorHandler {
    private networkHandler: NetworkErrorHandler;

    constructor() {
        this.networkHandler = new NetworkErrorHandler();
    }
    /**
     * Classifies an error based on its characteristics and returns structured error information
     */
    public classifyError(error: any): TumblrError {
        const timestamp = new Date().toISOString();

        // Handle axios/HTTP errors
        if (error.response) {
            const status = error.response.status;
            const responseData = error.response.data;

            return this.classifyHttpError(status, responseData, error, timestamp);
        }

        // Handle network/connection errors using NetworkErrorHandler
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' ||
            error.message?.includes('timeout') || error.name === 'TimeoutError') {
            return this.networkHandler.classifyNetworkError(error, 'api_operation');
        }

        // Handle validation errors
        if (error.name === 'ValidationError' || error.message?.includes('validation')) {
            return {
                type: TumblrErrorType.VALIDATION,
                code: 400,
                message: this.getValidationErrorMessage(error),
                details: error.details || {},
                timestamp,
                retryable: false,
                originalError: error,
            };
        }

        // Handle authentication errors
        if (error.message?.includes('auth') || error.message?.includes('token') || error.message?.includes('credential')) {
            return {
                type: TumblrErrorType.AUTHENTICATION,
                code: 401,
                message: this.getAuthenticationErrorMessage(error),
                details: {},
                timestamp,
                retryable: false,
                originalError: error,
            };
        }

        // Default to unknown error
        return {
            type: TumblrErrorType.UNKNOWN,
            code: 500,
            message: `Unknown error occurred: ${error.message || 'No error message available'}`,
            details: { originalMessage: error.message },
            timestamp,
            retryable: false,
            originalError: error,
        };
    }

    /**
     * Classifies HTTP errors based on status codes and response data
     */
    private classifyHttpError(status: number, responseData: any, originalError: any, timestamp: string): TumblrError {
        switch (status) {
            case 400:
                return {
                    type: TumblrErrorType.VALIDATION,
                    code: status,
                    message: this.getBadRequestMessage(responseData),
                    details: responseData,
                    timestamp,
                    retryable: false,
                    originalError,
                };

            case 401:
                return {
                    type: TumblrErrorType.AUTHENTICATION,
                    code: status,
                    message: this.getUnauthorizedMessage(responseData),
                    details: responseData,
                    timestamp,
                    retryable: false,
                    originalError,
                };

            case 403:
                return {
                    type: TumblrErrorType.AUTHENTICATION,
                    code: status,
                    message: this.getForbiddenMessage(responseData),
                    details: responseData,
                    timestamp,
                    retryable: false,
                    originalError,
                };

            case 404:
                return {
                    type: TumblrErrorType.API_ERROR,
                    code: status,
                    message: this.getNotFoundMessage(responseData),
                    details: responseData,
                    timestamp,
                    retryable: false,
                    originalError,
                };

            case 429:
                const retryAfter = this.extractRetryAfter(originalError.response?.headers);
                return {
                    type: TumblrErrorType.RATE_LIMIT,
                    code: status,
                    message: this.getRateLimitMessage(retryAfter),
                    details: responseData,
                    timestamp,
                    retryable: true,
                    retryAfter,
                    originalError,
                };

            case 500:
            case 502:
            case 503:
            case 504:
                return {
                    type: TumblrErrorType.API_ERROR,
                    code: status,
                    message: this.getServerErrorMessage(status, responseData),
                    details: responseData,
                    timestamp,
                    retryable: true,
                    originalError,
                };

            default:
                return {
                    type: TumblrErrorType.API_ERROR,
                    code: status,
                    message: `HTTP ${status}: ${responseData?.message || 'Unknown API error'}`,
                    details: responseData,
                    timestamp,
                    retryable: status >= 500,
                    originalError,
                };
        }
    }

    /**
     * Formats error message for user display with troubleshooting guidance
     */
    public formatErrorMessage(error: TumblrError): string {
        const baseMessage = `Tumblr API Error (${error.type}): ${error.message}`;
        const troubleshooting = this.getTroubleshootingGuidance(error);

        return troubleshooting ? `${baseMessage}\n\nTroubleshooting: ${troubleshooting}` : baseMessage;
    }

    /**
     * Determines if an error should trigger a retry attempt
     */
    public shouldRetry(error: TumblrError): boolean {
        return error.retryable;
    }

    /**
     * Calculates retry delay based on error type and attempt number
     */
    public getRetryDelay(error: TumblrError, attempt: number): number {
        if (error.type === TumblrErrorType.RATE_LIMIT && error.retryAfter) {
            return error.retryAfter * 1000; // Convert to milliseconds
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, etc.
        return Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Max 30 seconds
    }

    /**
     * Executes an operation with network error handling and retry logic
     */
    public async executeWithNetworkRetry<T>(
        operation: () => Promise<T>,
        operationName: string = 'tumblr_operation'
    ): Promise<T> {
        const result = await this.networkHandler.executeWithRetry(operation, operationName);

        if (result.success) {
            return result.data!;
        } else {
            throw new Error(this.formatErrorMessage(result.error!));
        }
    }

    /**
     * Gets network connection statistics
     */
    public getNetworkStats() {
        return this.networkHandler.getConnectionStats();
    }

    /**
     * Gets the HTTPS agent for connection pooling
     */
    public getHttpsAgent() {
        return this.networkHandler.getHttpsAgent();
    }

    /**
     * Performs network health check
     */
    public async performNetworkHealthCheck() {
        return this.networkHandler.performHealthCheck();
    }

    /**
     * Detects network failure patterns
     */
    public detectNetworkFailurePattern(errors: TumblrError[]) {
        return this.networkHandler.detectNetworkFailurePattern(errors);
    }

    /**
     * Destroys network resources
     */
    public destroy(): void {
        this.networkHandler.destroy();
    }

    /**
     * Creates an n8n-compatible error for throwing
     */
    public createN8nError(error: TumblrError, node: any): NodeApiError | NodeOperationError {
        const errorMessage = this.formatErrorMessage(error);

        if (error.type === TumblrErrorType.VALIDATION) {
            return new NodeOperationError(node, errorMessage, {
                description: this.getTroubleshootingGuidance(error),
            });
        }

        return new NodeApiError(node, error.originalError || new Error(errorMessage), {
            message: errorMessage,
            description: this.getTroubleshootingGuidance(error),
            httpCode: error.code.toString(),
        });
    }

    // Private helper methods for generating specific error messages

    private getNetworkErrorMessage(code: string): string {
        switch (code) {
            case 'ECONNREFUSED':
                return 'Connection refused - Unable to connect to Tumblr API';
            case 'ENOTFOUND':
                return 'DNS resolution failed - Cannot resolve Tumblr API hostname';
            case 'ETIMEDOUT':
                return 'Connection timeout - Tumblr API did not respond in time';
            default:
                return `Network error: ${code}`;
        }
    }

    private getValidationErrorMessage(error: any): string {
        if (error.details && typeof error.details === 'object') {
            const fieldErrors = Object.entries(error.details)
                .map(([field, message]) => `${field}: ${message}`)
                .join(', ');
            return `Validation failed - ${fieldErrors}`;
        }
        return `Validation error: ${error.message || 'Invalid input data'}`;
    }

    private getAuthenticationErrorMessage(error: any): string {
        if (error.message?.includes('token')) {
            return 'Authentication failed - Invalid or expired access token';
        }
        if (error.message?.includes('credential')) {
            return 'Authentication failed - Invalid credentials provided';
        }
        return 'Authentication failed - Please check your Tumblr API credentials';
    }

    private getBadRequestMessage(responseData: any): string {
        if (responseData?.errors) {
            return `Bad request: ${JSON.stringify(responseData.errors)}`;
        }
        return 'Bad request - Invalid parameters or request format';
    }

    private getUnauthorizedMessage(responseData: any): string {
        return 'Unauthorized - Invalid API credentials or expired token';
    }

    private getForbiddenMessage(responseData: any): string {
        return 'Forbidden - Insufficient permissions for this operation';
    }

    private getNotFoundMessage(responseData: any): string {
        if (responseData?.message?.includes('blog')) {
            return 'Blog not found - The specified blog does not exist or is not accessible';
        }
        if (responseData?.message?.includes('post')) {
            return 'Post not found - The specified post does not exist or has been deleted';
        }
        return 'Resource not found - The requested resource does not exist';
    }

    private getRateLimitMessage(retryAfter?: number): string {
        const baseMessage = 'Rate limit exceeded - Too many requests to Tumblr API';
        if (retryAfter) {
            return `${baseMessage}. Retry after ${retryAfter} seconds`;
        }
        return `${baseMessage}. Please wait before making more requests`;
    }

    private getServerErrorMessage(status: number, responseData: any): string {
        switch (status) {
            case 500:
                return 'Internal server error - Tumblr API is experiencing issues';
            case 502:
                return 'Bad gateway - Tumblr API gateway error';
            case 503:
                return 'Service unavailable - Tumblr API is temporarily unavailable';
            case 504:
                return 'Gateway timeout - Tumblr API response timeout';
            default:
                return `Server error (${status}) - Tumblr API error`;
        }
    }

    private extractRetryAfter(headers: any): number | undefined {
        if (!headers) return undefined;

        const retryAfter = headers['retry-after'] || headers['Retry-After'];
        if (retryAfter) {
            const seconds = parseInt(retryAfter, 10);
            return isNaN(seconds) ? undefined : seconds;
        }

        return undefined;
    }

    private getTroubleshootingGuidance(error: TumblrError): string {
        switch (error.type) {
            case TumblrErrorType.AUTHENTICATION:
                return 'Verify your Tumblr API credentials are correct and have not expired. Re-authenticate if necessary.';

            case TumblrErrorType.RATE_LIMIT:
                return 'Reduce the frequency of API requests or implement delays between operations. Tumblr allows 1000 requests per hour per user.';

            case TumblrErrorType.NETWORK:
                return 'Check your internet connection and firewall settings. Ensure Tumblr API endpoints are accessible.';

            case TumblrErrorType.VALIDATION:
                return 'Review the input parameters and ensure all required fields are provided with valid values.';

            case TumblrErrorType.API_ERROR:
                if (error.retryable) {
                    return 'This appears to be a temporary server issue. The operation will be retried automatically.';
                }
                return 'Check the Tumblr API documentation for the specific endpoint requirements and limitations.';

            default:
                return 'Check the error details and consult the Tumblr API documentation for more information.';
        }
    }
}