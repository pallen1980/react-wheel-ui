import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { UserList } from '../UserList'
import { UserForm } from '../UserForm'
import { mockUsers, mockUser, mockCreateUserRequest, mockUserManagementService } from '../../test/mocks'

// Mock the userService
vi.mock('../../services/userService', () => ({
  userService: mockUserManagementService,
}))

// Mock the useToast hook
const mockShowToast = vi.fn()
vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}))

describe('Component Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserManagementService.getUsers.mockResolvedValue(mockUsers)
  })

  describe('UserList and UserForm Integration', () => {
    it('should integrate user creation workflow', async () => {
      const user = userEvent.setup()
      const mockOnEditUser = vi.fn()
      const mockOnDeleteUser = vi.fn()

      // Mock successful user creation
      mockUserManagementService.createUser.mockResolvedValue(mockUser)

      // Render UserList
      const { rerender } = render(
        <UserList
          onEditUser={mockOnEditUser}
          onDeleteUser={mockOnDeleteUser}
        />
      )

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })

      // Simulate adding a new user by rendering UserForm
      rerender(
        <div>
          <UserList
            onEditUser={mockOnEditUser}
            onDeleteUser={mockOnDeleteUser}
          />
          <UserForm
            mode="create"
            onSuccess={() => {}}
            onCancel={() => {}}
          />
        </div>
      )

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

      // Verify user creation was called
      await waitFor(() => {
        expect(mockUserManagementService.createUser).toHaveBeenCalledWith(mockCreateUserRequest)
      })
    })

    it('should integrate user editing workflow', async () => {
      const user = userEvent.setup()
      const mockOnEditUser = vi.fn()
      const mockOnDeleteUser = vi.fn()

      // Mock successful user update
      const updatedUser = { ...mockUser, displayName: 'Updated Name' }
      mockUserManagementService.updateUser.mockResolvedValue(updatedUser)

      // Render UserList
      const { rerender } = render(
        <UserList
          onEditUser={mockOnEditUser}
          onDeleteUser={mockOnDeleteUser}
        />
      )

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })

      // Click edit button
      const editButton = screen.getAllByText('Edit')[0]
      await user.click(editButton)

      // Verify onEditUser was called
      expect(mockOnEditUser).toHaveBeenCalledWith(mockUsers[0])

      // Simulate editing by rendering UserForm in edit mode
      rerender(
        <div>
          <UserList
            onEditUser={mockOnEditUser}
            onDeleteUser={mockOnDeleteUser}
          />
          <UserForm
            mode="edit"
            user={mockUsers[0]}
            onSuccess={() => {}}
            onCancel={() => {}}
          />
        </div>
      )

      // Update the display name
      const displayNameInput = screen.getByDisplayValue(mockUsers[0].displayName)
      await user.clear(displayNameInput)
      await user.type(displayNameInput, 'Updated Name')

      // Submit the form
      const updateButton = screen.getByText('Update User')
      await user.click(updateButton)

      // Verify user update was called
      await waitFor(() => {
        expect(mockUserManagementService.updateUser).toHaveBeenCalledWith(
          mockUsers[0].uid,
          {
            email: mockUsers[0].email,
            displayName: 'Updated Name',
          }
        )
      })
    })

    it('should integrate user deletion workflow', async () => {
      const user = userEvent.setup()
      const mockOnEditUser = vi.fn()
      const mockOnDeleteUser = vi.fn()

      // Mock successful user deletion
      mockUserManagementService.deleteUser.mockResolvedValue(undefined)

      render(
        <UserList
          onEditUser={mockOnEditUser}
          onDeleteUser={mockOnDeleteUser}
        />
      )

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButton = screen.getAllByText('Delete')[0]
      await user.click(deleteButton)

      // Verify confirmation dialog appears
      expect(screen.getByText('Delete User')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete the user "test@example.com"/)).toBeInTheDocument()

      // Confirm deletion
      const confirmButton = screen.getByText('Delete User')
      await user.click(confirmButton)

      // Verify user deletion was called
      await waitFor(() => {
        expect(mockUserManagementService.deleteUser).toHaveBeenCalledWith(mockUsers[0].uid)
      })

      // Verify onDeleteUser callback was called
      expect(mockOnDeleteUser).toHaveBeenCalledWith(mockUsers[0])
    })

    it('should integrate user impersonation workflow', async () => {
      const user = userEvent.setup()
      const mockOnEditUser = vi.fn()
      const mockOnDeleteUser = vi.fn()

      // Mock successful impersonation
      mockUserManagementService.loginAsUser.mockResolvedValue(undefined)

      render(
        <UserList
          onEditUser={mockOnEditUser}
          onDeleteUser={mockOnDeleteUser}
        />
      )

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })

      // Click "Login as User" button
      const loginAsUserButton = screen.getAllByText('Login as User')[0]
      await user.click(loginAsUserButton)

      // Verify impersonation was called
      await waitFor(() => {
        expect(mockUserManagementService.loginAsUser).toHaveBeenCalledWith(
          mockUsers[0].uid,
          'http://localhost:51235'
        )
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle and display API errors across components', async () => {
      const user = userEvent.setup()

      // Mock API error
      const apiError = { message: 'Failed to load users' }
      mockUserManagementService.getUsers.mockRejectedValue(apiError)

      render(
        <UserList
          onEditUser={() => {}}
          onDeleteUser={() => {}}
        />
      )

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText('Failed to load users')).toBeInTheDocument()
      })

      // Verify retry functionality
      const retryButton = screen.getByText('Retry')
      expect(retryButton).toBeInTheDocument()

      // Mock successful retry
      mockUserManagementService.getUsers.mockResolvedValue(mockUsers)
      await user.click(retryButton)

      // Verify data loads after retry
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })
    })

    it('should handle form validation errors', async () => {
      const user = userEvent.setup()

      render(
        <UserForm
          mode="create"
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      // Try to submit empty form
      const createButton = screen.getByText('Create User')
      await user.click(createButton)

      // Verify validation errors are displayed
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument()
        expect(screen.getByText('Password is required')).toBeInTheDocument()
        expect(screen.getByText('Display name is required')).toBeInTheDocument()
      })
    })

    it('should handle API errors during user operations', async () => {
      const user = userEvent.setup()

      // Mock API error for user creation
      const apiError = { message: 'Email already exists' }
      mockUserManagementService.createUser.mockRejectedValue(apiError)

      render(
        <UserForm
          mode="create"
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

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

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText('Error: Email already exists')).toBeInTheDocument()
      })

      // Verify toast notification was shown
      expect(mockShowToast).toHaveBeenCalledWith('Failed to create user: Email already exists', 'error')
    })
  })

  describe('State Management Integration', () => {
    it('should properly manage loading states across components', async () => {
      // Mock delayed API response
      let resolvePromise: (value: any) => void
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockUserManagementService.getUsers.mockReturnValue(delayedPromise)

      render(
        <UserList
          onEditUser={() => {}}
          onDeleteUser={() => {}}
        />
      )

      // Verify loading state is shown
      expect(screen.getByText('Loading users...')).toBeInTheDocument()

      // Resolve the promise
      resolvePromise!(mockUsers)

      // Verify data is loaded
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })
    })

    it('should handle concurrent operations correctly', async () => {
      const user = userEvent.setup()

      // Mock multiple API calls
      mockUserManagementService.createUser.mockResolvedValue(mockUser)
      mockUserManagementService.deleteUser.mockResolvedValue(undefined)

      render(
        <div>
          <UserList
            onEditUser={() => {}}
            onDeleteUser={() => {}}
          />
          <UserForm
            mode="create"
            onSuccess={() => {}}
            onCancel={() => {}}
          />
        </div>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })

      // Start user creation
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const displayNameInput = screen.getByLabelText('Display Name')

      await user.type(emailInput, 'new@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(displayNameInput, 'New User')

      const createButton = screen.getByText('Create User')
      await user.click(createButton)

      // Start user deletion
      const deleteButton = screen.getAllByText('Delete')[0]
      await user.click(deleteButton)

      const confirmButton = screen.getByText('Delete User')
      await user.click(confirmButton)

      // Verify both operations complete
      await waitFor(() => {
        expect(mockUserManagementService.createUser).toHaveBeenCalled()
        expect(mockUserManagementService.deleteUser).toHaveBeenCalled()
      })
    })
  })
})