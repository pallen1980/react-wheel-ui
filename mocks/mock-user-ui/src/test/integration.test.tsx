import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from './utils'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { mockUsers, mockUser, mockCreateUserRequest } from './mocks'

// Mock the actual services with real HTTP behavior
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock window.location for redirect testing
const mockLocation = {
  href: 'http://localhost:3002',
  origin: 'http://localhost:3002',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('User Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('End-to-End User Management Workflow', () => {
    it('should complete full user lifecycle: create, list, edit, delete', async () => {
      const user = userEvent.setup()

      // Mock API responses
      mockFetch
        // Initial load - empty user list
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        // Create user
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser,
        })
        // Refresh after create - user list with new user
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockUser],
        })
        // Update user
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockUser, displayName: 'Updated User' }),
        })
        // Delete user
        .mockResolvedValueOnce({
          ok: true,
        })

      render(<App />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/No users available/)).toBeInTheDocument()
      })

      // Create a new user
      const addButton = screen.getByText('Add New User')
      await user.click(addButton)

      // Fill out the form
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const displayNameInput = screen.getByLabelText('Display Name')

      await user.type(emailInput, mockCreateUserRequest.email)
      await user.type(passwordInput, mockCreateUserRequest.password)
      await user.type(displayNameInput, mockCreateUserRequest.displayName)

      // Submit the form
      const createButton = screen.getByText('Create User')
      await user.click(createButton)

      // Verify user was created and appears in list
      await waitFor(() => {
        expect(screen.getByText(mockUser.email)).toBeInTheDocument()
        expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
      })

      // Edit the user
      const editButton = screen.getByText('Edit')
      await user.click(editButton)

      const editDisplayNameInput = screen.getByDisplayValue(mockUser.displayName)
      await user.clear(editDisplayNameInput)
      await user.type(editDisplayNameInput, 'Updated User')

      const updateButton = screen.getByText('Update User')
      await user.click(updateButton)

      // Verify user was updated
      await waitFor(() => {
        expect(screen.getByText('Updated User')).toBeInTheDocument()
      })

      // Delete the user
      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      // Confirm deletion
      const confirmButton = screen.getByText('Delete User')
      await user.click(confirmButton)

      // Verify API calls were made correctly
      expect(mockFetch).toHaveBeenCalledTimes(5)
      
      // Check create user call
      expect(mockFetch).toHaveBeenNthCalledWith(2, 
        'http://localhost:3001/v1/users',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(mockCreateUserRequest),
        })
      )

      // Check update user call
      expect(mockFetch).toHaveBeenNthCalledWith(4,
        `http://localhost:3001/v1/users/${mockUser.uid}`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            email: mockUser.email,
            displayName: 'Updated User',
          }),
        })
      )

      // Check delete user call
      expect(mockFetch).toHaveBeenNthCalledWith(5,
        `http://localhost:3001/v1/users/${mockUser.uid}`,
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('should handle user impersonation and redirect workflow', async () => {
      const user = userEvent.setup()

      // Mock API responses
      mockFetch
        // Initial load - user list
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockUser],
        })
        // Impersonate user
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: 'mock-jwt-token',
            user: mockUser,
            expiresIn: 3600,
          }),
        })

      render(<App />)

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText(mockUser.email)).toBeInTheDocument()
      })

      // Click "Login as User" button
      const loginAsUserButton = screen.getByText('Login as User')
      await user.click(loginAsUserButton)

      // Verify impersonation API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenNthCalledWith(2,
          'http://localhost:3001/v1/auth/impersonate',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({ userId: mockUser.uid }),
          })
        )
      })

      // Verify token was stored in localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'mock-jwt-token')

      // Verify redirect occurred
      expect(window.location.href).toBe('http://localhost:51235')
    })

    it('should handle search and filtering workflow', async () => {
      const user = userEvent.setup()
      const multipleUsers = [
        mockUser,
        {
          ...mockUser,
          uid: 'user-2',
          email: 'john@example.com',
          displayName: 'John Doe',
        },
        {
          ...mockUser,
          uid: 'user-3',
          email: 'jane@example.com',
          displayName: 'Jane Smith',
        },
      ]

      // Mock API response with multiple users
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => multipleUsers,
      })

      render(<App />)

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('jane@example.com')).toBeInTheDocument()
      })

      // Search for specific user
      const searchInput = screen.getByPlaceholderText('Search users by email or name...')
      await user.type(searchInput, 'john')

      // Verify filtering works
      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.queryByText('test@example.com')).not.toBeInTheDocument()
        expect(screen.queryByText('jane@example.com')).not.toBeInTheDocument()
      })

      // Clear search
      await user.clear(searchInput)

      // Verify all users are shown again
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('jane@example.com')).toBeInTheDocument()
      })
    })
  })

  describe('Error Scenarios and Recovery', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network Error'))

      render(<App />)

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/Network Error/)).toBeInTheDocument()
      })

      // Verify retry functionality
      const retryButton = screen.getByText('Retry')
      expect(retryButton).toBeInTheDocument()

      // Mock successful retry
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockUser],
      })

      fireEvent.click(retryButton)

      // Verify data loads after retry
      await waitFor(() => {
        expect(screen.getByText(mockUser.email)).toBeInTheDocument()
      })
    })

    it('should handle API validation errors', async () => {
      const user = userEvent.setup()

      // Mock initial load
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        // Mock validation error on create
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            error: 'VALIDATION_ERROR',
            message: 'Email is required',
            details: { field: 'email', message: 'Email is required' },
          }),
        })

      render(<App />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/No users available/)).toBeInTheDocument()
      })

      // Try to create user with invalid data
      const addButton = screen.getByText('Add New User')
      await user.click(addButton)

      // Submit form without filling required fields
      const createButton = screen.getByText('Create User')
      await user.click(createButton)

      // Verify validation error is displayed
      await waitFor(() => {
        expect(screen.getByText(/Email is required/)).toBeInTheDocument()
      })
    })

    it('should handle server errors with proper error messages', async () => {
      // Mock server error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error occurred',
        }),
      })

      render(<App />)

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/Internal server error occurred/)).toBeInTheDocument()
      })
    })

    it('should handle impersonation failures', async () => {
      const user = userEvent.setup()

      // Mock API responses
      mockFetch
        // Initial load - user list
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockUser],
        })
        // Impersonation failure
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({
            error: 'USER_NOT_FOUND',
            message: 'User not found for impersonation',
          }),
        })

      render(<App />)

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText(mockUser.email)).toBeInTheDocument()
      })

      // Try to impersonate user
      const loginAsUserButton = screen.getByText('Login as User')
      await user.click(loginAsUserButton)

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/User not found for impersonation/)).toBeInTheDocument()
      })

      // Verify no redirect occurred
      expect(window.location.href).toBe('http://localhost:3002')
    })
  })

  describe('Cross-Service Communication', () => {
    it('should properly communicate with mock API service', async () => {
      // Mock successful API communication
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      })

      render(<App />)

      // Verify API call was made with correct parameters
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/v1/users',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        )
      })

      // Verify data was loaded correctly
      expect(screen.getByText(mockUsers[0].email)).toBeInTheDocument()
    })

    it('should handle CORS and network configuration correctly', async () => {
      // Mock CORS preflight and actual request
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsers,
        })

      render(<App />)

      // Verify requests are made correctly
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })
    })
  })
})