import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  errorLogger, 
  ErrorContext, 
  logNetworkError, 
  logAuthError, 
  logDataError, 
  logRetryAttempt 
} from '../../src/utils/errorLogger';

// Mock console methods
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation();
const mockConsoleInfo = vi.spyOn(console, 'info').mockImplementation();


// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: { DEV: true },
  writable: true,
});

describe('ErrorLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorLogger.clearLogs();
  });

  describe('logError', () => {
    it('should log error with basic message', () => {
      errorLogger.logError('Test error message');
      
      const logs = errorLogger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test error message');
      expect(logs[0].level).toBe('error');
      expect(logs[0].category).toBe('system');
    });

    it('should log error with custom category', () => {
      errorLogger.logError('Network error', undefined, 'network');
      
      const logs = errorLogger.getRecentLogs();
      expect(logs[0].category).toBe('network');
    });

    it('should include error stack when Error object provided', () => {
      const error = new Error('Test error');
      errorLogger.logError('Error occurred', error);
      
      const logs = errorLogger.getRecentLogs();
      expect(logs[0].stack).toBeDefined();
      expect(logs[0].stack).toContain('Error: Test error');
    });

    it('should include context details', () => {
      const context: ErrorContext = {
        userId: 'user123',
        operation: 'save',
        retryCount: 2,
        networkStatus: false,
      };
      
      errorLogger.logError('Context error', undefined, 'data', context);
      
      const logs = errorLogger.getRecentLogs();
      expect(logs[0].details).toEqual(expect.objectContaining(context));
    });

    it('should include browser information', () => {
      errorLogger.logError('Browser error');
      
      const logs = errorLogger.getRecentLogs();
      expect(logs[0].userAgent).toBeDefined();
      expect(logs[0].url).toBeDefined();
    });

    it('should console.error in development mode', () => {
      import.meta.env.DEV = true;
      errorLogger.logError('Dev error');
      
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should log error in production mode', () => {
      const originalDev = import.meta.env.DEV;
      import.meta.env.DEV = false;
      
      errorLogger.logError('Prod error');
      
      const logs = errorLogger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Prod error');
      
      // Restore original value
      import.meta.env.DEV = originalDev;
    });
  });

  describe('logWarning', () => {
    it('should log warning with correct level', () => {
      errorLogger.logWarning('Warning message');
      
      const logs = errorLogger.getRecentLogs();
      expect(logs[0].level).toBe('warn');
      expect(logs[0].message).toBe('Warning message');
    });

    it('should console.warn in development mode', () => {
      import.meta.env.DEV = true;
      errorLogger.logWarning('Dev warning');
      
      expect(mockConsoleWarn).toHaveBeenCalled();
    });
  });

  describe('logInfo', () => {
    it('should log info with correct level', () => {
      errorLogger.logInfo('Info message');
      
      const logs = errorLogger.getRecentLogs();
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Info message');
    });

    it('should console.info in development mode', () => {
      import.meta.env.DEV = true;
      errorLogger.logInfo('Dev info');
      
      expect(mockConsoleInfo).toHaveBeenCalled();
    });
  });

  describe('logDebug', () => {
    it('should log debug with correct level', () => {
      import.meta.env.DEV = true;
      errorLogger.logDebug('Debug message');
      
      const logs = errorLogger.getRecentLogs();
      expect(logs[0].level).toBe('debug');
      expect(logs[0].message).toBe('Debug message');
    });

    it('should log debug in production mode', () => {
      const originalDev = import.meta.env.DEV;
      import.meta.env.DEV = false;
      errorLogger.clearLogs();
      
      errorLogger.logDebug('Debug message');
      
      const logs = errorLogger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Debug message');
      
      // Restore original value
      import.meta.env.DEV = originalDev;
    });
  });

  describe('logNetworkError', () => {
    it('should log network error with correct category', () => {
      const error = new Error('Network failed');
      const context: ErrorContext = {
        statusCode: 500,
        responseData: { error: 'Server error' },
      };
      
      logNetworkError('fetch', error, context);
      
      const logs = errorLogger.getRecentLogs();
      expect(logs[0].category).toBe('network');
      expect(logs[0].message).toBe('Network error during fetch');
      expect(logs[0].details).toEqual(expect.objectContaining(context));
    });
  });

  describe('logAuthError', () => {
    it('should log auth error with correct category', () => {
      const error = new Error('Auth failed');
      const context: ErrorContext = {
        userId: 'user123',
      };
      
      logAuthError('login', error, context);
      
      const logs = errorLogger.getRecentLogs();
      expect(logs[0].category).toBe('auth');
      expect(logs[0].message).toBe('Authentication error during login');
      expect(logs[0].details).toEqual(expect.objectContaining(context));
    });
  });

  describe('logDataError', () => {
    it('should log data error with correct category', () => {
      const error = new Error('Data validation failed');
      const context: ErrorContext = {
        invalidOption: { id: 'invalid' },
        optionsCount: 5,
      };
      
      logDataError('validation', error, context);
      
      const logs = errorLogger.getRecentLogs();
      expect(logs[0].category).toBe('data');
      expect(logs[0].message).toBe('Data error during validation');
      expect(logs[0].details).toEqual(expect.objectContaining(context));
    });
  });

  describe('logRetryAttempt', () => {
    it('should log retry attempt with info level', () => {
      const context: ErrorContext = {
        userId: 'user123',
        networkStatus: true,
        errorType: 'NETWORK',
      };
      
      logRetryAttempt('save', 2, context);
      
      const logs = errorLogger.getRecentLogs();
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Retry attempt 2 for save');
      expect(logs[0].category).toBe('system');
    });
  });

  describe('log management', () => {
    it('should maintain maximum log count', () => {
      // Add more than max logs (100)
      for (let i = 0; i < 150; i++) {
        errorLogger.logError(`Error ${i}`);
      }
      
      const logs = errorLogger.getRecentLogs(150);
      expect(logs).toHaveLength(100);
      // Should keep the most recent logs
      expect(logs[99].message).toBe('Error 149');
    });

    it('should clear logs', () => {
      errorLogger.logError('Error 1');
      errorLogger.logError('Error 2');
      
      expect(errorLogger.getRecentLogs()).toHaveLength(2);
      
      errorLogger.clearLogs();
      expect(errorLogger.getRecentLogs()).toHaveLength(0);
    });

    it('should get logs by category', () => {
      errorLogger.logError('System error', undefined, 'system');
      const networkError = new Error('Network error');
      const authError = new Error('Auth error');
      logNetworkError('test', networkError);
      logAuthError('test', authError);
      
      const networkLogs = errorLogger.getLogsByCategory('network');
      expect(networkLogs).toHaveLength(1);
      expect(networkLogs[0].category).toBe('network');
      
      const authLogs = errorLogger.getLogsByCategory('auth');
      expect(authLogs).toHaveLength(1);
      expect(authLogs[0].category).toBe('auth');
    });

    it('should get error logs only', () => {
      errorLogger.logError('Error message');
      errorLogger.logWarning('Warning message');
      errorLogger.logInfo('Info message');
      
      const errorLogs = errorLogger.getErrorLogs();
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe('error');
    });

    it('should export logs as JSON', () => {
      errorLogger.logError('Test error');
      errorLogger.logWarning('Test warning');
      
      const exported = errorLogger.exportLogs();
      const parsed = JSON.parse(exported);
      
      expect(parsed.length).toBeGreaterThanOrEqual(2);
      expect(parsed.some((log: { message: string }) => log.message === 'Test error')).toBe(true);
      expect(parsed.some((log: { message: string }) => log.message === 'Test warning')).toBe(true);
    });
  });

  describe('error context handling', () => {
    it('should handle complex error context', () => {
      const complexContext: ErrorContext = {
        userId: 'user123',
        operation: 'complexSave',
        retryCount: 3,
        networkStatus: false,
        additionalData: {
          nested: { value: 'test' },
          array: [1, 2, 3],
        },
        statusCode: 503,
        responseData: { message: 'Service unavailable' },
        invalidOption: { id: 'bad-id', text: '' },
        errorType: 'VALIDATION',
        optionsCount: 10,
        originalError: 'Original error message',
        friendlyMessage: 'Something went wrong',
        isRetryable: true,
        isOfflineMode: true,
      };
      
      errorLogger.logError('Complex error', undefined, 'data', complexContext);
      
      const logs = errorLogger.getRecentLogs();
      expect(logs[0].details).toEqual(expect.objectContaining(complexContext));
    });
  });
});