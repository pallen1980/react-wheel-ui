import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ControlComponent from '../../../../../src/Areas/Main/Spinner/components/ControlComponent';

describe('ControlComponent', () => {
  const mockOnDirectionChange = vi.fn();
  const mockOnStartSpin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    disabled: false,
    onDirectionChange: mockOnDirectionChange,
    onStartSpin: mockOnStartSpin
  };

  it('should render direction and spin buttons', () => {
    render(<ControlComponent {...defaultProps} />);
    
    expect(screen.getByText('Clockwise')).toBeInTheDocument();
    expect(screen.getByText('Spin!')).toBeInTheDocument();
  });

  it('should toggle direction text when direction button is clicked', () => {
    render(<ControlComponent {...defaultProps} />);
    
    const directionButton = screen.getByText('Clockwise');
    expect(directionButton).toBeInTheDocument();
    
    fireEvent.click(directionButton);
    
    expect(screen.getByText('Anti-Clockwise')).toBeInTheDocument();
    expect(screen.queryByText('Clockwise')).not.toBeInTheDocument();
  });

  it('should call onDirectionChange when direction button is clicked', () => {
    render(<ControlComponent {...defaultProps} />);
    
    const directionButton = screen.getByText('Clockwise');
    fireEvent.click(directionButton);
    
    expect(mockOnDirectionChange).toHaveBeenCalledTimes(1);
  });

  it('should call onStartSpin when spin button is clicked', () => {
    render(<ControlComponent {...defaultProps} />);
    
    const spinButton = screen.getByText('Spin!');
    fireEvent.click(spinButton);
    
    expect(mockOnStartSpin).toHaveBeenCalledTimes(1);
  });

  it('should disable buttons when disabled prop is true', () => {
    render(<ControlComponent {...defaultProps} disabled={true} />);
    
    const directionButton = screen.getByText('Clockwise');
    const spinButton = screen.getByText('Spin!');
    
    expect(directionButton).toBeDisabled();
    expect(spinButton).toBeDisabled();
  });

  it('should not call callbacks when buttons are disabled', () => {
    render(<ControlComponent {...defaultProps} disabled={true} />);
    
    const directionButton = screen.getByText('Clockwise');
    const spinButton = screen.getByText('Spin!');
    
    fireEvent.click(directionButton);
    fireEvent.click(spinButton);
    
    expect(mockOnDirectionChange).not.toHaveBeenCalled();
    expect(mockOnStartSpin).not.toHaveBeenCalled();
  });

  it('should prevent default on button clicks', () => {
    render(<ControlComponent {...defaultProps} />);
    
    const directionButton = screen.getByText('Clockwise');
    const spinButton = screen.getByText('Spin!');
    
    const directionEvent = new MouseEvent('click', { bubbles: true });
    const spinEvent = new MouseEvent('click', { bubbles: true });
    
    const preventDefaultSpy1 = vi.spyOn(directionEvent, 'preventDefault');
    const preventDefaultSpy2 = vi.spyOn(spinEvent, 'preventDefault');
    
    fireEvent(directionButton, directionEvent);
    fireEvent(spinButton, spinEvent);
    
    expect(preventDefaultSpy1).toHaveBeenCalled();
    expect(preventDefaultSpy2).toHaveBeenCalled();
  });

  it('should toggle direction multiple times correctly', () => {
    render(<ControlComponent {...defaultProps} />);
    
    const directionButton = screen.getByText('Clockwise');
    
    // Click once - should show Anti-Clockwise
    fireEvent.click(directionButton);
    expect(screen.getByText('Anti-Clockwise')).toBeInTheDocument();
    
    // Click again - should show Clockwise
    const antiClockwiseButton = screen.getByText('Anti-Clockwise');
    fireEvent.click(antiClockwiseButton);
    expect(screen.getByText('Clockwise')).toBeInTheDocument();
    
    expect(mockOnDirectionChange).toHaveBeenCalledTimes(2);
  });
});