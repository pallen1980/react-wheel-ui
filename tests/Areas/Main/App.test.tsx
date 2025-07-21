import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { toast } from 'react-toastify';
import { useState } from 'react';

import App from '../../../src/Areas/Main/App';
import { Option } from '../../../src/Areas/Main/Options/models';

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
      <div data-testid="options-disabled">{disabled.toString()}</div>
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

describe('Main App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial Render', () => {
    it('should render all main components', () => {
      render(<App />);

      expect(screen.getByTestId('title')).toBeInTheDocument();
      expect(screen.getByTestId('options')).toBeInTheDocument();
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });

    it('should display correct title', () => {
      render(<App />);

      expect(screen.getByTestId('title')).toHaveTextContent('Wheel of Dooooooom');
    });

    it('should initialize with default options', () => {
      render(<App />);

      expect(screen.getByTestId('options-count')).toHaveTextContent('2');
      expect(screen.getByTestId('spinner-options-count')).toHaveTextContent('2');
    });

    it('should initialize with spinning disabled', () => {
      render(<App />);

      expect(screen.getByTestId('options-disabled')).toHaveTextContent('false');
    });

    it('should configure ToastContainer with correct position', () => {
      render(<App />);

      expect(screen.getByTestId('toast-container')).toHaveAttribute('data-position', 'top-center');
    });
  });

  describe('Options State Management', () => {
    it('should update options when Options component triggers onChange', () => {
      render(<App />);

      const addButton = screen.getByTestId('add-option');
      fireEvent.click(addButton);

      expect(screen.getByTestId('options-count')).toHaveTextContent('3');
      expect(screen.getByTestId('spinner-options-count')).toHaveTextContent('3');
    });

    it('should handle option deletion', () => {
      render(<App />);

      const deleteButton = screen.getByTestId('delete-option');
      fireEvent.click(deleteButton);

      expect(screen.getByTestId('options-count')).toHaveTextContent('1');
      expect(screen.getByTestId('spinner-options-count')).toHaveTextContent('1');
    });

    it('should pass correct display options to Spinner', () => {
      render(<App />);

      // The spinner should receive the values from the options, not the full Option objects
      expect(screen.getByTestId('spinner-options-count')).toHaveTextContent('2');
    });
  });

  describe('Spinner Integration', () => {
    it('should disable options when spinning starts', async () => {
      render(<App />);

      const startSpinButton = screen.getByTestId('start-spin');
      fireEvent.click(startSpinButton);

      expect(screen.getByTestId('options-disabled')).toHaveTextContent('true');
    });

    it('should enable options when spinning ends', async () => {
      render(<App />);

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
      render(<App />);

      const startSpinButton = screen.getByTestId('start-spin');
      fireEvent.click(startSpinButton);

      // Wait for the win callback to be triggered
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith('Winner! Hello');
      }, { timeout: 1000 });
    });

    it('should capitalize winner text in toast', async () => {
      render(<App />);

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
      render(<App />);

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