import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserManagementService } from '../services/UserManagementService'
import { mockUsers, mockUser, mockCreateUserRequest, mockLoginResponse } from './mocks'

// Mock axios properly for integration testing
const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    response: {
      use: vi.fn(),
    },
  },
}

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxios),
  },
}))

describe('Service Integration Tests', () => {
  let userService: UserManagementService

  beforeEach(() => {
    vi.clearAllMocks()
    userService = new UserManagementService('http://localhost:3001')
  })

  describe('User Management Service Integration', () => {
    it('should complete full CRUD workflow', async () => {
      // Mock API responses for full workflow
      mockAxios.get.mockResolvedValueOnce({ data: [] }) // Initial empty list
      mockAxios.post.mockResolvedValueOnce({ data: mockUser }) // Create user
      mockAxios.get.mockResolvedValueOnce({ data: [mockUser] }) // Get updated list
      mockAxios.put.mockResolvedValueOnce({ data: { ...mockUser, displayName: 'Updated' } }) // Update user
      mockAxios.delete.mockResolvedValueOnce({ status: 204 }) // Delete user

      // 1. Get initial empty user list
      const initialUsers = await userService.getUsers()
      expect(initialUsers).toEqual([])
      expect(mockAxios.get).toHaveBeenCalledWith('/api/users')

      // 2. Create a new user
      const createdUser = await userService.createUser(mockCreateUserRequest)
      expect(createdUser).toEqual(mockUser)
      expect(mockAxios.post).toHaveBeenCalledWith('/api/users', mockCreateUserRequest)

      // 3. Get updated user list
      const usersAfterCreate = await userService.getUsers()
      expect(usersAfterCreate).toEqual([mockUser])

      // 4. Update the user
      const updateRequest = { displayName: 'Updated' }
      const updatedUser = await userService.updateUser(mockUser.uid, updateRequest)
      expect(updatedUser.displayName).toBe('Updated')
      expect(mockAxios.put).toHaveBeenCalledWith(`/api/users/${mockUser.uid}`, updateRequest)

      // 5. Delete the user
      await userService.deleteUser(mockUser.uid)
      expect(mockAxios.delete).toHaveBeenCalledWith(`/api/users/${mockUser.uid}`)
    })

    it('should handle user impersonation workflow', async () => {
      // Mock impersonation response
      mockAxios.post.mockResolvedValueOnce({ data: mockLoginResponse })

      // Mock window.location for redirect testing
      const mockLocation = { href: '' }
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      })

      // Mock localStorage
      const mockLocalStorage = {
        setItem: vi.fn(),
      }
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      })

      // Perform impersonation
      await userService.loginAsUser(mockUser.uid, 'http://localhost:51235')

      // Verify impersonation API call
      expect(mockAxios.post).toHaveBeenCalledWith('/api/auth/impersonate', { userId: mockUser.uid })

      // Verify token storage and redirect
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', mockLoginResponse.token)
      expect(window.location.href).toBe('http://localhost:51235')
    })

    it('should handle error scenarios correctly', async () => {
      // Test network error
      mockAxios.get.mockRejectedValueOnce(new Error('Network Error'))

      await expect(userService.getUsers()).rejects.toThrow('Network Error')

      // Test API error response
      const apiError = {
        response: {
          data: {
            error: 'VALIDATION_ERROR',
            message: 'Invalid input data',
          },
          status: 400,
        },
      }
      mockAxios.post.mockRejectedValueOnce(apiError)

      await expect(userService.createUser(mockCreateUserRequest)).rejects.toThrow('Invalid input data')

      // Test server error without response data
      const serverError = {
        response: {
          status: 500,
        },
      }
      mockAxios.get.mockRejectedValueOnce(serverError)

      await expect(userService.getUsers()).rejects.toThrow('An error occurred')
    })

    it('should handle concurrent operations', async () => {
      // Mock multiple concurrent operations
      mockAxios.get.mockResolvedValue({ data: mockUsers })
      mockAxios.post.mockResolvedValue({ data: mockUser })
      mockAxios.delete.mockResolvedValue({ status: 204 })

      // Execute multiple operations concurrently
      const operations = [
        userService.getUsers(),
        userService.createUser(mockCreateUserRequest),
        userService.deleteUser('user-to-delete'),
      ]

      const results = await Promise.all(operations)

      // Verify all operations completed
      expect(results[0]).toEqual(mockUsers) // getUsers result
      expect(results[1]).toEqual(mockUser) // createUser result
      expect(results[2]).toBeUndefined() // deleteUser result

      // Verify all API calls were made
      expect(mockAxios.get).toHaveBeenCalledWith('/api/users')
      expect(mockAxios.post).toHaveBeenCalledWith('/api/users', mockCreateUserRequest)
      expect(mockAxios.delete).toHaveBeenCalledWith('/api/users/user-to-delete')
    })

    it('should handle different response formats', async () => {
      // Test successful responses
      mockAxios.get.mockResolvedValueOnce({ data: mockUsers })
      const users = await userService.getUsers()
      expect(users).toEqual(mockUsers)

      // Test empty response
      mockAxios.get.mockResolvedValueOnce({ data: [] })
      const emptyUsers = await userService.getUsers()
      expect(emptyUsers).toEqual([])

      // Test single user response
      mockAxios.get.mockResolvedValueOnce({ data: mockUser })
      const singleUser = await userService.getUserById(mockUser.uid)
      expect(singleUser).toEqual(mockUser)
    })

    it('should validate request parameters', async () => {
      mockAxios.post.mockResolvedValue({ data: mockUser })
      mockAxios.put.mockResolvedValue({ data: mockUser })
      mockAxios.delete.mockResolvedValue({ status: 204 })

      // Test create user with all required fields
      await userService.createUser({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      })

      expect(mockAxios.post).toHaveBeenCalledWith('/api/users', {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      })

      // Test update user with partial data
      await userService.updateUser('user-id', {
        displayName: 'Updated Name',
      })

      expect(mockAxios.put).toHaveBeenCalledWith('/api/users/user-id', {
        displayName: 'Updated Name',
      })

      // Test delete user with ID
      await userService.deleteUser('user-id')
      expect(mockAxios.delete).toHaveBeenCalledWith('/api/users/user-id')
    })
  })

  describe('Cross-Service Communication Simulation', () => {
    it('should simulate communication between UI and API services', async () => {
      // Simulate the flow that would happen in a real application
      
      // 1. UI loads and fetches users
      mockAxios.get.mockResolvedValueOnce({ data: mockUsers })
      const initialUsers = await userService.getUsers()
      expect(initialUsers).toHaveLength(3)

      // 2. User creates a new user through the UI
      mockAxios.post.mockResolvedValueOnce({ data: mockUser })
      const newUser = await userService.createUser({
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User',
      })
      expect(newUser.email).toBe('test@example.com') // mockUser email

      // 3. UI refreshes the user list
      mockAxios.get.mockResolvedValueOnce({ data: [...mockUsers, newUser] })
      const updatedUsers = await userService.getUsers()
      expect(updatedUsers).toHaveLength(4)

      // 4. User impersonates another user
      mockAxios.post.mockResolvedValueOnce({ data: mockLoginResponse })
      
      // Mock redirect functionality
      const mockLocation = { href: '' }
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      })
      
      const mockLocalStorage = { setItem: vi.fn() }
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      })

      await userService.loginAsUser(mockUser.uid)

      // Verify impersonation flow
      expect(mockAxios.post).toHaveBeenCalledWith('/api/auth/impersonate', { userId: mockUser.uid })
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', mockLoginResponse.token)
      expect(window.location.href).toBe('http://localhost:51235')
    })

    it('should handle network timeouts and retries', async () => {
      // Simulate timeout error
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      }

      mockAxios.get.mockRejectedValueOnce(timeoutError)
      await expect(userService.getUsers()).rejects.toThrow('timeout of 5000ms exceeded')

      // Simulate successful retry
      mockAxios.get.mockResolvedValueOnce({ data: mockUsers })
      const users = await userService.getUsers()
      expect(users).toEqual(mockUsers)
    })

    it('should handle different HTTP status codes', async () => {
      // Test 404 Not Found
      const notFoundError = {
        response: {
          data: {
            error: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          status: 404,
        },
      }
      mockAxios.get.mockRejectedValueOnce(notFoundError)
      await expect(userService.getUserById('nonexistent')).rejects.toThrow('User not found')

      // Test 409 Conflict
      const conflictError = {
        response: {
          data: {
            error: 'EMAIL_EXISTS',
            message: 'Email already exists',
          },
          status: 409,
        },
      }
      mockAxios.post.mockRejectedValueOnce(conflictError)
      await expect(userService.createUser(mockCreateUserRequest)).rejects.toThrow('Email already exists')

      // Test 401 Unauthorized
      const unauthorizedError = {
        response: {
          data: {
            error: 'AUTHENTICATION_FAILED',
            message: 'Authentication failed',
          },
          status: 401,
        },
      }
      mockAxios.post.mockRejectedValueOnce(unauthorizedError)
      await expect(userService.impersonateUser(mockUser.uid)).rejects.toThrow('Authentication failed')
    })
  })
})