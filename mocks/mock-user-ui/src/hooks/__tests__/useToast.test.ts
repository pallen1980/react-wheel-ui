import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from '../useToast'

describe('useToast Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with no toasts', () => {
    const { result } = renderHook(() => useToast())

    expect(result.current.toasts).toEqual([])
  })

  it('shows success toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showSuccess('Success message')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      message: 'Success message',
      duration: 5000,
    })
  })

  it('shows error toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showError('Error message')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({
      type: 'error',
      message: 'Error message',
      duration: 0, // Errors don't auto-dismiss
    })
  })

  it('shows info toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showInfo('Info message')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({
      type: 'info',
      message: 'Info message',
      duration: 5000,
    })
  })

  it('shows warning toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showWarning('Warning message')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({
      type: 'warning',
      message: 'Warning message',
      duration: 5000,
    })
  })

  it('removes toast', () => {
    const { result } = renderHook(() => useToast())

    let toastId: string

    act(() => {
      toastId = result.current.showInfo('Test message')
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.removeToast(toastId)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('adds multiple toasts', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showInfo('First message')
      result.current.showError('Second message')
    })

    expect(result.current.toasts).toHaveLength(2)
    expect(result.current.toasts[0].message).toBe('First message')
    expect(result.current.toasts[1].message).toBe('Second message')
  })

  it('sets custom duration for success toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showSuccess('Custom duration message', { duration: 2000 })
    })

    expect(result.current.toasts[0].duration).toBe(2000)
  })

  it('sets custom title for toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showInfo('Info message', { title: 'Custom Title' })
    })

    expect(result.current.toasts[0].title).toBe('Custom Title')
  })

  it('error toasts do not auto-dismiss by default', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showError('Error message')
    })

    expect(result.current.toasts[0].duration).toBe(0)
  })

  it('clears all toasts', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showInfo('First message')
      result.current.showError('Second message')
      result.current.showWarning('Third message')
    })

    expect(result.current.toasts).toHaveLength(3)

    act(() => {
      result.current.clearAllToasts()
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('generates unique IDs for toasts', () => {
    const { result } = renderHook(() => useToast())

    let id1: string, id2: string

    act(() => {
      id1 = result.current.showInfo('First message')
      id2 = result.current.showInfo('Second message')
    })

    expect(id1).not.toBe(id2)
    expect(result.current.toasts[0].id).toBe(id1)
    expect(result.current.toasts[1].id).toBe(id2)
  })

  it('handles empty message', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showInfo('')
    })

    expect(result.current.toasts[0].message).toBe('')
  })

  it('handles special characters in message', () => {
    const { result } = renderHook(() => useToast())
    const specialMessage = 'Message with <script>alert("xss")</script> & special chars'

    act(() => {
      result.current.showWarning(specialMessage)
    })

    expect(result.current.toasts[0].message).toBe(specialMessage)
  })
})