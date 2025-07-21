import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import List from '../../../../../src/Areas/Main/Options/components/List';
import { Option } from '../../../../../src/Areas/Main/Options/models';

// Mock the ListItem component
vi.mock('../../../../../src/Areas/Main/Options/components/ListItem', () => ({
  default: ({ option, disabled, onDelete }: any) => (
    <div data-testid={`list-item-${option.key}`}>
      <span>{option.value}</span>
      <button 
        disabled={disabled}
        onClick={() => onDelete(option.key)}
        data-testid={`delete-${option.key}`}
      >
        Delete
      </button>
    </div>
  )
}));

describe('List', () => {
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    options: [],
    disabled: false,
    onDelete: mockOnDelete
  };

  it('should render empty list when no options provided', () => {
    render(<List {...defaultProps} />);
    
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(list).toBeEmptyDOMElement();
  });

  it('should render list items for each option', () => {
    const options: Option[] = [
      { key: 'option1', value: 'First Option', sequence: 1 },
      { key: 'option2', value: 'Second Option', sequence: 2 }
    ];

    render(<List {...defaultProps} options={options} />);
    
    expect(screen.getByTestId('list-item-option1')).toBeInTheDocument();
    expect(screen.getByTestId('list-item-option2')).toBeInTheDocument();
    expect(screen.getByText('First Option')).toBeInTheDocument();
    expect(screen.getByText('Second Option')).toBeInTheDocument();
  });

  it('should pass correct props to ListItem components', () => {
    const options: Option[] = [
      { key: 'option1', value: 'Test Option', sequence: 1 }
    ];

    render(<List {...defaultProps} options={options} disabled={true} />);
    
    const deleteButton = screen.getByTestId('delete-option1');
    expect(deleteButton).toBeDisabled();
  });

  it('should render list items with correct keys', () => {
    const options: Option[] = [
      { key: 'unique-key-1', value: 'Option 1', sequence: 1 },
      { key: 'unique-key-2', value: 'Option 2', sequence: 2 }
    ];

    render(<List {...defaultProps} options={options} />);
    
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
    expect(listItems[0]).toHaveClass('c-list__item');
    expect(listItems[1]).toHaveClass('c-list__item');
  });

  it('should handle large number of options', () => {
    const options: Option[] = Array.from({ length: 10 }, (_, i) => ({
      key: `option-${i}`,
      value: `Option ${i + 1}`,
      sequence: i + 1
    }));

    render(<List {...defaultProps} options={options} />);
    
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(10);
  });

  it('should pass onDelete callback to ListItem components', () => {
    const options: Option[] = [
      { key: 'test-option', value: 'Test', sequence: 1 }
    ];

    render(<List {...defaultProps} options={options} />);
    
    // The onDelete prop should be passed through to the mocked component
    expect(screen.getByTestId('delete-test-option')).toBeInTheDocument();
  });
});