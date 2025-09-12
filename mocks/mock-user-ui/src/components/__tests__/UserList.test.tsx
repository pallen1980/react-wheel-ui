import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { UserList } from '../UserList'
import { mockUsers, mockUserManagementService } from '../../test/mocks'

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

describe('UserList Component', () => {
  const mockOnEditUser = vi.fn()
  const mockOnDeleteUser = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUserManagementService.getUsers.mockResolvedValue(mockUsers)
  })

  it('renders user list with loading state initially', () => {
    render(
      <UserList
        onEditUser={mockOnEditUser}
        onDeleteUser={mockOnDeleteUser}
      />
    )

    expect(screen.getByText('Loading users...')).toBeInTheDocument()
  })

  it('displays users after loading', async () => {
    render(
      <UserList
        onEditUser={mockOnEditUser}
        onDeleteUser={mockOnDeleteUser}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('test2@example.com')).toBeInTheDocument()
      expect(screen.getByText('Test User 2')).toBeInTheDocument()
    })

    expect(mockUserManagementService.getUsers).toHaveBeenCalledOnce()
  })

  it('displays error message when loading fails', async () => {
    const errorMessage = 'Failed to load users'
    mockUserManagementService.getUsers.mockRejectedValue({ message: errorMessage })

    render(
      <UserList
        onEditUser={mockOnEditUser}
        onDeleteUser={mockOnDeleteUser}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('calls onEditUser when edit button is clicked', async () => {
    render(
      <UserList
        onEditUser={mockOnEditUser}
        onDeleteUser={mockOnDeleteUser}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByText('Edit')
    fireEvent.click(editButtons[0])

    expect(mockOnEditUser).toHaveBeenCalledWith(mockUsers[0])
  })

  it('shows delete confirmation when delete button is clicked', async () => {
    render(
      <UserList
        onEditUser={mockOnEditUser}
        onDeleteUser={mockOnDeleteUser}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])

    expect(screen.getByText('Delete User')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete the user "test@example.com"/)).toBeInTheDocument()
  })

  it('calls loginAsUser when "Login as User" button is clicked', async () => {
    mockUserManagementService.loginAsUser = vi.fn().mockResolvedValue(undefined)
    
    render(
      <UserList
        onEditUser={mockOnEditUser}
        onDeleteUser={mockOnDeleteUser}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    const impersonateButtons = screen.getAllByText('Login as User')
    fireEvent.click(impersonateButtons[0])

    expect(mockUserManagementService.loginAsUser).toHaveBeenCalledWith(mockUsers[0].uid, 'http://localhost:5173')
  })

  it('filters users based on search input', async () => {
    const user = userEvent.setup()

    render(
      <UserList
        onEditUser={mockOnEditUser}
        onDeleteUser={mockOnDeleteUser}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search users by email or name...')
    await user.type(searchInput, 'test2')

    await waitFor(() => {
      expect(screen.getByText('test2@example.com')).toBeInTheDocument()
      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument()
    })
  })

  it('shows "No users found" when search returns no results', async () => {
    const user = userEvent.setup()

    render(
      <UserList
        onEditUser={mockOnEditUser}
        onDeleteUser={mockOnDeleteUser}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search users by email or name...')
    await user.type(searchInput, 'nonexistent')

    await waitFor(() => {
      expect(screen.getByText(/No users found matching "nonexistent"/)).toBeInTheDocument()
    })
  })

  it('displays email verification status correctly', async () => {
    render(
      <UserList
        onEditUser={mockOnEditUser}
        onDeleteUser={mockOnDeleteUser}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    // Check for verified and unverified users
    const verifiedElements = screen.getAllByText('Verified')
    const unverifiedElements = screen.getAllByText('Unverified')
    
    expect(verifiedElements).toHaveLength(2) // First two users are verified
    expect(unverifiedElements).toHaveLength(1) // Third user is not verified
  })
})