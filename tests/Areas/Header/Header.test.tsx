import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from '../../../src/Areas/Header/Header';

describe('Header', () => {
  it('should render header text', () => {
    render(<Header />);
    
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    const { container } = render(<Header />);
    
    expect(container).toBeInTheDocument();
  });
});