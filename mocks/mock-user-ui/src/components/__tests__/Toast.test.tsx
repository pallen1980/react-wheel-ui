import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { Toast } from '../Toast'

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders toast message', () => {
    render(
      <Toast
        message="Success message"
        type="success"
        isVisible={true}
        onClose={() => {}}
      />
    )

    expect(screen.getByText('Success message')).toBeInTheDocument()
  })

  it('does not render when not visible', () => {
    render(
      <Toast
        message="Hidden message"
        type="info"
        isVisible={false}
        onClose={() => {}}
      />
    )

    expect(screen.queryByText('Hidden message')).not.toBeInTheDocument()
  })

  it('renders success toast with correct styling', () => {
    render(
      <Toast
        message="Success!"
        type="success"
        isVisible={true}
        onClose={() => {}}
      />
    )

    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('success')
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('renders error toast with correct styling', () => {
    render(
      <Toast
        message="Error occurred"
        type="error"
        isVisible={true}
        onClose={() => {}}
      />
    )

    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('error')
    expect(screen.getByText('✗')).toBeInTheDocument()
  })

  it('renders info toast with correct styling', () => {
    render(
      <Toast
        message="Information"
        type="info"
        isVisible={true}
        onClose={() => {}}
      />
    )

    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('info')
    expect(screen.getByText('ℹ')).toBeInTheDocument()
  })

  it('renders warning toast with correct styling', () => {
    render(
      <Toast
        message="Warning"
        type="warning"
        isVisible={true}
        onClose={() => {}}
      />
    )

    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('warning')
    expect(screen.getByText('⚠')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnClose = vi.fn()

    render(
      <Toast
        message="Closeable toast"
        type="info"
        isVisible={true}
        onClose={mockOnClose}
      />
    )

    const closeButton = screen.getByText('×')
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledOnce()
  })

  it('auto-closes after specified duration', async () => {
    const mockOnClose = vi.fn()

    render(
      <Toast
        message="Auto-close toast"
        type="success"
        isVisible={true}
        onClose={mockOnClose}
        duration={3000}
      />
    )

    expect(mockOnClose).not.toHaveBeenCalled()

    vi.advanceTimersByTime(3000)

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledOnce()
    })
  })

  it('does not auto-close when duration is 0', async () => {
    const mockOnClose = vi.fn()

    render(
      <Toast
        message="Persistent toast"
        type="info"
        isVisible={true}
        onClose={mockOnClose}
        duration={0}
      />
    )

    vi.advanceTimersByTime(5000)

    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('clears timeout when component unmounts', () => {
    const mockOnClose = vi.fn()

    const { unmount } = render(
      <Toast
        message="Unmounting toast"
        type="success"
        isVisible={true}
        onClose={mockOnClose}
        duration={3000}
      />
    )

    unmount()

    vi.advanceTimersByTime(3000)

    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('resets timeout when visibility changes', async () => {
    const mockOnClose = vi.fn()

    const { rerender } = render(
      <Toast
        message="Changing toast"
        type="success"
        isVisible={true}
        onClose={mockOnClose}
        duration={3000}
      />
    )

    vi.advanceTimersByTime(1500)

    rerender(
      <Toast
        message="Changing toast"
        type="success"
        isVisible={false}
        onClose={mockOnClose}
        duration={3000}
      />
    )

    rerender(
      <Toast
        message="Changing toast"
        type="success"
        isVisible={true}
        onClose={mockOnClose}
        duration={3000}
      />
    )

    vi.advanceTimersByTime(1500)

    expect(mockOnClose).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1500)

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledOnce()
    })
  })

  it('handles long messages properly', () => {
    const longMessage = 'This is a very long toast message that should be displayed properly even when it contains a lot of text'

    render(
      <Toast
        message={longMessage}
        type="info"
        isVisible={true}
        onClose={() => {}}
      />
    )

    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })
})