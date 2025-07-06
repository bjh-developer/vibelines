export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: number;
  retryable: boolean;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  createError(
    type: ErrorType,
    message: string,
    originalError?: Error,
    context?: Record<string, any>,
    retryable: boolean = true
  ): AppError {
    const error: AppError = {
      type,
      message,
      originalError,
      context,
      timestamp: Date.now(),
      retryable
    };

    this.logError(error);
    return error;
  }

  private logError(error: AppError): void {
    // Add to internal log
    this.errorLog.unshift(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Console logging with appropriate level
    const logData = {
      type: error.type,
      message: error.message,
      context: error.context,
      timestamp: new Date(error.timestamp).toISOString()
    };

    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
      case ErrorType.API_ERROR:
        console.warn('API/Network Error:', logData);
        break;
      case ErrorType.PROCESSING_ERROR:
      case ErrorType.VALIDATION_ERROR:
        console.error('Processing Error:', logData);
        break;
      case ErrorType.CACHE_ERROR:
      case ErrorType.STORAGE_ERROR:
        console.warn('Storage Error:', logData);
        break;
      default:
        console.error('Unknown Error:', logData);
    }

    // In production, send to error reporting service
    if (import.meta.env.PROD) {
      this.reportError(error);
    }
  }

  private reportError(_error: AppError): void {
    // Example: Send to error reporting service
    // This would be replaced with actual error reporting service integration
    try {
      // errorReportingService.captureException(error.originalError || new Error(error.message), {
      //   tags: { type: error.type },
      //   extra: { context: error.context, timestamp: error.timestamp }
      // });
    } catch (reportingError) {
      console.warn('Failed to report error:', reportingError);
    }
  }

  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }

  // Specific error creators
  networkError(message: string, originalError?: Error, context?: Record<string, any>): AppError {
    return this.createError(ErrorType.NETWORK_ERROR, message, originalError, context, true);
  }

  apiError(message: string, originalError?: Error, context?: Record<string, any>): AppError {
    return this.createError(ErrorType.API_ERROR, message, originalError, context, true);
  }

  cacheError(message: string, originalError?: Error, context?: Record<string, any>): AppError {
    return this.createError(ErrorType.CACHE_ERROR, message, originalError, context, false);
  }

  processingError(message: string, originalError?: Error, context?: Record<string, any>): AppError {
    return this.createError(ErrorType.PROCESSING_ERROR, message, originalError, context, true);
  }

  storageError(message: string, originalError?: Error, context?: Record<string, any>): AppError {
    return this.createError(ErrorType.STORAGE_ERROR, message, originalError, context, false);
  }

  validationError(message: string, context?: Record<string, any>): AppError {
    return this.createError(ErrorType.VALIDATION_ERROR, message, undefined, context, false);
  }
}

// Retry utility with exponential backoff
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    backoffMultiplier: number = 2
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
        
        console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

// Circuit breaker pattern for API calls
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw ErrorHandler.getInstance().apiError(
          'Circuit breaker is OPEN - too many recent failures',
          undefined,
          { state: this.state, failures: this.failures }
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'CLOSED';
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  errorMessage: string,
  context?: Record<string, any>
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    errorHandler.processingError(errorMessage, error as Error, context);
    return null;
  }
};

export const handleStorageOperation = <T>(
  operation: () => T,
  errorMessage: string,
  fallback: T,
  context?: Record<string, any>
): T => {
  try {
    return operation();
  } catch (error) {
    errorHandler.storageError(errorMessage, error as Error, context);
    return fallback;
  }
};

// User-friendly error messages
export const getUserFriendlyMessage = (error: AppError): string => {
  switch (error.type) {
    case ErrorType.NETWORK_ERROR:
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    case ErrorType.API_ERROR:
      return 'There was a problem with the music analysis service. Please try again in a moment.';
    case ErrorType.CACHE_ERROR:
      return 'There was an issue with local data storage. Your analysis may take longer than usual.';
    case ErrorType.PROCESSING_ERROR:
      return 'We encountered an issue while analyzing your music. Please try again.';
    case ErrorType.STORAGE_ERROR:
      return 'Unable to save your data locally. Please ensure you have sufficient storage space.';
    case ErrorType.VALIDATION_ERROR:
      return 'The provided data is invalid. Please check your input and try again.';
    default:
      return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }
};

