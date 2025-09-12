import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { ApiError } from '../types';

export class ApiClient {
  private client: AxiosInstance;

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

  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}