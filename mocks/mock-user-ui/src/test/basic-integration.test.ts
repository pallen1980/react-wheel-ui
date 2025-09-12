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

describe('Basic Integration Tests', () => {
  let userService: UserManagementService

  beforeEach(() => {
    vi.clearAllMocks()
    userService = new UserManagementService('http://localhost:3001')
  })

  describe('User CRUD Operations', () => {
    it('should create, read, update, and delete users', async () => {
      // Create user
      mockAxios.post.mockResolvedValueOnce({ data: mockUser })
      const createdUser = await userService.createUser(mockCreateUserRequest)
      expect(createdUser).toEqual(mockUser)
      expect(mockAxios.post).toHaveBeenCalledWith('/api/users', mockCreateUserRequest)

      // Read users
      mockAxios.get.mockResolvedValueOnce({ data: [mockUser] })
      const users = await userService.getUsers()
      expect(users).toEqual([mockUser])
      expect(mockAxios.get).toHaveBeenCalledWith('/api/users')

      // Update user
      const updateData = { displayName: 'Updated Name' }
      const updatedUser = { ...mockUser, displayName: 'Updated Name' }
      mockAxios.put.mockResolvedValueOnce({ data: updatedUser })
      const result = await userService.updateUser(mockUser.uid, updateData)
      expect(result).toEqual(updatedUser)
      expect(mockAxios.put).toHaveBeenCalledWith(`/api/users/${mockUser.uid}`, updateData)

      // Delete user
      mockAxios.delete.mockResolvedValueOnce({ status: 204 })
      await userService.deleteUser(mockUser.uid)
      expect(mockAxios.delete).toHaveBeenCalledWith(`/api/users/${mockUser.uid}`)
    })

    it('should handle user impersonation', async () => {
      // Mock window.location and localStorage
      const mockLocation = { href: '' }
      const mockLocalStorage = { setItem: vi.fn() }
      
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      })
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      })

      // Mock impersonation API call
      mockAxios.post.mockResolvedValueOnce({ data: mockLoginResponse })

      // Perform impersonation
      await userService.loginAsUser(mockUser.uid, 'http://localhost:5173')

      // Verify API call
      expect(mockAxios.post).toHaveBeenCalledWith('/api/auth/impersonate', { userId: mockUser.uid })
      
      // Verify token storage and redirect
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', mockLoginResponse.token)
      expect(window.location.href).toBe('http://localhost:5173')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors correctly', async () => {
      // Test validation error
      const validationError = {
        response: {
          data: {
            error: 'VALIDATION_ERROR',
            message: 'Invalid input data',
          },
          status: 400,
        },
      }
      mockAxios.post.mockRejectedValueOnce(validationError)

      await expect(userService.createUser(mockCreateUserRequest))
        .rejects.toThrow('Invalid input data')

      // Test not found error
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

      await expect(userService.getUserById('nonexistent'))
        .rejects.toThrow('User not found')
    })
  })

  describe('Service Communication', () => {
    it('should make correct HTTP requests', async () => {
      // Test GET request
      mockAxios.get.mockResolvedValueOnce({ data: mockUsers })
      await userService.getUsers()
      expect(mockAxios.get).toHaveBeenCalledWith('/api/users')

      // Test POST request
      mockAxios.post.mockResolvedValueOnce({ data: mockUser })
      await userService.createUser(mockCreateUserRequest)
      expect(mockAxios.post).toHaveBeenCalledWith('/api/users', mockCreateUserRequest)

      // Test PUT request
      const updateData = { displayName: 'Updated' }
      mockAxios.put.mockResolvedValueOnce({ data: mockUser })
      await userService.updateUser(mockUser.uid, updateData)
      expect(mockAxios.put).toHaveBeenCalledWith(`/api/users/${mockUser.uid}`, updateData)

      // Test DELETE request
      mockAxios.delete.mockResolvedValueOnce({ status: 204 })
      await userService.deleteUser(mockUser.uid)
      expect(mockAxios.delete).toHaveBeenCalledWith(`/api/users/${mockUser.uid}`)
    })

    it('should handle different response formats', async () => {
      // Test array response
      mockAxios.get.mockResolvedValueOnce({ data: mockUsers })
      const users = await userService.getUsers()
      expect(Array.isArray(users)).toBe(true)
      expect(users).toHaveLength(3)

      // Test single object response
      mockAxios.get.mockResolvedValueOnce({ data: mockUser })
      const user = await userService.getUserById(mockUser.uid)
      expect(user).toEqual(mockUser)

      // Test empty array response
      mockAxios.get.mockResolvedValueOnce({ data: [] })
      const emptyUsers = await userService.getUsers()
      expect(emptyUsers).toEqual([])
    })
  })

  describe('Workflow Integration', () => {
    it('should support complete user management workflow', async () => {
      // Step 1: Load initial empty user list
      mockAxios.get.mockResolvedValueOnce({ data: [] })
      let users = await userService.getUsers()
      expect(users).toHaveLength(0)

      // Step 2: Create first user
      mockAxios.post.mockResolvedValueOnce({ data: mockUser })
      const newUser = await userService.createUser(mockCreateUserRequest)
      expect(newUser.email).toBe(mockUser.email)

      // Step 3: Load updated user list
      mockAxios.get.mockResolvedValueOnce({ data: [mockUser] })
      users = await userService.getUsers()
      expect(users).toHaveLength(1)

      // Step 4: Update user
      const updateData = { displayName: 'Updated User' }
      mockAxios.put.mockResolvedValueOnce({ data: { ...mockUser, ...updateData } })
      const updatedUser = await userService.updateUser(mockUser.uid, updateData)
      expect(updatedUser.displayName).toBe('Updated User')

      // Step 5: Impersonate user
      mockAxios.post.mockResolvedValueOnce({ data: mockLoginResponse })
      
      const mockLocation = { href: '' }
      const mockLocalStorage = { setItem: vi.fn() }
      Object.defineProperty(window, 'location', { value: mockLocation, writable: true })
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

      await userService.loginAsUser(mockUser.uid)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', mockLoginResponse.token)

      // Step 6: Delete user
      mockAxios.delete.mockResolvedValueOnce({ status: 204 })
      await userService.deleteUser(mockUser.uid)

      // Verify all API calls were made in correct order
      expect(mockAxios.get).toHaveBeenCalledTimes(2) // Initial load + refresh
      expect(mockAxios.post).toHaveBeenCalledTimes(2) // Create user + impersonate
      expect(mockAxios.put).toHaveBeenCalledTimes(1) // Update user
      expect(mockAxios.delete).toHaveBeenCalledTimes(1) // Delete user
    })

    it('should handle concurrent operations', async () => {
      // Set up mocks for concurrent operations
      mockAxios.get.mockResolvedValue({ data: mockUsers })
      mockAxios.post.mockResolvedValue({ data: mockUser })
      mockAxios.put.mockResolvedValue({ data: mockUser })

      // Execute multiple operations concurrently
      const promises = [
        userService.getUsers(),
        userService.createUser(mockCreateUserRequest),
        userService.updateUser(mockUser.uid, { displayName: 'Concurrent Update' }),
      ]

      const results = await Promise.all(promises)

      // Verify all operations completed successfully
      expect(results[0]).toEqual(mockUsers) // getUsers result
      expect(results[1]).toEqual(mockUser) // createUser result
      expect(results[2]).toEqual(mockUser) // updateUser result

      // Verify all API calls were made
      expect(mockAxios.get).toHaveBeenCalled()
      expect(mockAxios.post).toHaveBeenCalled()
      expect(mockAxios.put).toHaveBeenCalled()
    })
  })
})