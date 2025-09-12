import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { UserForm } from '../UserForm'
import { mockUser, mockCreateUserRequest, mockUserManagementService } from '../../test/mocks'

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

describe('UserForm Component', () => {
  const mockOnSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Mode', () => {
    it('renders create form with empty fields', () => {
      render(
        <UserForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('Create New User')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toHaveValue('')
      expect(screen.getByLabelText('Password')).toHaveValue('')
      expect(screen.getByLabelText('Display Name')).toHaveValue('')
      expect(screen.getByText('Create User')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('validates required fields', async () => {
      const user = userEvent.setup()

      render(
        <UserForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByText('Create User')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument()
        expect(screen.getByText('Password is required')).toBeInTheDocument()
        expect(screen.getByText('Display name is required')).toBeInTheDocument()
      })
    })

    it('validates email format', async () => {
      const user = userEvent.setup()

      render(
        <UserForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const emailInput = screen.getByLabelText('Email')
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByText('Create User')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })
    })

    it('validates password length', async () => {
      const user = userEvent.setup()

      render(
        <UserForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const passwordInput = screen.getByLabelText('Password')
      await user.type(passwordInput, '123')

      const submitButton = screen.getByText('Create User')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
      })
    })

    it('submits form with valid data', async () => {
      const user = userEvent.setup()
      mockUserManagementService.createUser.mockResolvedValue(mockUser)

      render(
        <UserForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const displayNameInput = screen.getByLabelText('Display Name')

      await user.type(emailInput, mockCreateUserRequest.email)
      await user.type(passwordInput, mockCreateUserRequest.password)
      await user.type(displayNameInput, mockCreateUserRequest.displayName)

      const submitButton = screen.getByText('Create User')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUserManagementService.createUser).toHaveBeenCalledWith(mockCreateUserRequest)
        expect(mockOnSuccess).toHaveBeenCalledWith(mockUser)
        expect(mockShowToast).toHaveBeenCalledWith('User created successfully', 'success')
      })
    })

    it('handles create error', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Email already exists'
      mockUserManagementService.createUser.mockRejectedValue(new Error(errorMessage))

      render(
        <UserForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const displayNameInput = screen.getByLabelText('Display Name')

      await user.type(emailInput, mockCreateUserRequest.email)
      await user.type(passwordInput, mockCreateUserRequest.password)
      await user.type(displayNameInput, mockCreateUserRequest.displayName)

      const submitButton = screen.getByText('Create User')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument()
        expect(mockShowToast).toHaveBeenCalledWith(`Failed to create user: ${errorMessage}`, 'error')
      })
    })
  })

  describe('Edit Mode', () => {
    it('renders edit form with user data', () => {
      render(
        <UserForm
          mode="edit"
          user={mockUser}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('Edit User')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toHaveValue(mockUser.email)
      expect(screen.getByLabelText('Display Name')).toHaveValue(mockUser.displayName)
      expect(screen.getByText('Update User')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      
      // Password field should be empty in edit mode
      expect(screen.getByLabelText('Password (leave empty to keep current)')).toHaveValue('')
    })

    it('submits form with updated data', async () => {
      const user = userEvent.setup()
      const updatedUser = { ...mockUser, displayName: 'Updated Name' }
      mockUserManagementService.updateUser.mockResolvedValue(updatedUser)

      render(
        <UserForm
          mode="edit"
          user={mockUser}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const displayNameInput = screen.getByLabelText('Display Name')
      await user.clear(displayNameInput)
      await user.type(displayNameInput, 'Updated Name')

      const submitButton = screen.getByText('Update User')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUserManagementService.updateUser).toHaveBeenCalledWith(mockUser.uid, {
          email: mockUser.email,
          displayName: 'Updated Name',
        })
        expect(mockOnSuccess).toHaveBeenCalledWith(updatedUser)
        expect(mockShowToast).toHaveBeenCalledWith('User updated successfully', 'success')
      })
    })

    it('includes password in update when provided', async () => {
      const user = userEvent.setup()
      const updatedUser = { ...mockUser }
      mockUserManagementService.updateUser.mockResolvedValue(updatedUser)

      render(
        <UserForm
          mode="edit"
          user={mockUser}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const passwordInput = screen.getByLabelText('Password (leave empty to keep current)')
      await user.type(passwordInput, 'newpassword123')

      const submitButton = screen.getByText('Update User')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUserManagementService.updateUser).toHaveBeenCalledWith(mockUser.uid, {
          email: mockUser.email,
          displayName: mockUser.displayName,
          password: 'newpassword123',
        })
      })
    })

    it('handles update error', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Update failed'
      mockUserManagementService.updateUser.mockRejectedValue(new Error(errorMessage))

      render(
        <UserForm
          mode="edit"
          user={mockUser}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByText('Update User')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument()
        expect(mockShowToast).toHaveBeenCalledWith(`Failed to update user: ${errorMessage}`, 'error')
      })
    })
  })

  describe('Common Functionality', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <UserForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('shows loading state during submission', async () => {
      const user = userEvent.setup()
      // Mock a delayed response
      mockUserManagementService.createUser.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
      )

      render(
        <UserForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const displayNameInput = screen.getByLabelText('Display Name')

      await user.type(emailInput, mockCreateUserRequest.email)
      await user.type(passwordInput, mockCreateUserRequest.password)
      await user.type(displayNameInput, mockCreateUserRequest.displayName)

      const submitButton = screen.getByText('Create User')
      await user.click(submitButton)

      expect(screen.getByText('Creating...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })
  })
})