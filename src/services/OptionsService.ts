import { Option } from '../Areas/Main/Options/models';

/**
 * Service interface for managing user options persistence
 */
export interface OptionsService {
  /**
   * Load user options from the backend
   * @param userId - The authenticated user's ID
   * @returns Promise resolving to array of user options
   */
  loadUserOptions(userId: string): Promise<Option[]>;

  /**
   * Save user options to the backend
   * @param userId - The authenticated user's ID
   * @param options - Array of options to save
   * @returns Promise resolving when save is complete
   */
  saveUserOptions(userId: string, options: Option[]): Promise<void>;
}

/**
 * Error types for options service operations
 */
export enum OptionsErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  PERMISSION = 'permission',
  DATA = 'data'
}

/**
 * Custom error class for options service operations
 */
export class OptionsServiceError extends Error {
  constructor(
    public type: OptionsErrorType,
    message: string,
    public retryable: boolean = false,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'OptionsServiceError';
  }
}

/**
 * API response interfaces
 */
export interface LoadOptionsResponse {
  options: Option[];
  lastModified: string;
}

export interface SaveOptionsRequest {
  options: Option[];
}

/**
 * API configuration
 */
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  LOAD_OPTIONS: '/users/{userId}/options',
  SAVE_OPTIONS: '/users/{userId}/options'
} as const;