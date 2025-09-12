import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { ErrorMessage } from '../ErrorMessage'

describe('ErrorMessage Component', () => {
  it('renders error message', () => {
    const errorMessage = 'Something went wrong'

    render(<ErrorMessage message={errorMessage} />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not render when message is empty', () => {
    render(<ErrorMessage message="" />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('does not render when message is null', () => {
    render(<ErrorMessage message={null} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders retry button when onRetry is provided', () => {
    const mockOnRetry = vi.fn()

    render(
      <ErrorMessage
        message="Failed to load data"
        onRetry={mockOnRetry}
      />
    )

    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnRetry = vi.fn()

    render(
      <ErrorMessage
        message="Failed to load data"
        onRetry={mockOnRetry}
      />
    )

    const retryButton = screen.getByText('Retry')
    await user.click(retryButton)

    expect(mockOnRetry).toHaveBeenCalledOnce()
  })

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorMessage message="Failed to load data" />)

    expect(screen.queryByText('Retry')).not.toBeInTheDocument()
  })

  it('renders with custom className', () => {
    render(
      <ErrorMessage
        message="Error message"
        className="custom-error"
      />
    )

    const errorElement = screen.getByRole('alert')
    expect(errorElement).toHaveClass('custom-error')
  })

  it('renders with error icon', () => {
    render(<ErrorMessage message="Error occurred" />)

    const errorIcon = screen.getByText('⚠️')
    expect(errorIcon).toBeInTheDocument()
  })

  it('handles long error messages', () => {
    const longMessage = 'This is a very long error message that should be displayed properly even when it contains a lot of text and might wrap to multiple lines'

    render(<ErrorMessage message={longMessage} />)

    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })

  it('renders with different severity levels', () => {
    render(
      <ErrorMessage
        message="Warning message"
        severity="warning"
      />
    )

    const errorElement = screen.getByRole('alert')
    expect(errorElement).toHaveClass('warning')
  })

  it('renders dismissible error message', async () => {
    const user = userEvent.setup()
    const mockOnDismiss = vi.fn()

    render(
      <ErrorMessage
        message="Dismissible error"
        onDismiss={mockOnDismiss}
      />
    )

    const dismissButton = screen.getByText('×')
    await user.click(dismissButton)

    expect(mockOnDismiss).toHaveBeenCalledOnce()
  })
})