import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi } from 'vitest';
import Nav from '../../../src/Areas/Nav/Nav';

// Mock the Auth component since it's complex and has external dependencies
vi.mock('../../../src/Auth/Firebase/Auth', () => ({
  default: ({ type }: { type: number }) => <div data-testid="auth-component">Auth Component ({type === 0 ? 'popup' : 'redirect'})</div>
}));

vi.mock('../../../src/Auth/Firebase/types', () => ({
  AuthType: {
    Popup: 0,
    Redirect: 1
  }
}));

describe('Nav', () => {
  const renderWithRouter = (initialEntries = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Nav />
      </MemoryRouter>
    );
  };

  it('should render all navigation links', () => {
    renderWithRouter();
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Spinner')).toBeInTheDocument();
    expect(screen.getByTestId('auth-component')).toBeInTheDocument();
  });

  it('should render Home link with correct attributes', () => {
    renderWithRouter();
    
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
    expect(homeLink).toHaveClass('nav-item', 'logo');
  });

  it('should render Spinner link with correct attributes', () => {
    renderWithRouter();
    
    const spinnerLink = screen.getByText('Spinner').closest('a');
    expect(spinnerLink).toHaveAttribute('href', '/Spinner');
    expect(spinnerLink).toHaveClass('nav-item');
  });

  it('should render Profile link with Auth component', () => {
    renderWithRouter();
    
    const profileLink = screen.getByTestId('auth-component').closest('a');
    expect(profileLink).toHaveAttribute('href', '/Profile');
    expect(profileLink).toHaveClass('nav-item', 'profile');
  });

  it('should have correct nav structure', () => {
    renderWithRouter();
    
    // Check that nav-main div exists and contains Spinner link
    const navMain = document.querySelector('.nav-main');
    expect(navMain).toBeInTheDocument();
    expect(navMain).toContainElement(screen.getByText('Spinner'));
  });

  it('should pass correct AuthType to Auth component', () => {
    renderWithRouter();
    
    expect(screen.getByText('Auth Component (popup)')).toBeInTheDocument();
  });
});