import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import ErrorNotification from '../../../../src/Areas/Main/components/ErrorNotification';
import optionsReducer, { OptionsState } from '../../../../src/store/optionsSlice';

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
  },
}));

const mockToast = toast as { error: jest.MockedFunction<typeof toast.error> };

// Mock store factory
const createMockStore = (optionsState: Partial<OptionsState>) => {
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
        ...optionsState,
      },
    },
  });
};

const renderWithStore = (optionsState: Partial<OptionsState> = {}) => {
  const store = createMockStore(optionsState);
  return {
    ...render(
      <Provider store={store}>
        <ErrorNotification />
      </Provider>
    ),
    store,
  };
};

describe('ErrorNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not show toast when there is no error', () => {
    renderWithStore();
    
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('should show toast when there is an error', () => {
    renderWithStore({ error: 'Network error occurred' });
    
    expect(mockToast.error).toHaveBeenCalledWith(
      expect.stringContaining('trouble connecting'),
      expect.objectContaining({
        position: 'top-center',
        autoClose: 5000,
      })
    );
  });

  it('should convert network errors to user-friendly messages', () => {
    const networkErrors = [
      'network timeout',
      'connection failed',
      'fetch error',
      'cors error',
      'timeout occurred'
    ];

    networkErrors.forEach((error) => {
      vi.clearAllMocks();
      renderWithStore({ error });
      
      expect(mockToast.error).toHaveBeenCalledWith(
        "We're having trouble connecting to our servers. Please check your internet connection and try again.",
        expect.any(Object)
      );
    });
  });

  it('should convert auth errors to user-friendly messages', () => {
    const authErrors = [
      'auth failed',
      'token expired',
      'unauthorized access',
      'permission denied'
    ];

    authErrors.forEach((error) => {
      vi.clearAllMocks();
      renderWithStore({ error });
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'There was an issue with your login. Please try signing in again.',
        expect.any(Object)
      );
    });
  });

  it('should convert server errors to user-friendly messages', () => {
    const serverErrors = [
      'server error',
      '500 internal server error',
      'internal error occurred'
    ];

    serverErrors.forEach((error) => {
      vi.clearAllMocks();
      renderWithStore({ error });
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'Our servers are experiencing some issues. Please try again in a few moments.',
        expect.any(Object)
      );
    });
  });

  it('should convert rate limit errors to user-friendly messages', () => {
    const rateLimitErrors = [
      'rate limit exceeded',
      'too many requests',
      '429 rate limited'
    ];

    rateLimitErrors.forEach((error) => {
      vi.clearAllMocks();
      renderWithStore({ error });
      
      expect(mockToast.error).toHaveBeenCalledWith(
        "You're making requests too quickly. Please wait a moment and try again.",
        expect.any(Object)
      );
    });
  });

  it('should convert load errors to user-friendly messages', () => {
    const loadErrors = [
      'failed to load options',
      'unable to load data'
    ];

    loadErrors.forEach((error) => {
      vi.clearAllMocks();
      renderWithStore({ error });
      
      expect(mockToast.error).toHaveBeenCalledWith(
        "We couldn't load your wheel options. Your changes are saved locally for now.",
        expect.any(Object)
      );
    });
  });

  it('should convert save errors to user-friendly messages', () => {
    const saveErrors = [
      'failed to save options',
      'unable to save changes'
    ];

    saveErrors.forEach((error) => {
      vi.clearAllMocks();
      renderWithStore({ error });
      
      expect(mockToast.error).toHaveBeenCalledWith(
        "We couldn't save your changes right now. Don't worry, they're stored locally and we'll try again.",
        expect.any(Object)
      );
    });
  });

  it('should use default message for unknown errors', () => {
    renderWithStore({ error: 'some unknown error type' });
    
    expect(mockToast.error).toHaveBeenCalledWith(
      "Something went wrong, but don't worry - your wheel is still working! We'll try to fix this automatically.",
      expect.any(Object)
    );
  });

  it('should have onClose callback in toast options', () => {
    renderWithStore({ error: 'test error' });
    
    // Get the onClose callback from the toast call
    const toastCall = mockToast.error.mock.calls[0];
    const toastOptions = toastCall[1];
    
    expect(toastOptions.onClose).toBeDefined();
    expect(typeof toastOptions.onClose).toBe('function');
  });

  it('should render nothing visible', () => {
    const { container } = renderWithStore({ error: 'test error' });
    
    expect(container.firstChild).toBeNull();
  });
});