import { UserManagementService } from './UserManagementService';

// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Create a singleton instance of the user management service
export const userService = new UserManagementService(API_BASE_URL);