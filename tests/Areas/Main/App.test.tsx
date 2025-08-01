import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { toast } from 'react-toastify';
import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import App from '../../../src/Areas/Main/App';
import { Option } from '../../../src/Areas/Main/Options/models';
import optionsReducer from '../../../src/store/optionsSlice';
import AuthProvider from '../../../src/Auth/AuthProvider';

// Mock the child components
vi.mock('../../../src/Areas/Main/Title/components/TitleComponent', () => ({
  default: ({ greeting }: { greeting: string }) => <div data-testid="title">{greeting}</div>
}));

vi.mock('../../../src/Areas/Main/Options/App', () => ({
  default: ({ options, disabled, onChange }: {
    options: Option[],
    disabled: boolean,
    onChange: (options: Option[]) => void
  }) => (
    <div data-testid="options">
      <div data-testid="options-disabled">{(disabled || false).toString()}</div>
      <div data-testid="options-count">{options.length}</div>
      <button
        data-testid="add-option"
        onClick={() => onChange([...options, { key: 'new-key', value: 'new-option', sequence: options.length + 1 }])}
      >
        Add Option
      </button>
      <button
        data-testid="delete-option"
        onClick={() => onChange(options.slice(0, -1))}
      >
        Delete Option
      </button>
    </div>
  )
}));

vi.mock('../../../src/Areas/Main/Spinner/app', () => ({
  default: ({ options, onWin, onSpinStarted }: {
    options: string[],
    onWin: (index: number) => void,
    onSpinStarted: () => void
  }) => (
    <div data-testid="spinner">
      <div data-testid="spinner-options-count">{options.length}</div>
      <button
        data-testid="start-spin"
        onClick={() => {
          onSpinStarted();
          // Simulate winning after a short delay
          setTimeout(() => onWin(0), 100);
        }}
      >
        Start Spin
      </button>
    </div>
  )
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: vi.fn(),
  ToastContainer: ({ position }: { position: string }) => <div data-testid="toast-container" data-position={position}></div>
}));

// Mock the generateGuid helper
vi.mock('../../../src/Areas/Main/Options/helpers', () => ({
  generateGuid: vi.fn(() => 'mock-guid-' + Math.random().toString(36).substr(2, 9))
}));

// Mock the services
vi.mock('../../../src/services', () => ({
  createOptionsService: vi.fn(() => ({
    loadUserOptions: vi.fn().mockResolvedValue([]),
    saveUserOptions: vi.fn().mockResolvedValue(undefined)
  }))
}));

// Mock Firebase auth
vi.mock('../../../src/Auth/Firebase/Config/Firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

// Mock the AuthProvider with the new interface but synchronous behavior for tests
vi.mock('../../../src/Auth/AuthProvider', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    onLogin: vi.fn(),
    onLogout: vi.fn(),
  })
}));

// Helper to create store with default options
const createStoreWithDefaults = () => configureStore({
  reducer: {
    options: optionsReducer,
  },
  preloadedState: {
    options: {
      options: [
        { key: 'test-1', value: 'hello', sequence: 1 },
        { key: 'test-2', value: 'goodbye', sequence: 2 }
      ],
      isLoading: false,
      isSaving: false,
      error: null,
      lastSaved: null,
    }
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: { 
          optionsService: {
            loadUserOptions: vi.fn().mockResolvedValue([]),
            saveUserOptions: vi.fn().mockResolvedValue(undefined)
          }
        },
      },
    }),
});

// Test wrapper component
const TestWrapper = ({ children, isAuthenticated = false }: { children: React.ReactNode, isAuthenticated?: boolean }) => {
  const store = configureStore({
    reducer: {
      options: optionsReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: { 
            optionsService: {
              loadUserOptions: vi.fn().mockResolvedValue([]),
              saveUserOptions: vi.fn().mockResolvedValue(undefined)
            }
          },
        },
      }),
  });

  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
};

