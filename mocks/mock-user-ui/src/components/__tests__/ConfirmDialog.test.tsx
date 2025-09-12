import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '../ConfirmDialog'

describe('ConfirmDialog Component', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dialog when open', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Delete User')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete this user?')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('does not render dialog when closed', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.queryByText('Delete User')).not.toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const confirmButton = screen.getByText('Confirm')
    await user.click(confirmButton)

    expect(mockOnConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel when overlay is clicked', async () => {
    const user = userEvent.setup()

    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const overlay = screen.getByTestId('dialog-overlay')
    await user.click(overlay)

    expect(mockOnCancel).toHaveBeenCalledOnce()
  })

  it('does not call onCancel when dialog content is clicked', async () => {
    const user = userEvent.setup()

    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const dialogContent = screen.getByTestId('dialog-content')
    await user.click(dialogContent)

    expect(mockOnCancel).not.toHaveBeenCalled()
  })

  it('handles escape key press', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const overlay = screen.getByTestId('dialog-overlay')
    fireEvent.keyDown(overlay, { key: 'Escape', code: 'Escape' })

    expect(mockOnCancel).toHaveBeenCalledOnce()
  })

  it('renders with custom confirm button text', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        confirmText="Delete"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument()
  })

  it('renders with custom cancel button text', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        cancelText="Keep"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Keep')).toBeInTheDocument()
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
  })

  it('applies destructive styling', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        isDestructive={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const confirmButton = screen.getByText('Confirm')
    expect(confirmButton).toHaveClass('destructive')
  })
})