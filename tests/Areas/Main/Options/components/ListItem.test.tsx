import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ListItem from '../../../../../src/Areas/Main/Options/components/ListItem';
import { Option } from '../../../../../src/Areas/Main/Options/models';

describe('ListItem', () => {
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const testOption: Option = {
    key: 'test-key',
    value: 'Test Option',
    sequence: 1
  };

  const defaultProps = {
    option: testOption,
    disabled: false,
    onDelete: mockOnDelete
  };

  it('should render option value and delete button', () => {
    render(<ListItem {...defaultProps} />);
    
    expect(screen.getByText('Test Option')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should call onDelete with option key when delete button is clicked', () => {
    render(<ListItem {...defaultProps} />);
    
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith('test-key');
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('should disable delete button when disabled prop is true', () => {
    render(<ListItem {...defaultProps} disabled={true} />);
    
    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toBeDisabled();
  });

  it('should not call onDelete when disabled button is clicked', () => {
    render(<ListItem {...defaultProps} disabled={true} />);
    
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('should prevent default on delete button click', () => {
    render(<ListItem {...defaultProps} />);
    
    const deleteButton = screen.getByText('Delete');
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
    
    fireEvent(deleteButton, clickEvent);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should render with correct CSS classes', () => {
    render(<ListItem {...defaultProps} />);
    
    const optionContainer = screen.getByText('Test Option').closest('.c-option');
    const label = screen.getByText('Test Option');
    const button = screen.getByText('Delete');
    
    expect(optionContainer).toHaveClass('c-option');
    expect(label).toHaveClass('c-option__label');
    expect(button).toHaveClass('c-option__controls');
  });

  it('should handle different option values', () => {
    const specialOption: Option = {
      key: 'special-key',
      value: 'Special Characters: !@#$%^&*()',
      sequence: 2
    };

    render(<ListItem {...defaultProps} option={specialOption} />);
    
    expect(screen.getByText('Special Characters: !@#$%^&*()')).toBeInTheDocument();
  });

  it('should handle empty option value', () => {
    const emptyOption: Option = {
      key: 'empty-key',
      value: '',
      sequence: 3
    };

    render(<ListItem {...defaultProps} option={emptyOption} />);
    
    const label = document.querySelector('.c-option__label');
    expect(label).toHaveTextContent('');
  });
});