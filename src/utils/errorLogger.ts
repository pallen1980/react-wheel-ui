/**
 * Error logging utility for comprehensive error tracking and reporting
 */

export interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  category: 'network' | 'auth' | 'data' | 'ui' | 'system';
  message: string;
  details?: Record<string, any>;
  stack?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
}

export interface ErrorContext {
  userId?: string;
  operation?: string;
  retryCount?: number;
  networkStatus?: boolean;
  additionalData?: Record<string, any>;
  statusCode?: number;
  responseData?: any;
  invalidOption?: any;
  errorType?: string;
  optionsCount?: number;
  originalError?: string;
  friendlyMessage?: string;
  isRetryable?: boolean;
  isOfflineMode?: boolean;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 100; // Keep last 100 log entries
  private isDevelopment = import.meta.env.DEV;

  /**
   * Log an error with context
   */
  logError(
    message: string,
    error?: Error,
    category: ErrorLogEntry['category'] = 'system',
    context?: ErrorContext
  ): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      category,
      message,
      details: {
        ...context,
        errorName: error?.name,
        errorMessage: error?.message,
      },
      stack: error?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context?.userId,
    };

    this.addLogEntry(logEntry);

    // Console logging in development
    if (this.isDevelopment) {
      console.error(`[${category.toUpperCase()}] ${message}`, {
        error,
        context,
        logEntry
      });
    }
  }

  /**
   * Log a warning
   */
  logWarning(
    message: string,
    category: ErrorLogEntry['category'] = 'system',
    context?: ErrorContext
  ): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      category,
      message,
      details: context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context?.userId,
    };

    this.addLogEntry(logEntry);

    if (this.isDevelopment) {
      console.warn(`[${category.toUpperCase()}] ${message}`, { context, logEntry });
    }
  }

  /**
   * Log informational message
   */
  logInfo(
    message: string,
    category: ErrorLogEntry['category'] = 'system',
    context?: ErrorContext
  ): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      category,
      message,
      details: context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context?.userId,
    };

    this.addLogEntry(logEntry);

    if (this.isDevelopment) {
      console.info(`[${category.toUpperCase()}] ${message}`, { context, logEntry });
    }
  }

  /**
   * Log debug message (only in development)
   */
  logDebug(
    message: string,
    category: ErrorLogEntry['category'] = 'system',
    context?: ErrorContext
  ): void {
    if (!this.isDevelopment) return;

    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      category,
      message,
      details: context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context?.userId,
    };

    this.addLogEntry(logEntry);
    console.debug(`[${category.toUpperCase()}] ${message}`, { context, logEntry });
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count: number = 20): ErrorLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: ErrorLogEntry['category']): ErrorLogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Get error logs only
   */
  getErrorLogs(): ErrorLogEntry[] {
    return this.logs.filter(log => log.level === 'error');
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs for debugging or support
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Add log entry and maintain max log limit
   */
  private addLogEntry(entry: ErrorLogEntry): void {
    this.logs.push(entry);
    
    // Maintain max log limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

/**
 * Helper functions for common error scenarios
 */
export const logNetworkError = (
  operation: string,
  error: Error,
  context?: Omit<ErrorContext, 'operation'>
) => {
  errorLogger.logError(
    `Network error during ${operation}`,
    error,
    'network',
    { ...context, operation }
  );
};

export const logAuthError = (
  operation: string,
  error: Error,
  context?: Omit<ErrorContext, 'operation'>
) => {
  errorLogger.logError(
    `Authentication error during ${operation}`,
    error,
    'auth',
    { ...context, operation }
  );
};

export const logDataError = (
  operation: string,
  error: Error,
  context?: Omit<ErrorContext, 'operation'>
) => {
  errorLogger.logError(
    `Data error during ${operation}`,
    error,
    'data',
    { ...context, operation }
  );
};

export const logOfflineModeEnabled = (reason: string, context?: ErrorContext) => {
  errorLogger.logWarning(
    `Offline mode enabled: ${reason}`,
    'network',
    context
  );
};

export const logOfflineModeDisabled = (context?: ErrorContext) => {
  errorLogger.logInfo(
    'Offline mode disabled - connectivity restored',
    'network',
    context
  );
};

export const logRetryAttempt = (
  operation: string,
  retryCount: number,
  context?: Omit<ErrorContext, 'operation' | 'retryCount'>
) => {
  errorLogger.logInfo(
    `Retry attempt ${retryCount} for ${operation}`,
    'system',
    { ...context, operation, retryCount }
  );
};