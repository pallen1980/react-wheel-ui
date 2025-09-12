import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { ApiError } from '../types';

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

export class ApiClient {
  private client: AxiosInstance;
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    retryCondition: (error: AxiosError) => {
      // Retry on network errors or 5xx server errors
      return !error.response || (error.response.status >= 500);
    }
  };

  constructor(baseURL: string = 'http://localhost:3001') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        const apiError = this.handleError(error);
        return Promise.reject(apiError);
      }
    );
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryConfig: RetryConfig = this.defaultRetryConfig
  ): Promise<T> {
    let lastError: AxiosError;
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as AxiosError;
        
        // Don't retry if it's the last attempt or retry condition is not met
        if (attempt === retryConfig.maxRetries || 
            (retryConfig.retryCondition && !retryConfig.retryCondition(lastError))) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = retryConfig.retryDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }
    
    throw this.handleError(lastError!);
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error status
      const data = error.response.data as any;
      return {
        error: data?.error || 'SERVER_ERROR',
        message: data?.message || `Server error: ${error.response.status}`,
        details: data?.details,
        timestamp: new Date().toISOString(),
      };
    } else if (error.request) {
      // Network error
      return {
        error: 'NETWORK_ERROR',
        message: 'Unable to connect to the server. Please check your connection.',
        timestamp: new Date().toISOString(),
      };
    } else {
      // Request setup error
      return {
        error: 'REQUEST_ERROR',
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async get<T>(url: string, retryConfig?: Partial<RetryConfig>): Promise<T> {
    return this.executeWithRetry(async () => {
      const response = await this.client.get<T>(url);
      return response.data;
    }, { ...this.defaultRetryConfig, ...retryConfig });
  }

  async post<T>(url: string, data?: any, retryConfig?: Partial<RetryConfig>): Promise<T> {
    return this.executeWithRetry(async () => {
      const response = await this.client.post<T>(url, data);
      return response.data;
    }, { 
      ...this.defaultRetryConfig, 
      ...retryConfig,
      // Don't retry POST requests by default (they might not be idempotent)
      maxRetries: retryConfig?.maxRetries ?? 0
    });
  }

  async put<T>(url: string, data?: any, retryConfig?: Partial<RetryConfig>): Promise<T> {
    return this.executeWithRetry(async () => {
      const response = await this.client.put<T>(url, data);
      return response.data;
    }, { 
      ...this.defaultRetryConfig, 
      ...retryConfig,
      // Don't retry PUT requests by default (they might not be idempotent)
      maxRetries: retryConfig?.maxRetries ?? 0
    });
  }

  async delete<T>(url: string, retryConfig?: Partial<RetryConfig>): Promise<T> {
    return this.executeWithRetry(async () => {
      const response = await this.client.delete<T>(url);
      return response.data;
    }, { 
      ...this.defaultRetryConfig, 
      ...retryConfig,
      // Don't retry DELETE requests by default (they might not be idempotent)
      maxRetries: retryConfig?.maxRetries ?? 0
    });
  }
}