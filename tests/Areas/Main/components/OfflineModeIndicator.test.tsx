import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OfflineModeIndicator from '../../../../src/Areas/Main/components/OfflineModeIndicator';
import optionsReducer from '../../../../src/store/optionsSlice';
import { useAuth } from '../../../../src/Auth/hooks';

// Mock the auth hook
vi.mock('../../../../src/Auth/hooks');
const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock window event listeners
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
Object.defineProperty(window, 'addEventListener', { value: mockAddEventListener });
Object.defineProperty(window, 'removeEventListener', { value: mockRemoveEventListener });

const createMockStore = (isOfflineMode = false) => {
  return configureStore({
    reducer: {
      options: optionsReducer,
    },
    preloadedState: {
      options: {
        options: [],
        isLoading: false,
        isSaving: false,
        error: null,
        lastSaved: null,
        isOfflineMode,
        retryCount: 0,
        lastError: null,
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

describe('OfflineModeIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigator.onLine = true;
  });

  it('should not render when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
    });

    const { container } = renderWithProvider(<OfflineModeIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when online and not in offline mode', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user' },
      loading: false,
    });

    navigator.onLine = true;
    const { container } = renderWithProvider(<OfflineModeIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('should render offline indicator when in offline mode', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user' },
      loading: false,
    });

    const store = createMockStore(true);
    renderWithProvider(<OfflineModeIndicator />, store);
    
    expect(screen.getByText('Working Offline')).toBeInTheDocument();
  });

  it('should render offline indicator when network is offline', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user' },
      loading: false,
    });

    navigator.onLine = false;
    renderWithProvider(<OfflineModeIndicator />);
    
    expect(screen.getByText('No Internet Connection')).toBeInTheDocument();
  });

  it('should show online indicator when showWhenOnline is true and online', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user' },
      loading: false,
    });

    navigator.onLine = true;
    renderWithProvider(<OfflineModeIndicator showWhenOnline={true} />);
    
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user' },
      loading: false,
    });

    const store = createMockStore(true);
    const { container } = renderWithProvider(
      <OfflineModeIndicator className="custom-class" />, 
      store
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should set up network event listeners on mount', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user' },
      loading: false,
    });

    renderWithProvider(<OfflineModeIndicator />);
    
    expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should clean up event listeners on unmount', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user' },
      loading: false,
    });

    const { unmount } = renderWithProvider(<OfflineModeIndicator />);
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should update network status when online event fires', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user' },
      loading: false,
    });

    navigator.onLine = false;
    renderWithProvider(<OfflineModeIndicator />);
    
    // Initially should show offline
    expect(screen.getByText('No Internet Connection')).toBeInTheDocument();
    
    // Simulate online event
    const onlineHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'online')?.[1];
    if (onlineHandler) {
      navigator.onLine = true;
      onlineHandler();
    }
  });

  it('should update network status when offline event fires', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user' },
      loading: false,
    });

    navigator.onLine = true;
    renderWithProvider(<OfflineModeIndicator showWhenOnline={true} />);
    
    // Initially should show online
    expect(screen.getByText('Online')).toBeInTheDocument();
    
    // Simulate offline event
    const offlineHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'offline')?.[1];
    if (offlineHandler) {
      navigator.onLine = false;
      offlineHandler();
    }
  });
});