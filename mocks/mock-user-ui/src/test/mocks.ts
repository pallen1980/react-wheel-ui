import { vi } from 'vitest'
import { vi } from 'vitest'
import { vi } from 'vitest'
import { vi } from 'vitest'
import { vi } from 'vitest'
import { vi } from 'vitest'
import { vi } from 'vitest'
import { vi } from 'vitest'
import { vi } from 'vitest'
import { vi } from 'vitest'
import { vi } from 'vitest'
import { User, CreateUserRequest, UpdateUserRequest, LoginResponse } from '../types'

export const mockUser: User = {
  uid: 'test-user-1',
  email: 'test@example.com',
  displayName: 'Test User',
  createdAt: '2024-01-01T00:00:00Z',
  emailVerified: true,
}

export const mockUsers: User[] = [
  mockUser,
  {
    uid: 'test-user-2',
    email: 'test2@example.com',
    displayName: 'Test User 2',
    createdAt: '2024-01-02T00:00:00Z',
    emailVerified: true,
  },
  {
    uid: 'test-user-3',
    email: 'test3@example.com',
    displayName: 'Test User 3',
    createdAt: '2024-01-03T00:00:00Z',
    emailVerified: false,
  },
]

export const mockCreateUserRequest: CreateUserRequest = {
  email: 'newuser@example.com',
  password: 'password123',
  displayName: 'New User',
}

export const mockUpdateUserRequest: UpdateUserRequest = {
  email: 'updated@example.com',
  displayName: 'Updated User',
}

export const mockLoginResponse: LoginResponse = {
  token: 'mock-jwt-token',
  user: mockUser,
  expiresIn: 3600,
}

export const mockApiError = {
  error: 'VALIDATION_ERROR',
  message: 'Invalid input data',
  details: { field: 'email', message: 'Email is required' },
  timestamp: '2024-01-01T00:00:00Z',
}

// Mock axios
export const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  create: vi.fn(() => mockAxios),
}

// Mock UserManagementService
export const mockUserManagementService = {
  getUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  impersonateUser: vi.fn(),
  loginAsUser: vi.fn(),
}