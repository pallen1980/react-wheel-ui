import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Profile from '../../../src/Areas/Profile/Profile';

describe('Profile', () => {
  it('should render profile text', () => {
    render(<Profile />);
    
    expect(screen.getByText('Your Profile')).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    const { container } = render(<Profile />);
    
    expect(container).toBeInTheDocument();
  });
});