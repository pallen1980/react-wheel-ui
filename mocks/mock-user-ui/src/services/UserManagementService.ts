import { ApiClient } from './ApiClient';
import { User, CreateUserRequest, UpdateUserRequest, LoginResponse } from '../types';

export class UserManagementService {
  private apiClient: ApiClient;

  constructor(baseURL?: string) {
    this.apiClient = new ApiClient(baseURL);
  }

  /**
   * Get all users
   * @returns Promise<User[]> List of all users
   */
  async getUsers(): Promise<User[]> {
    return this.apiClient.get<User[]>('/api/users');
  }

  /**
   * Get user by ID
   * @param id User ID
   * @returns Promise<User> User details
   */
  async getUserById(id: string): Promise<User> {
    return this.apiClient.get<User>(`/api/users/${id}`);
  }

  /**
   * Create a new user
   * @param userData User creation data
   * @returns Promise<User> Created user
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    return this.apiClient.post<User>('/api/users', userData);
  }

  /**
   * Update an existing user
   * @param id User ID
   * @param userData User update data
   * @returns Promise<User> Updated user
   */
  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    return this.apiClient.put<User>(`/api/users/${id}`, userData);
  }

  /**
   * Delete a user
   * @param id User ID
   * @returns Promise<void>
   */
  async deleteUser(id: string): Promise<void> {
    return this.apiClient.delete<void>(`/api/users/${id}`);
  }

  /**
   * Impersonate a user (generate auth token for the user)
   * @param userId User ID to impersonate
   * @returns Promise<LoginResponse> Authentication response with token
   */
  async impersonateUser(userId: string): Promise<LoginResponse> {
    return this.apiClient.post<LoginResponse>('/api/auth/impersonate', { userId });
  }

  /**
   * Redirect to main application with authentication token
   * @param token Authentication token
   * @param mainAppUrl Main application URL (default: http://localhost:51235)
   */
  redirectToMainApp(token: string, mainAppUrl: string = 'http://localhost:51235'): void {
    // Store token in localStorage for the main app to pick up
    localStorage.setItem('authToken', token);
    
    // Redirect to main application
    window.location.href = mainAppUrl;
  }

  /**
   * Handle user impersonation and redirect
   * @param userId User ID to impersonate
   * @param mainAppUrl Main application URL (optional)
   */
  async loginAsUser(userId: string, mainAppUrl?: string): Promise<void> {
    try {
      const loginResponse = await this.impersonateUser(userId);
      this.redirectToMainApp(loginResponse.token, mainAppUrl);
    } catch (error) {
      // Re-throw the error to be handled by the calling component
      throw error;
    }
  }
}