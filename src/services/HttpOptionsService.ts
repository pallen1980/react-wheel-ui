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
        throw new OptionsServiceError(
          OptionsErrorType.AUTH,
          'Please sign in to access your saved options',
          false
        );
      }

      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          ...this.defaultHeaders,
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.status === 401) {
        throw new OptionsServiceError(
          OptionsErrorType.AUTH,
          'Your session has expired. Please sign in again',
          false
        );
      }

      if (response.status === 403) {
        throw new OptionsServiceError(
          OptionsErrorType.PERMISSION,
          'You don\'t have permission to access these options',
          false
        );
      }

      if (response.status === 404) {
        // No options found for user - return empty array
        return [];
      }

      if (!response.ok) {
        throw new OptionsServiceError(
          OptionsErrorType.NETWORK,
          response.status >= 500 ? 'Our servers are having issues. Please try again in a moment' : 'Unable to load your options right now',
          response.status >= 500 // Server errors are retryable
        );
      }

      const data: LoadOptionsResponse = await response.json();
      
      // Validate response data
      if (!Array.isArray(data.options)) {
        throw new OptionsServiceError(
          OptionsErrorType.DATA,
          'The server sent invalid data. Please try again',
          false
        );
      }

      // Validate each option has required properties
      for (const option of data.options) {
        if (!option.key || !option.value || typeof option.sequence !== 'number') {
          throw new OptionsServiceError(
            OptionsErrorType.DATA,
            'Some of your saved options have invalid data',
            false
          );
        }
      }

      return data.options;

    } catch (error) {
      if (error instanceof OptionsServiceError) {
        throw error;
      }

      // Handle network/timeout errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new OptionsServiceError(
          OptionsErrorType.NETWORK,
          'Unable to connect to our servers. Please check your internet connection',
          true,
          error as Error
        );
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new OptionsServiceError(
          OptionsErrorType.NETWORK,
          'The request took too long. Please try again',
          true,
          error
        );
      }

      // Unknown error
      throw new OptionsServiceError(
        OptionsErrorType.NETWORK,
        'Something went wrong while loading your options',
        false,
        error instanceof Error ? error : undefined
      );
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
        throw new OptionsServiceError(
          OptionsErrorType.AUTH,
          'Please sign in to save your options',
          false
        );
      }

      // Validate options before sending
      for (const option of options) {
        if (!option.key || !option.value || typeof option.sequence !== 'number') {
          throw new OptionsServiceError(
            OptionsErrorType.DATA,
            'Some of your options have invalid data and cannot be saved',
            false
          );
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
        throw new OptionsServiceError(
          OptionsErrorType.AUTH,
          'Your session has expired. Please sign in again',
          false
        );
      }

      if (response.status === 403) {
        throw new OptionsServiceError(
          OptionsErrorType.PERMISSION,
          'You don\'t have permission to save these options',
          false
        );
      }

      if (!response.ok) {
        throw new OptionsServiceError(
          OptionsErrorType.NETWORK,
          response.status >= 500 ? 'Our servers are having issues. Your changes are saved locally' : 'Unable to save your options right now',
          response.status >= 500 // Server errors are retryable
        );
      }

    } catch (error) {
      if (error instanceof OptionsServiceError) {
        throw error;
      }

      // Handle network/timeout errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new OptionsServiceError(
          OptionsErrorType.NETWORK,
          'Unable to connect to our servers. Your changes are saved locally',
          true,
          error as Error
        );
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new OptionsServiceError(
          OptionsErrorType.NETWORK,
          'The save request took too long. Your changes are saved locally',
          true,
          error
        );
      }

      // Unknown error
      throw new OptionsServiceError(
        OptionsErrorType.NETWORK,
        'Something went wrong while saving. Your changes are saved locally',
        false,
        error instanceof Error ? error : undefined
      );
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