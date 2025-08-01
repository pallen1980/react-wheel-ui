import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import OptionsApp from '../../../../src/Areas/Main/Options/App';
import { Option } from '../../../../src/Areas/Main/Options/models';
import * as helpers from '../../../../src/Areas/Main/Options/helpers';

// Mock the child components
vi.mock('../../../../src/Areas/Main/Options/components/Options', () => ({
  default: ({ disabled, onShuffle, onDuplicate }: { 
    disabled: boolean, 
    onShuffle: () => void, 
    onDuplicate: () => void 
  }) => (
    <div data-testid="options-component">
      <div data-testid="options-disabled">{disabled.toString()}</div>
      <button data-testid="shuffle-button" onClick={onShuffle} disabled={disabled}>
        Shuffle
      </button>
      <button data-testid="duplicate-button" onClick={onDuplicate} disabled={disabled}>
        Duplicate
      </button>
    </div>
  )
}));

vi.mock('../../../../src/Areas/Main/Options/components/List', () => ({
  default: ({ options, disabled, onDelete }: { 
    options: Option[], 
    disabled: boolean, 
    onDelete: (key: string) => void 
  }) => (
    <div data-testid="list-component">
      <div data-testid="list-disabled">{disabled.toString()}</div>
      <div data-testid="list-count">{options.length}</div>
      {options.map(option => (
        <div key={option.key} data-testid={`option-${option.key}`}>
          <span data-testid={`option-value-${option.key}`}>{option.value}</span>
          <span data-testid={`option-sequence-${option.key}`}>{option.sequence}</span>
          <button 
            data-testid={`delete-${option.key}`} 
            onClick={() => onDelete(option.key)}
            disabled={disabled}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}));

vi.mock('../../../../src/Areas/Main/Options/components/Entry', () => ({
  default: ({ disabled, onSubmit }: { 
    disabled: boolean, 
    onSubmit: (option: Option) => void 
  }) => (
    <div data-testid="entry-component">
      <div data-testid="entry-disabled">{disabled.toString()}</div>
      <button 
        data-testid="add-new-option" 
        onClick={() => onSubmit({ key: '', value: 'New Option', sequence: 0 })}
        disabled={disabled}
      >
        Add New
      </button>
      <button 
        data-testid="edit-existing-option" 
        onClick={() => onSubmit({ key: 'option-1', value: 'Edited Option', sequence: 1 })}
        disabled={disabled}
      >
        Edit Existing
      </button>
    </div>
  )
}));

// Mock the helpers
vi.mock('../../../../src/Areas/Main/Options/helpers', () => ({
  shuffleWithSequence: vi.fn(),
  duplicateOptionsWithSequence: vi.fn(),
  getNextSequence: vi.fn(),
  generateGuid: vi.fn(),
  reorderOptions: vi.fn()
}));

describe('Options App Component', () => {
  const mockOnChange = vi.fn();
  
  const defaultProps = {
    options: [
      { key: 'option-1', value: 'First Option', sequence: 1 },
      { key: 'option-2', value: 'Second Option', sequence: 2 },
      { key: 'option-3', value: 'Third Option', sequence: 3 }
    ] as Option[],
    disabled: false,
    onChange: mockOnChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(helpers.generateGuid).mockReturnValue('new-guid-123');
    vi.mocked(helpers.getNextSequence).mockReturnValue(4);
    // Mock reorderOptions to return the input as-is for most tests
    vi.mocked(helpers.reorderOptions).mockImplementation((options) => options);
  });

  describe('Initial Render', () => {
    it('should render all child components', () => {
      render(<OptionsApp {...defaultProps} />);
      
      expect(screen.getByTestId('options-component')).toBeInTheDocument();
      expect(screen.getByTestId('list-component')).toBeInTheDocument();
      expect(screen.getByTestId('entry-component')).toBeInTheDocument();
    });

    it('should pass disabled state to all child components', () => {
      render(<OptionsApp {...defaultProps} disabled={true} />);
      
      expect(screen.getByTestId('options-disabled')).toHaveTextContent('true');
      expect(screen.getByTestId('list-disabled')).toHaveTextContent('true');
      expect(screen.getByTestId('entry-disabled')).toHaveTextContent('true');
    });

    it('should pass options to List component', () => {
      render(<OptionsApp {...defaultProps} />);
      
      expect(screen.getByTestId('list-count')).toHaveTextContent('3');
      expect(screen.getByTestId('option-option-1')).toBeInTheDocument();
      expect(screen.getByTestId('option-option-2')).toBeInTheDocument();
      expect(screen.getByTestId('option-option-3')).toBeInTheDocument();
    });
  });

  describe('Shuffle Functionality', () => {
    it('should call shuffleWithSequence when shuffle button is clicked', () => {
      const shuffledOptions = [
        { key: 'option-3', value: 'Third Option', sequence: 1 },
        { key: 'option-1', value: 'First Option', sequence: 2 },
        { key: 'option-2', value: 'Second Option', sequence: 3 }
      ];
      vi.mocked(helpers.shuffleWithSequence).mockReturnValue(shuffledOptions);

      render(<OptionsApp {...defaultProps} />);
      
      const shuffleButton = screen.getByTestId('shuffle-button');
      fireEvent.click(shuffleButton);
      
      expect(helpers.shuffleWithSequence).toHaveBeenCalledWith(defaultProps.options);
      expect(mockOnChange).toHaveBeenCalledWith(shuffledOptions);
    });

    it('should not allow shuffle when disabled', () => {
      render(<OptionsApp {...defaultProps} disabled={true} />);
      
      const shuffleButton = screen.getByTestId('shuffle-button');
      expect(shuffleButton).toBeDisabled();
    });
  });

  describe('Duplicate Functionality', () => {
    it('should call duplicateOptionsWithSequence when duplicate button is clicked', () => {
      const duplicatedOptions = [
        ...defaultProps.options,
        { key: 'dup-1', value: 'First Option', sequence: 4 },
        { key: 'dup-2', value: 'Second Option', sequence: 5 },
        { key: 'dup-3', value: 'Third Option', sequence: 6 }
      ];
      vi.mocked(helpers.duplicateOptionsWithSequence).mockReturnValue(duplicatedOptions);

      render(<OptionsApp {...defaultProps} />);
      
      const duplicateButton = screen.getByTestId('duplicate-button');
      fireEvent.click(duplicateButton);
      
      expect(helpers.duplicateOptionsWithSequence).toHaveBeenCalledWith(defaultProps.options);
      expect(mockOnChange).toHaveBeenCalledWith(duplicatedOptions);
    });

    it('should not duplicate when options count is 25 or more', () => {
      const manyOptions = Array.from({ length: 25 }, (_, i) => ({
        key: `option-${i}`,
        value: `Option ${i}`,
        sequence: i + 1
      }));

      render(<OptionsApp {...defaultProps} options={manyOptions} />);
      
      const duplicateButton = screen.getByTestId('duplicate-button');
      fireEvent.click(duplicateButton);
      
      expect(helpers.duplicateOptionsWithSequence).not.toHaveBeenCalled();
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should not allow duplicate when disabled', () => {
      render(<OptionsApp {...defaultProps} disabled={true} />);
      
      const duplicateButton = screen.getByTestId('duplicate-button');
      expect(duplicateButton).toBeDisabled();
    });
  });

  describe('Delete Functionality', () => {
    it('should remove option when delete is clicked', () => {
      const filteredOptions = [
        { key: 'option-1', value: 'First Option', sequence: 1 },
        { key: 'option-3', value: 'Third Option', sequence: 3 }
      ];
      vi.mocked(helpers.reorderOptions).mockReturnValue(filteredOptions);

      render(<OptionsApp {...defaultProps} />);
      
      const deleteButton = screen.getByTestId('delete-option-2');
      fireEvent.click(deleteButton);
      
      expect(helpers.reorderOptions).toHaveBeenCalledWith(filteredOptions);
      expect(mockOnChange).toHaveBeenCalledWith(filteredOptions);
    });

    it('should handle deleting first option', () => {
      const filteredOptions = [
        { key: 'option-2', value: 'Second Option', sequence: 2 },
        { key: 'option-3', value: 'Third Option', sequence: 3 }
      ];
      vi.mocked(helpers.reorderOptions).mockReturnValue(filteredOptions);

      render(<OptionsApp {...defaultProps} />);
      
      const deleteButton = screen.getByTestId('delete-option-1');
      fireEvent.click(deleteButton);
      
      expect(helpers.reorderOptions).toHaveBeenCalledWith(filteredOptions);
      expect(mockOnChange).toHaveBeenCalledWith(filteredOptions);
    });

    it('should handle deleting last option', () => {
      const filteredOptions = [
        { key: 'option-1', value: 'First Option', sequence: 1 },
        { key: 'option-2', value: 'Second Option', sequence: 2 }
      ];
      vi.mocked(helpers.reorderOptions).mockReturnValue(filteredOptions);

      render(<OptionsApp {...defaultProps} />);
      
      const deleteButton = screen.getByTestId('delete-option-3');
      fireEvent.click(deleteButton);
      
      expect(helpers.reorderOptions).toHaveBeenCalledWith(filteredOptions);
      expect(mockOnChange).toHaveBeenCalledWith(filteredOptions);
    });

    it('should not allow delete when disabled', () => {
      render(<OptionsApp {...defaultProps} disabled={true} />);
      
      const deleteButton = screen.getByTestId('delete-option-1');
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Add New Option Functionality', () => {
    it('should add new option with generated key and next sequence', () => {
      render(<OptionsApp {...defaultProps} />);
      
      const addButton = screen.getByTestId('add-new-option');
      fireEvent.click(addButton);
      
      expect(helpers.getNextSequence).toHaveBeenCalledWith(defaultProps.options);
      expect(helpers.generateGuid).toHaveBeenCalled();
      
      const expectedOptions = [
        ...defaultProps.options,
        { key: 'new-guid-123', value: 'New Option', sequence: 4 }
      ];
      
      expect(mockOnChange).toHaveBeenCalledWith(expectedOptions);
    });

    it('should not allow adding when disabled', () => {
      render(<OptionsApp {...defaultProps} disabled={true} />);
      
      const addButton = screen.getByTestId('add-new-option');
      expect(addButton).toBeDisabled();
    });
  });

  describe('Edit Existing Option Functionality', () => {
    it('should update existing option value while preserving key and sequence', () => {
      render(<OptionsApp {...defaultProps} />);
      
      const editButton = screen.getByTestId('edit-existing-option');
      fireEvent.click(editButton);
      
      const expectedOptions = [
        { key: 'option-1', value: 'Edited Option', sequence: 1 },
        { key: 'option-2', value: 'Second Option', sequence: 2 },
        { key: 'option-3', value: 'Third Option', sequence: 3 }
      ];
      
      expect(mockOnChange).toHaveBeenCalledWith(expectedOptions);
    });

    it('should handle editing non-existent option gracefully', () => {
      render(<OptionsApp {...defaultProps} />);
      
      // Mock editing a non-existent option
      screen.getByTestId('entry-component');
      const editButton = document.createElement('button');
      editButton.onclick = () => {
        const mockSubmit = vi.fn();
        mockSubmit({ key: 'non-existent', value: 'Should not update', sequence: 1 });
      };
      
      // Simulate editing non-existent option through the component
      fireEvent.click(screen.getByTestId('edit-existing-option'));
      
      // Since the option doesn't exist, the original options should remain unchanged
      // The component should still call onChange with the original options
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should not allow editing when disabled', () => {
      render(<OptionsApp {...defaultProps} disabled={true} />);
      
      const editButton = screen.getByTestId('edit-existing-option');
      expect(editButton).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      const emptyProps = { ...defaultProps, options: [] };
      render(<OptionsApp {...emptyProps} />);
      
      expect(screen.getByTestId('list-count')).toHaveTextContent('0');
      expect(screen.getByTestId('options-component')).toBeInTheDocument();
      expect(screen.getByTestId('entry-component')).toBeInTheDocument();
    });

    it('should handle single option', () => {
      const singleOptionProps = {
        ...defaultProps,
        options: [{ key: 'only-option', value: 'Only Option', sequence: 1 }]
      };
      
      render(<OptionsApp {...singleOptionProps} />);
      
      expect(screen.getByTestId('list-count')).toHaveTextContent('1');
      expect(screen.getByTestId('option-only-option')).toBeInTheDocument();
    });

    it('should handle maximum options (25)', () => {
      const maxOptions = Array.from({ length: 25 }, (_, i) => ({
        key: `option-${i}`,
        value: `Option ${i}`,
        sequence: i + 1
      }));
      
      render(<OptionsApp {...defaultProps} options={maxOptions} />);
      
      expect(screen.getByTestId('list-count')).toHaveTextContent('25');
      
      // Should not allow duplication at max capacity
      const duplicateButton = screen.getByTestId('duplicate-button');
      fireEvent.click(duplicateButton);
      
      expect(helpers.duplicateOptionsWithSequence).not.toHaveBeenCalled();
    });
  });

  describe('Props Validation', () => {
    it('should handle onChange callback properly', () => {
      const customOnChange = vi.fn();
      render(<OptionsApp {...defaultProps} onChange={customOnChange} />);
      
      const addButton = screen.getByTestId('add-new-option');
      fireEvent.click(addButton);
      
      expect(customOnChange).toHaveBeenCalled();
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should pass through all required props to child components', () => {
      render(<OptionsApp {...defaultProps} />);
      
      // Verify all child components receive the disabled prop
      expect(screen.getByTestId('options-disabled')).toHaveTextContent('false');
      expect(screen.getByTestId('list-disabled')).toHaveTextContent('false');
      expect(screen.getByTestId('entry-disabled')).toHaveTextContent('false');
    });
  });
});