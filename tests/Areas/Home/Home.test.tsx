import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from '../../../src/Areas/Home/Home';

// Mock the useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../../../src/Auth/AuthProvider', () => ({
  useAuth: () => mockUseAuth()
}));

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render homepage text', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn()
    });

    render(<Home />);
    
    expect(screen.getByText('Homepage')).toBeInTheDocument();
  });

  it('should show welcome message when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { uid: 'test-user', email: 'test@example.com' },
      login: vi.fn(),
      logout: vi.fn()
    });

    render(<Home />);
    
    expect(screen.getByText('Homepage')).toBeInTheDocument();
    expect(screen.getByText('Welcome! You are logged in!')).toBeInTheDocument();
  });

  it('should not show welcome message when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn()
    });

    render(<Home />);
    
    expect(screen.getByText('Homepage')).toBeInTheDocument();
    expect(screen.queryByText('Welcome! You are logged in!')).not.toBeInTheDocument();
  });

  it('should render without crashing', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn()
    });

    const { container } = render(<Home />);
    
    expect(container).toBeInTheDocument();
  });
});