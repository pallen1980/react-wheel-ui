import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Entry from '../../../../../src/Areas/Main/Options/components/Entry';
import { Option } from '../../../../../src/Areas/Main/Options/models';

describe('Entry', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    disabled: false,
    onSubmit: mockOnSubmit
  };

  it('should render input and button', () => {
    render(<Entry {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Enter some text...')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('should handle text input', () => {
    render(<Entry {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter some text...');
    fireEvent.change(input, { target: { value: 'Test option' } });
    
    expect(input).toHaveValue('Test option');
  });

  it('should submit option when form is submitted', () => {
    render(<Entry {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter some text...');
    const form = input.closest('form');
    
    fireEvent.change(input, { target: { value: 'Test option' } });
    fireEvent.submit(form!);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      key: '',
      value: 'Test option',
      sequence: 0
    });
  });

  it('should submit option when button is clicked', () => {
    render(<Entry {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter some text...');
    const button = screen.getByText('Add');
    
    fireEvent.change(input, { target: { value: 'Test option' } });
    fireEvent.click(button);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      key: '',
      value: 'Test option',
      sequence: 0
    });
  });

  it('should clear input after submission', () => {
    render(<Entry {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter some text...');
    const button = screen.getByText('Add');
    
    fireEvent.change(input, { target: { value: 'Test option' } });
    fireEvent.click(button);
    
    expect(input).toHaveValue('');
  });

  it('should disable submit button when input is empty', () => {
    render(<Entry {...defaultProps} />);
    
    const button = screen.getByText('Add');
    expect(button).toBeDisabled();
  });

  it('should enable submit button when input has text', () => {
    render(<Entry {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter some text...');
    const button = screen.getByText('Add');
    
    fireEvent.change(input, { target: { value: 'Test' } });
    expect(button).not.toBeDisabled();
  });

  it('should disable input and button when disabled prop is true', () => {
    render(<Entry {...defaultProps} disabled={true} />);
    
    const input = screen.getByPlaceholderText('Enter some text...');
    const button = screen.getByText('Add');
    
    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('should handle initial option for editing', () => {
    const initialOption: Option = {
      key: 'test-key',
      value: 'Initial value',
      sequence: 1
    };
    
    render(<Entry {...defaultProps} initialOption={initialOption} />);
    
    const input = screen.getByPlaceholderText('Enter some text...');
    expect(input).toHaveValue('Initial value');
  });

  it('should submit with initial option key when editing', () => {
    const initialOption: Option = {
      key: 'test-key',
      value: 'Initial value',
      sequence: 1
    };
    
    render(<Entry {...defaultProps} initialOption={initialOption} />);
    
    const input = screen.getByPlaceholderText('Enter some text...');
    const button = screen.getByText('Add');
    
    fireEvent.change(input, { target: { value: 'Updated value' } });
    fireEvent.click(button);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      key: 'test-key',
      value: 'Updated value',
      sequence: 1
    });
  });

  it('should disable submit button for whitespace-only input', () => {
    render(<Entry {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter some text...');
    const button = screen.getByText('Add');
    
    fireEvent.change(input, { target: { value: '   ' } });
    expect(button).toBeDisabled();
  });
});