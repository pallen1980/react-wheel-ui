import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TitleComponent from '../../../../../src/Areas/Main/Title/components/TitleComponent';

describe('TitleComponent', () => {
  it('should render the greeting text', () => {
    const greeting = 'Welcome to the Wheel!';
    render(<TitleComponent greeting={greeting} />);
    
    expect(screen.getByText(greeting)).toBeInTheDocument();
  });

  it('should render greeting in h1 element with correct class', () => {
    const greeting = 'Test Greeting';
    render(<TitleComponent greeting={greeting} />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('title_header');
    expect(heading).toHaveTextContent(greeting);
  });

  it('should handle empty greeting', () => {
    render(<TitleComponent greeting="" />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('');
  });

  it('should handle special characters in greeting', () => {
    const greeting = 'Hello & Welcome! 🎉';
    render(<TitleComponent greeting={greeting} />);
    
    expect(screen.getByText(greeting)).toBeInTheDocument();
  });
});