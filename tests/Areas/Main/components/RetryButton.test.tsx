import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RetryButton from '../../../../src/Areas/Main/components/RetryButton';
import optionsReducer from '../../../../src/store/optionsSlice';
import { useAuth } from '../../../../src/Auth/hooks';
import { createOptionsService } from '../../../../src/services';
import { logRetryAttempt } from '../../../../src/utils/errorLogger';

// Mock dependencies
vi.mock('../../../../src/Auth/hooks');
vi.mock('../../../../src/services');
vi.mock('../../../../src/utils/errorLogger');

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;
const mockCreateOptionsService = createOptionsService as vi.MockedFunction<typeof createOptionsService>;
const mockLogRetryAttempt = logRetryAttempt as vi.MockedFunction<typeof logRetryAttempt>;

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

const createMockStore = (lastError: string | null = null, retryCount = 0) => {
  return configureStore({
    reducer: {
      options: optionsReducer,
    },
    preloadedState: {
      options: {
        options: [{ id: '1', text: 'Test Option', color: '#ff0000' }],
        isLoading: false,
        isSaving: false,
        error: null,
        lastSaved: null,
        isOfflineMode: false,
        retryCount,
        lastError,
      },
    },
  });
};

const renderWithProvider = (component: React.ReactElement, store = createMockStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('RetryButton', () => {
  const mockUser = { id: 'test-user-id' };
  const mockRetryableError = {
    type: 'NETWORK',
    message: 'Failed to save options',
    retryable: true,
    timestamp: '2023-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    navigator.onLine = true;
    
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      loading: false,
    });

    mockCreateOptionsService.mockReturnValue({
      loadOptions: vi.fn(),
      saveOptions: vi.fn(),
    });
  });

  it('should not render when there is no retryable error', () => {
    const { container } = renderWithProvider(<RetryButton />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when error is not retryable', () => {
    const nonRetryableError = { ...mockRetryableError, retryable: false };
    const store = createMockStore(nonRetryableError);
    const { container } = renderWithProvider(<RetryButton />, store);
    expect(container.firstChild).toBeNull();
  });

  it('should render retry button when there is a retryable error', () => {
    const store = createMockStore(mockRetryableError);
    renderWithProvider(<RetryButton />, store);
    
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const store = createMockStore(mockRetryableError);
    renderWithProvider(<RetryButton className="custom-class" />, store);
    
    const button = screen.getByRole('button', { name: /retry/i });
    expect(button).toHaveClass('custom-class');
  });

  it('should apply size classes correctly', () => {
    const store = createMockStore(mockRetryableError);
    
    // Test small size
    const { rerender } = renderWithProvider(<RetryButton size="small" />, store);
    expect(screen.getByRole('button')).toHaveClass('retry-button--small');
    
    // Test medium size (default)
    rerender(
      <Provider store={store}>
        <RetryButton size="medium" />
      </Provider>
    );
    expect(screen.getByRole('button')).toHaveClass('retry-button--medium');
    
    // Test large size
    rerender(
      <Provider store={store}>
        <RetryButton size="large" />
      </Provider>
    );
    expect(screen.getByRole('button')).toHaveClass('retry-button--large');
  });

  it('should apply variant classes correctly', () => {
    const store = createMockStore(mockRetryableError);
    
    // Test outline variant (default)
    const { rerender } = renderWithProvider(<RetryButton variant="outline" />, store);
    expect(screen.getByRole('button')).toHaveClass('retry-button--outline');
    
    // Test primary variant
    rerender(
      <Provider store={store}>
        <RetryButton variant="primary" />
      </Provider>
    );
    expect(screen.getByRole('button')).toHaveClass('retry-button--primary');
    
    // Test secondary variant
    rerender(
      <Provider store={store}>
        <RetryButton variant="secondary" />
      </Provider>
    );
    expect(screen.getByRole('button')).toHaveClass('retry-button--secondary');
  });

  it('should not retry when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
    });

    const store = createMockStore(mockRetryableError);
    renderWithProvider(<RetryButton />, store);
    
    const button = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(button);
    
    expect(mockLogRetryAttempt).not.toHaveBeenCalled();
  });

  it('should log retry attempt when retry is clicked', async () => {
    const store = createMockStore(mockRetryableError, 2);
    renderWithProvider(<RetryButton />, store);
    
    const button = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockLogRetryAttempt).toHaveBeenCalledWith('save', 3, {
        userId: mockUser.id,
        networkStatus: true,
        errorType: 'NETWORK',
      });
    });
  });

  it('should determine operation type from error message', async () => {
    const loadError = { ...mockRetryableError, message: 'Failed to load options' };
    const store = createMockStore(loadError);
    renderWithProvider(<RetryButton />, store);
    
    const button = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockLogRetryAttempt).toHaveBeenCalledWith('load', 1, expect.any(Object));
    });
  });

  it('should disable button while retrying', async () => {
    const store = createMockStore(mockRetryableError);
    renderWithProvider(<RetryButton />, store);
    
    const button = screen.getByRole('button', { name: /retry/i });
    
    // Button should be enabled initially
    expect(button).not.toBeDisabled();
    
    fireEvent.click(button);
    
    // Button should be disabled while retrying
    expect(button).toBeDisabled();
  });

  it('should show retry count when greater than 0', () => {
    const store = createMockStore(mockRetryableError, 3);
    renderWithProvider(<RetryButton />, store);
    
    expect(screen.getByText('Retry (4)')).toBeInTheDocument();
  });

  it('should not show retry count when 0', () => {
    const store = createMockStore(mockRetryableError, 0);
    renderWithProvider(<RetryButton />, store);
    
    expect(screen.queryByText(/Attempt/)).not.toBeInTheDocument();
  });

  it('should prevent multiple simultaneous retry attempts', async () => {
    const store = createMockStore(mockRetryableError);
    renderWithProvider(<RetryButton />, store);
    
    const button = screen.getByRole('button', { name: /retry/i });
    
    // Click multiple times rapidly
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    
    // Should only log one retry attempt
    await waitFor(() => {
      expect(mockLogRetryAttempt).toHaveBeenCalledTimes(1);
    });
  });
});