import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Options from '../../../../../src/Areas/Main/Options/components/Options';

describe('Options', () => {
  const mockOnShuffle = vi.fn();
  const mockOnDuplicate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    onShuffle: mockOnShuffle,
    onDuplicate: mockOnDuplicate
  };

  it('should render shuffle and duplicate buttons', () => {
    render(<Options {...defaultProps} />);
    
    expect(screen.getByText('Shuffle')).toBeInTheDocument();
    expect(screen.getByText('Duplicate')).toBeInTheDocument();
  });

  it('should call onShuffle when shuffle button is clicked', () => {
    render(<Options {...defaultProps} />);
    
    const shuffleButton = screen.getByText('Shuffle');
    fireEvent.click(shuffleButton);
    
    expect(mockOnShuffle).toHaveBeenCalledTimes(1);
  });

  it('should call onDuplicate when duplicate button is clicked', () => {
    render(<Options {...defaultProps} />);
    
    const duplicateButton = screen.getByText('Duplicate');
    fireEvent.click(duplicateButton);
    
    expect(mockOnDuplicate).toHaveBeenCalledTimes(1);
  });

  it('should disable buttons when disabled prop is true', () => {
    render(<Options {...defaultProps} disabled={true} />);
    
    const shuffleButton = screen.getByText('Shuffle');
    const duplicateButton = screen.getByText('Duplicate');
    
    expect(shuffleButton).toBeDisabled();
    expect(duplicateButton).toBeDisabled();
  });

  it('should not disable buttons when disabled prop is false', () => {
    render(<Options {...defaultProps} disabled={false} />);
    
    const shuffleButton = screen.getByText('Shuffle');
    const duplicateButton = screen.getByText('Duplicate');
    
    expect(shuffleButton).not.toBeDisabled();
    expect(duplicateButton).not.toBeDisabled();
  });

  it('should not disable buttons when disabled prop is undefined', () => {
    render(<Options {...defaultProps} />);
    
    const shuffleButton = screen.getByText('Shuffle');
    const duplicateButton = screen.getByText('Duplicate');
    
    expect(shuffleButton).not.toBeDisabled();
    expect(duplicateButton).not.toBeDisabled();
  });

  it('should prevent default on shuffle button click', () => {
    render(<Options {...defaultProps} />);
    
    const shuffleButton = screen.getByText('Shuffle');
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
    
    fireEvent(shuffleButton, clickEvent);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should prevent default on duplicate button click', () => {
    render(<Options {...defaultProps} />);
    
    const duplicateButton = screen.getByText('Duplicate');
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
    
    fireEvent(duplicateButton, clickEvent);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should not call callbacks when buttons are disabled', () => {
    render(<Options {...defaultProps} disabled={true} />);
    
    const shuffleButton = screen.getByText('Shuffle');
    const duplicateButton = screen.getByText('Duplicate');
    
    fireEvent.click(shuffleButton);
    fireEvent.click(duplicateButton);
    
    expect(mockOnShuffle).not.toHaveBeenCalled();
    expect(mockOnDuplicate).not.toHaveBeenCalled();
  });
});