import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserManagementService } from '../UserManagementService'
import { mockUsers, mockUser, mockCreateUserRequest, mockUpdateUserRequest, mockLoginResponse, mockApiError } from '../../test/mocks'

// Mock axios
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

describe('UserManagementService', () => {
  let service: UserManagementService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new UserManagementService()
  })

  describe('getUsers', () => {
    it('fetches users successfully', async () => {
      mockAxios.get.mockResolvedValue({ data: mockUsers })

      const result = await service.getUsers()

      expect(mockAxios.get).toHaveBeenCalledWith('/v1/users')
      expect(result).toEqual(mockUsers)
    })

    it('handles get users error', async () => {
      const errorResponse = {
        response: {
          data: mockApiError,
          status: 500,
        },
      }
      mockAxios.get.mockRejectedValue(errorResponse)

      await expect(service.getUsers()).rejects.toThrow('Invalid input data')
    })

    it('handles network error', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network Error'))

      await expect(service.getUsers()).rejects.toThrow('Network Error')
    })
  })

  describe('createUser', () => {
    it('creates user successfully', async () => {
      mockAxios.post.mockResolvedValue({ data: mockUser })

      const result = await service.createUser(mockCreateUserRequest)

      expect(mockAxios.post).toHaveBeenCalledWith('/v1/users', mockCreateUserRequest)
      expect(result).toEqual(mockUser)
    })

    it('handles create user validation error', async () => {
      const errorResponse = {
        response: {
          data: mockApiError,
          status: 400,
        },
      }
      mockAxios.post.mockRejectedValue(errorResponse)

      await expect(service.createUser(mockCreateUserRequest)).rejects.toThrow('Invalid input data')
    })

    it('handles duplicate email error', async () => {
      const duplicateError = {
        response: {
          data: {
            error: 'DUPLICATE_EMAIL',
            message: 'Email already exists',
          },
          status: 409,
        },
      }
      mockAxios.post.mockRejectedValue(duplicateError)

      await expect(service.createUser(mockCreateUserRequest)).rejects.toThrow('Email already exists')
    })
  })

  describe('updateUser', () => {
    it('updates user successfully', async () => {
      const updatedUser = { ...mockUser, ...mockUpdateUserRequest }
      mockAxios.put.mockResolvedValue({ data: updatedUser })

      const result = await service.updateUser(mockUser.uid, mockUpdateUserRequest)

      expect(mockAxios.put).toHaveBeenCalledWith(`/v1/users/${mockUser.uid}`, mockUpdateUserRequest)
      expect(result).toEqual(updatedUser)
    })

    it('handles update user not found error', async () => {
      const notFoundError = {
        response: {
          data: {
            error: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          status: 404,
        },
      }
      mockAxios.put.mockRejectedValue(notFoundError)

      await expect(service.updateUser('nonexistent-id', mockUpdateUserRequest)).rejects.toThrow('User not found')
    })
  })

  describe('deleteUser', () => {
    it('deletes user successfully', async () => {
      mockAxios.delete.mockResolvedValue({ status: 204 })

      await service.deleteUser(mockUser.uid)

      expect(mockAxios.delete).toHaveBeenCalledWith(`/v1/users/${mockUser.uid}`)
    })

    it('handles delete user not found error', async () => {
      const notFoundError = {
        response: {
          data: {
            error: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          status: 404,
        },
      }
      mockAxios.delete.mockRejectedValue(notFoundError)

      await expect(service.deleteUser('nonexistent-id')).rejects.toThrow('User not found')
    })
  })

  describe('impersonateUser', () => {
    it('impersonates user successfully', async () => {
      mockAxios.post.mockResolvedValue({ data: mockLoginResponse })

      const result = await service.impersonateUser(mockUser.uid)

      expect(mockAxios.post).toHaveBeenCalledWith('/v1/auth/impersonate', { userId: mockUser.uid })
      expect(result).toEqual(mockLoginResponse)
    })

    it('handles impersonation authentication error', async () => {
      const authError = {
        response: {
          data: {
            error: 'AUTHENTICATION_FAILED',
            message: 'Failed to generate authentication token',
          },
          status: 401,
        },
      }
      mockAxios.post.mockRejectedValue(authError)

      await expect(service.impersonateUser(mockUser.uid)).rejects.toThrow('Failed to generate authentication token')
    })

    it('handles impersonation user not found error', async () => {
      const notFoundError = {
        response: {
          data: {
            error: 'USER_NOT_FOUND',
            message: 'User not found for impersonation',
          },
          status: 404,
        },
      }
      mockAxios.post.mockRejectedValue(notFoundError)

      await expect(service.impersonateUser('nonexistent-id')).rejects.toThrow('User not found for impersonation')
    })
  })

  describe('Error Handling', () => {
    it('handles timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      }
      mockAxios.get.mockRejectedValue(timeoutError)

      await expect(service.getUsers()).rejects.toThrow('timeout of 5000ms exceeded')
    })

    it('handles server errors without response data', async () => {
      const serverError = {
        response: {
          status: 500,
        },
      }
      mockAxios.get.mockRejectedValue(serverError)

      await expect(service.getUsers()).rejects.toThrow('An error occurred')
    })

    it('extracts error message from response data', async () => {
      const customError = {
        response: {
          data: {
            message: 'Custom error message',
          },
          status: 400,
        },
      }
      mockAxios.get.mockRejectedValue(customError)

      await expect(service.getUsers()).rejects.toThrow('Custom error message')
    })
  })
})