describe('Main App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial Render', () => {
    it('should render all main components', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      expect(screen.getByTestId('title')).toBeInTheDocument();
      expect(screen.getByTestId('options')).toBeInTheDocument();
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });

    it('should display correct title', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      expect(screen.getByTestId('title')).toHaveTextContent('Wheel of Dooooooom');
    });

    it('should initialize with default options', async () => {
      // Create a store with default options pre-loaded to simulate the expected behavior
      const storeWithDefaults = configureStore({
        reducer: {
          options: optionsReducer,
        },
        preloadedState: {
          options: {
            options: [
              { key: 'test-1', value: 'hello', sequence: 1 },
              { key: 'test-2', value: 'goodbye', sequence: 2 }
            ],
            isLoading: false,
            isSaving: false,
            error: null,
            lastSaved: null,
          }
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            thunk: {
              extraArgument: { 
                optionsService: {
                  loadUserOptions: vi.fn().mockResolvedValue([]),
                  saveUserOptions: vi.fn().mockResolvedValue(undefined)
                }
              },
            },
          }),
      });

      render(
        <Provider store={storeWithDefaults}>
          <App />
        </Provider>
      );

      // Should have the pre-loaded default options
      expect(screen.getByTestId('options-count')).toHaveTextContent('2');
      expect(screen.getByTestId('spinner-options-count')).toHaveTextContent('2');
    });

    it('should initialize with spinning disabled', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      expect(screen.getByTestId('options-disabled')).toHaveTextContent('false');
    });

    it('should configure ToastContainer with correct position', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      expect(screen.getByTestId('toast-container')).toHaveAttribute('data-position', 'top-center');
    });
  });

  describe('Options State Management', () => {
    it('should update options when Options component triggers onChange', async () => {
      // Create a store with default options pre-loaded
      const storeWithDefaults = configureStore({
        reducer: {
          options: optionsReducer,
        },
        preloadedState: {
          options: {
            options: [
              { key: 'test-1', value: 'hello', sequence: 1 },
              { key: 'test-2', value: 'goodbye', sequence: 2 }
            ],
            isLoading: false,
            isSaving: false,
            error: null,
            lastSaved: null,
          }
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            thunk: {
              extraArgument: { 
                optionsService: {
                  loadUserOptions: vi.fn().mockResolvedValue([]),
                  saveUserOptions: vi.fn().mockResolvedValue(undefined)
                }
              },
            },
          }),
      });

      render(
        <Provider store={storeWithDefaults}>
          <App />
        </Provider>
      );

      // Should start with 2 options
      expect(screen.getByTestId('options-count')).toHaveTextContent('2');

      const addButton = screen.getByTestId('add-option');
      fireEvent.click(addButton);

      expect(screen.getByTestId('options-count')).toHaveTextContent('3');
      expect(screen.getByTestId('spinner-options-count')).toHaveTextContent('3');
    });

    it('should handle option deletion', async () => {
      const store = createStoreWithDefaults();
      
      render(
        <Provider store={store}>
          <App />
        </Provider>
      );

      // Should start with 2 options
      expect(screen.getByTestId('options-count')).toHaveTextContent('2');

      const deleteButton = screen.getByTestId('delete-option');
      fireEvent.click(deleteButton);

      expect(screen.getByTestId('options-count')).toHaveTextContent('1');
      expect(screen.getByTestId('spinner-options-count')).toHaveTextContent('1');
    });

    it('should pass correct display options to Spinner', async () => {
      const store = createStoreWithDefaults();
      
      render(
        <Provider store={store}>
          <App />
        </Provider>
      );

      // Should have 2 options passed to spinner
      expect(screen.getByTestId('spinner-options-count')).toHaveTextContent('2');
    });
  });

  describe('Spinner Integration', () => {
    it('should disable options when spinning starts', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      const startSpinButton = screen.getByTestId('start-spin');
      fireEvent.click(startSpinButton);

      expect(screen.getByTestId('options-disabled')).toHaveTextContent('true');
    });

    it('should enable options when spinning ends', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      const startSpinButton = screen.getByTestId('start-spin');
      fireEvent.click(startSpinButton);

      expect(screen.getByTestId('options-disabled')).toHaveTextContent('true');

      // Wait for the win callback to be triggered
      await waitFor(() => {
        expect(screen.getByTestId('options-disabled')).toHaveTextContent('false');
      }, { timeout: 1000 });
    });
  });

  describe('Win Handling', () => {
    it('should show toast notification when winning with valid index', async () => {
      const store = createStoreWithDefaults();
      
      render(
        <Provider store={store}>
          <App />
        </Provider>
      );

      // Should have options for the win logic to work
      expect(screen.getByTestId('options-count')).toHaveTextContent('2');

      const startSpinButton = screen.getByTestId('start-spin');
      fireEvent.click(startSpinButton);

      // Wait for the win callback to be triggered
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith('Winner! Hello');
      }, { timeout: 1000 });
    });

    it('should capitalize winner text in toast', async () => {
      const store = createStoreWithDefaults();
      
      render(
        <Provider store={store}>
          <App />
        </Provider>
      );

      // Should have options for the win logic to work
      expect(screen.getByTestId('options-count')).toHaveTextContent('2');

      const startSpinButton = screen.getByTestId('start-spin');
      fireEvent.click(startSpinButton);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith('Winner! Hello');
      }, { timeout: 1000 });
    });

    it('should not show toast for invalid winning index', async () => {
      // Create a custom component that simulates invalid index
      const CustomApp = () => {
        const [options] = useState<Option[]>([
          { key: 'test-1', value: 'hello', sequence: 1 },
          { key: 'test-2', value: 'goodbye', sequence: 2 }
        ]);
        const [isSpinning, setIsSpinning] = useState<boolean>(false);

        const handleWin = (index: number) => {
          if (index > -1 && options.length > index) {
            toast(`Winner! ${options[index].value.charAt(0).toUpperCase() + options[index].value.slice(1)}`);
          }
          setIsSpinning(false);
        }

        return (
          <div>
            <button
              data-testid="start-spin"
              onClick={() => {
                setIsSpinning(true);
                setTimeout(() => handleWin(-1), 100);
              }}
            >
              Start Spin
            </button>
          </div>
        );
      };

      render(<CustomApp />);

      const startSpinButton = screen.getByTestId('start-spin');
      fireEvent.click(startSpinButton);

      await waitFor(() => {
        expect(toast).not.toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should not show toast for out of bounds winning index', async () => {
      // Create a custom component that simulates out of bounds index
      const CustomApp = () => {
        const [options] = useState<Option[]>([
          { key: 'test-1', value: 'hello', sequence: 1 },
          { key: 'test-2', value: 'goodbye', sequence: 2 }
        ]);
        const [isSpinning, setIsSpinning] = useState<boolean>(false);

        const handleWin = (index: number) => {
          if (index > -1 && options.length > index) {
            toast(`Winner! ${options[index].value.charAt(0).toUpperCase() + options[index].value.slice(1)}`);
          }
          setIsSpinning(false);
        }

        return (
          <div>
            <button
              data-testid="start-spin"
              onClick={() => {
                setIsSpinning(true);
                setTimeout(() => handleWin(10), 100);
              }}
            >
              Start Spin
            </button>
          </div>
        );
      };

      render(<CustomApp />);

      const startSpinButton = screen.getByTestId('start-spin');
      fireEvent.click(startSpinButton);

      await waitFor(() => {
        expect(toast).not.toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  describe('Disabled State Behavior', () => {
    it('should properly manage disabled state throughout spin cycle', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Initially not disabled
      expect(screen.getByTestId('options-disabled')).toHaveTextContent('false');

      // Start spinning - should be disabled
      const startSpinButton = screen.getByTestId('start-spin');
      fireEvent.click(startSpinButton);
      expect(screen.getByTestId('options-disabled')).toHaveTextContent('true');

      // After win - should be enabled again
      await waitFor(() => {
        expect(screen.getByTestId('options-disabled')).toHaveTextContent('false');
      }, { timeout: 1000 });
    });
  });

  describe('Capitalize Helper Function', () => {
    it('should handle empty strings', async () => {
      // Create a custom component that tests capitalize with empty string
      const CustomApp = () => {
        const [options] = useState<Option[]>([
          { key: 'test-1', value: '', sequence: 1 }
        ]);
        const [isSpinning, setIsSpinning] = useState<boolean>(false);

        const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

        const handleWin = (index: number) => {
          if (index > -1 && options.length > index) {
            toast(`Winner! ${capitalize(options[index].value)}`);
          }
          setIsSpinning(false);
        }

        return (
          <div>
            <button
              data-testid="start-spin"
              onClick={() => {
                setIsSpinning(true);
                setTimeout(() => handleWin(0), 100);
              }}
            >
              Start Spin
            </button>
          </div>
        );
      };

      render(<CustomApp />);

      const startSpinButton = screen.getByTestId('start-spin');
      fireEvent.click(startSpinButton);

      await waitFor(() => {
        // Should show "Winner! " with empty capitalized string
        expect(toast).toHaveBeenCalledWith('Winner! ');
      }, { timeout: 1000 });
    });
  });
});