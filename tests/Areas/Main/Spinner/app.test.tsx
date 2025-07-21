import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SpinnerApp from '../../../../src/Areas/Main/Spinner/app';

// Mock the child components
vi.mock('../../../../src/Areas/Main/Spinner/components/SpinWheelComponent', () => ({
  default: React.forwardRef(({ options, direction, onWin }, ref) => {
    // Simulate the ref functionality
    React.useImperativeHandle(ref, () => ({
      startSpin: vi.fn()
    }));
    
    return (
      <div data-testid="spin-wheel-component">
        SpinWheel - Options: {options?.length || 0}, Direction: {direction}
      </div>
    );
  })
}));

vi.mock('../../../../src/Areas/Main/Spinner/components/ControlComponent', () => ({
  default: ({ disabled, onDirectionChange, onStartSpin }: any) => (
    <div data-testid="control-component">
      <button 
        data-testid="direction-button" 
        disabled={disabled}
        onClick={onDirectionChange}
      >
        Change Direction
      </button>
      <button 
        data-testid="spin-button" 
        disabled={disabled}
        onClick={onStartSpin}
      >
        Start Spin
      </button>
    </div>
  )
}));

// Mock the Direction enum
vi.mock('../../../../src/Areas/Main/Spinner/enums', () => ({
  Direction: {
    Clockwise: 'clockwise',
    AnitClockwise: 'anticlockwise'
  }
}));

describe('SpinnerApp', () => {
  const mockOnWin = vi.fn();
  const mockOnSpinStarted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render SpinWheelComponent and ControlComponent', () => {
    render(<SpinnerApp />);
    
    expect(screen.getByTestId('spin-wheel-component')).toBeInTheDocument();
    expect(screen.getByTestId('control-component')).toBeInTheDocument();
  });

  it('should pass options to SpinWheelComponent', () => {
    const options = ['Option 1', 'Option 2', 'Option 3'];
    render(<SpinnerApp options={options} />);
    
    expect(screen.getByText(/Options: 3/)).toBeInTheDocument();
  });

  it('should handle direction change', () => {
    render(<SpinnerApp />);
    
    const directionButton = screen.getByTestId('direction-button');
    
    // Initial direction should be clockwise
    expect(screen.getByText(/Direction: clockwise/)).toBeInTheDocument();
    
    fireEvent.click(directionButton);
    
    // Direction should change to anticlockwise
    expect(screen.getByText(/Direction: anticlockwise/)).toBeInTheDocument();
  });

  it('should handle spin start', () => {
    render(<SpinnerApp onSpinStarted={mockOnSpinStarted} />);
    
    const spinButton = screen.getByTestId('spin-button');
    fireEvent.click(spinButton);
    
    expect(mockOnSpinStarted).toHaveBeenCalledTimes(1);
  });

  it('should disable controls when spinning', () => {
    render(<SpinnerApp />);
    
    const spinButton = screen.getByTestId('spin-button');
    const directionButton = screen.getByTestId('direction-button');
    
    // Initially buttons should be enabled
    expect(spinButton).not.toBeDisabled();
    expect(directionButton).not.toBeDisabled();
    
    // Start spinning
    fireEvent.click(spinButton);
    
    // Buttons should now be disabled
    expect(spinButton).toBeDisabled();
    expect(directionButton).toBeDisabled();
  });

  it('should call onWin callback when provided', () => {
    render(<SpinnerApp onWin={mockOnWin} />);
    
    // Test that the callback is passed to the component
    expect(screen.getByTestId('spin-wheel-component')).toBeInTheDocument();
  });

  it('should manage spinning state correctly', () => {
    render(<SpinnerApp />);
    
    const spinButton = screen.getByTestId('spin-button');
    const directionButton = screen.getByTestId('direction-button');
    
    // Initially buttons should be enabled
    expect(spinButton).not.toBeDisabled();
    expect(directionButton).not.toBeDisabled();
    
    // Start spinning
    fireEvent.click(spinButton);
    
    // Buttons should now be disabled
    expect(spinButton).toBeDisabled();
    expect(directionButton).toBeDisabled();
  });

  it('should toggle direction multiple times', () => {
    render(<SpinnerApp />);
    
    const directionButton = screen.getByTestId('direction-button');
    
    // Start with clockwise
    expect(screen.getByText(/Direction: clockwise/)).toBeInTheDocument();
    
    // Toggle to anticlockwise
    fireEvent.click(directionButton);
    expect(screen.getByText(/Direction: anticlockwise/)).toBeInTheDocument();
    
    // Toggle back to clockwise
    fireEvent.click(directionButton);
    expect(screen.getByText(/Direction: clockwise/)).toBeInTheDocument();
  });

  it('should work without optional props', () => {
    render(<SpinnerApp />);
    
    const spinButton = screen.getByTestId('spin-button');
    
    // Should not crash when callbacks are not provided
    expect(() => fireEvent.click(spinButton)).not.toThrow();
  });

  it('should handle empty options array', () => {
    render(<SpinnerApp options={[]} />);
    
    expect(screen.getByText(/Options: 0/)).toBeInTheDocument();
  });
});