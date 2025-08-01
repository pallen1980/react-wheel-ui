import {
  OptionsService,
  OptionsServiceError,
  OptionsErrorType,
  LoadOptionsResponse,
  SaveOptionsRequest,
  API_CONFIG,
  API_ENDPOINTS
} from './OptionsService';
import { Option } from '../Areas/Main/Options/models';
import { errorLogger, logNetworkError, logAuthError, logDataError } from '../utils/errorLogger';

/**
 * HTTP implementation of the OptionsService interface
 * Handles communication with the backend API for options persistence
 */
export class HttpOptionsService implements OptionsService {
  private baseUrl: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(
    private getAuthToken: () => Promise<string | null>,
    baseUrl?: string,
    timeout?: number
  ) {
    this.baseUrl = baseUrl || API_CONFIG.baseURL;
    this.timeout = timeout || API_CONFIG.timeout;
    this.defaultHeaders = { ...API_CONFIG.headers };
  }

  /**
   * Load user options from the backend API
   */
  async loadUserOptions(userId: string): Promise<Option[]> {
    try {
      const url = `${this.baseUrl}${API_ENDPOINTS.LOAD_OPTIONS.replace('{userId}', userId)}`;
      const authToken = await this.getAuthToken();

      if (!authToken) {
        const error = new OptionsServiceError(
          OptionsErrorType.AUTH,
          'Please sign in to access your saved options',
          false
        );
        logAuthError('loadUserOptions', error, { userId });
        throw error;
      }

      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          ...this.defaultHeaders,
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.status === 401) {
        const error = new OptionsServiceError(
          OptionsErrorType.AUTH,
          'Your session has expired. Please sign in again',
          false
        );
        logAuthError('loadUserOptions', error, { userId, statusCode: response.status });
        throw error;
      }

      if (response.status === 403) {
        const error = new OptionsServiceError(
          OptionsErrorType.PERMISSION,
          'You don\'t have permission to access these options',
          false
        );
        logAuthError('loadUserOptions', error, { userId, statusCode: response.status });
        throw error;
      }

      if (response.status === 404) {
        // No options found for user - return empty array
        return [];
      }

      if (!response.ok) {
        const isServerError = response.status >= 500;
        const error = new OptionsServiceError(
          OptionsErrorType.NETWORK,
          isServerError ? 'Our servers are having issues. Please try again in a moment' : 'Unable to load your options right now',
          isServerError // Server errors are retryable
        );
        logNetworkError('loadUserOptions', error, { 
          userId, 
          statusCode: response.status,
          networkStatus: navigator.onLine 
        });
        throw error;
      }

      const data: LoadOptionsResponse = await response.json();

      // Validate response data
      if (!Array.isArray(data.options)) {
        const error = new OptionsServiceError(
          OptionsErrorType.DATA,
          'The server sent invalid data. Please try again',
          false
        );
        logDataError('loadUserOptions', error, { userId, responseData: data });
        throw error;
      }

      // Validate each option has required properties
      for (const option of data.options) {
        if (!option.key || !option.value || typeof option.sequence !== 'number') {
          const error = new OptionsServiceError(
            OptionsErrorType.DATA,
            'Some of your saved options have invalid data',
            false
          );
          logDataError('loadUserOptions', error, { userId, invalidOption: option });
          throw error;
        }
      }

      return data.options;

    } catch (error) {
      if (error instanceof OptionsServiceError) {
        throw error;
      }

      // Handle network/timeout errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const serviceError = new OptionsServiceError(
          OptionsErrorType.NETWORK,
          'Unable to connect to our servers. Please check your internet connection',
          true,
          error as Error
        );
        logNetworkError('loadUserOptions', error as Error, { 
          userId, 
          networkStatus: navigator.onLine,
          errorType: 'fetch_error'
        });
        throw serviceError;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        const serviceError = new OptionsServiceError(
          OptionsErrorType.NETWORK,
          'The request took too long. Please try again',
          true,
          error
        );
        logNetworkError('loadUserOptions', error, { 
          userId, 
          networkStatus: navigator.onLine,
          errorType: 'timeout'
        });
        throw serviceError;
      }

      // Unknown error
      const serviceError = new OptionsServiceError(
        OptionsErrorType.NETWORK,
        'Something went wrong while loading your options',
        false,
        error instanceof Error ? error : undefined
      );
      errorLogger.logError(
        'Unknown error during loadUserOptions',
        error instanceof Error ? error : new Error(String(error)),
        'system',
        { userId, operation: 'loadUserOptions' }
      );
      throw serviceError;
    }
  }

  /**
   * Save user options to the backend API
   */
  async saveUserOptions(userId: string, options: Option[]): Promise<void> {
    try {
      const url = `${this.baseUrl}${API_ENDPOINTS.SAVE_OPTIONS.replace('{userId}', userId)}`;
      const authToken = await this.getAuthToken();

      if (!authToken) {
        const error = new OptionsServiceError(
          OptionsErrorType.AUTH,
          'Please sign in to save your options',
          false
        );
        logAuthError('saveUserOptions', error, { userId });
        throw error;
      }

      // Validate options before sending
      for (const option of options) {
        if (!option.key || !option.value || typeof option.sequence !== 'number') {
          const error = new OptionsServiceError(
            OptionsErrorType.DATA,
            'Some of your options have invalid data and cannot be saved',
            false
          );
          logDataError('saveUserOptions', error, { userId, invalidOption: option });
          throw error;
        }
      }

      const requestBody: SaveOptionsRequest = { options };

      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          ...this.defaultHeaders,
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 401) {
        const error = new OptionsServiceError(
          OptionsErrorType.AUTH,
          'Your session has expired. Please sign in again',
          false
        );
        logAuthError('saveUserOptions', error, { userId, statusCode: response.status });
        throw error;
      }

      if (response.status === 403) {
        const error = new OptionsServiceError(
          OptionsErrorType.PERMISSION,
          'You don\'t have permission to save these options',
          false
        );
        logAuthError('saveUserOptions', error, { userId, statusCode: response.status });
        throw error;
      }

      if (!response.ok) {
        const isServerError = response.status >= 500;
        const error = new OptionsServiceError(
          OptionsErrorType.NETWORK,
          isServerError ? 'Our servers are having issues. Your changes are saved locally' : 'Unable to save your options right now',
          isServerError // Server errors are retryable
        );
        logNetworkError('saveUserOptions', error, { 
          userId, 
          statusCode: response.status,
          networkStatus: navigator.onLine,
          optionsCount: options.length
        });
        throw error;
      }

    } catch (error) {
      if (error instanceof OptionsServiceError) {
        throw error;
      }

      // Handle network/timeout errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const serviceError = new OptionsServiceError(
          OptionsErrorType.NETWORK,
          'Unable to connect to our servers. Your changes are saved locally',
          true,
          error as Error
        );
        logNetworkError('saveUserOptions', error as Error, { 
          userId, 
          networkStatus: navigator.onLine,
          errorType: 'fetch_error',
          optionsCount: options.length
        });
        throw serviceError;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        const serviceError = new OptionsServiceError(
          OptionsErrorType.NETWORK,
          'The save request took too long. Your changes are saved locally',
          true,
          error
        );
        logNetworkError('saveUserOptions', error, { 
          userId, 
          networkStatus: navigator.onLine,
          errorType: 'timeout',
          optionsCount: options.length
        });
        throw serviceError;
      }

      // Unknown error
      const serviceError = new OptionsServiceError(
        OptionsErrorType.NETWORK,
        'Something went wrong while saving. Your changes are saved locally',
        false,
        error instanceof Error ? error : undefined
      );
      errorLogger.logError(
        'Unknown error during saveUserOptions',
        error instanceof Error ? error : new Error(String(error)),
        'system',
        { userId, operation: 'saveUserOptions', optionsCount: options.length }
      );
      throw serviceError;
    }
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}