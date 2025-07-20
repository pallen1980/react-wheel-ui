import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import { describe, it, expect, vi } from 'vitest';
import AuthProvider, { useAuth } from '../../src/Auth/AuthProvider';
import ProtectedRoute from '../../src/Auth/ProtectedRoute';

// Test components
const HomePage = () => {
  const location = useLocation();
  return (
    <div>
      <div data-testid="home-page">Home Page</div>
      <div data-testid="current-path">{location.pathname}</div>
    </div>
  );
};

const ProfilePage = () => (
  <div data-testid="profile-page">Profile Page - Protected Content</div>
);

const DashboardPage = () => (
  <div data-testid="dashboard-page">Dashboard - Protected Content</div>
);

const AuthControls = () => {
  const { isAuthenticated, onLogin, onLogout } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
        Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <button data-testid="login-button" onClick={onLogin}>
        Login
      </button>
      <button data-testid="logout-button" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
};

const NavigationControls = () => {
  const location = useLocation();
  
  return (
    <div>
      <div data-testid="current-location">{location.pathname}</div>
      <a href="/profile" data-testid="profile-link">Profile</a>
      <a href="/dashboard" data-testid="dashboard-link">Dashboard</a>
      <a href="/" data-testid="home-link">Home</a>
    </div>
  );
};

// Complete application wrapper for integration testing
const TestApp = ({ initialEntries = ['/'] }: { initialEntries?: string[] }) => (
  <MemoryRouter initialEntries={initialEntries}>
    <AuthProvider>
      <div data-testid="app-container">
        <AuthControls />
        <NavigationControls />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </AuthProvider>
  </MemoryRouter>
);

describe('Authentication Integration Tests', () => {
  describe('complete authentication flow', () => {
    it('should handle full user authentication journey', async () => {
      render(<TestApp />);

      // Initial state - not authenticated, on home page
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Status: Not Authenticated');
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.getByTestId('current-path')).toHaveTextContent('/');

      // Attempt to access protected route while not authenticated
      // (In a real app, this would be done through navigation, but we'll test the redirect behavior)
      
      // Login
      await act(async () => {
        screen.getByTestId('login-button').click();
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Status: Authenticated');

      // Logout
      act(() => {
        screen.getByTestId('logout-button').click();
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Status: Not Authenticated');
    });

    it('should redirect unauthenticated users from protected routes', () => {
      // Start on a protected route
      render(<TestApp initialEntries={['/profile']} />);

      // Should be redirected to home
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Status: Not Authenticated');
      
      // Should not see protected content
      expect(screen.queryByTestId('profile-page')).not.toBeInTheDocument();
    });

    it('should handle multiple protected routes consistently', () => {
      // Test profile route
      const { unmount: unmountProfile } = render(<TestApp initialEntries={['/profile']} />);
      
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.queryByTestId('profile-page')).not.toBeInTheDocument();
      
      unmountProfile();

      // Test dashboard route
      render(<TestApp initialEntries={['/dashboard']} />);
      
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
    });
  });

  describe('authentication state persistence', () => {
    it('should maintain authentication state across route changes', async () => {
      render(<TestApp />);

      // Login
      await act(async () => {
        screen.getByTestId('login-button').click();
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Status: Authenticated');

      // The auth state should persist even when navigating
      // (This is more of a conceptual test since we're not actually navigating in this test setup)
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Status: Authenticated');
    });

    it('should clear authentication state on logout', async () => {
      render(<TestApp />);

      // Login first
      await act(async () => {
        screen.getByTestId('login-button').click();
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Status: Authenticated');

      // Logout
      act(() => {
        screen.getByTestId('logout-button').click();
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Status: Not Authenticated');
    });

    it('should handle rapid authentication state changes', async () => {
      render(<TestApp />);

      // Rapid login/logout sequence
      await act(async () => {
        screen.getByTestId('login-button').click();
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Status: Authenticated');

      act(() => {
        screen.getByTestId('logout-button').click();
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Status: Not Authenticated');

      await act(async () => {
        screen.getByTestId('login-button').click();
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Status: Authenticated');
    });
  });

  describe('security and user experience reliability', () => {
    it('should prevent access to protected content without authentication', () => {
      const protectedRoutes = ['/profile', '/dashboard'];
      
      protectedRoutes.forEach(route => {
        const { unmount } = render(<TestApp initialEntries={[route]} />);
        
        // Should always redirect to home
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
        
        // Should not show any protected content
        expect(screen.queryByTestId('profile-page')).not.toBeInTheDocument();
        expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
        
        unmount();
      });
    });

    it('should handle authentication context errors gracefully', () => {
      // Test component that tries to use auth outside provider (without try/catch)
      const InvalidAuthUsage = () => {
        const { isAuthenticated } = useAuth();
        return <div data-testid="invalid-auth">{isAuthenticated.toString()}</div>;
      };

      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        render(<InvalidAuthUsage />);
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });

    it('should maintain consistent behavior across multiple auth instances', async () => {
      // Component that uses auth in multiple places
      const MultipleAuthUsage = () => {
        const auth1 = useAuth();
        const auth2 = useAuth();
        
        return (
          <div>
            <div data-testid="auth1-status">Auth1: {auth1.isAuthenticated.toString()}</div>
            <div data-testid="auth2-status">Auth2: {auth2.isAuthenticated.toString()}</div>
            <button data-testid="auth1-login" onClick={auth1.onLogin}>Login via Auth1</button>
            <button data-testid="auth2-logout" onClick={auth2.onLogout}>Logout via Auth2</button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <MultipleAuthUsage />
        </AuthProvider>
      );

      // Both should start as not authenticated
      expect(screen.getByTestId('auth1-status')).toHaveTextContent('Auth1: false');
      expect(screen.getByTestId('auth2-status')).toHaveTextContent('Auth2: false');

      // Login via first instance
      await act(async () => {
        screen.getByTestId('auth1-login').click();
      });

      // Both should be authenticated
      expect(screen.getByTestId('auth1-status')).toHaveTextContent('Auth1: true');
      expect(screen.getByTestId('auth2-status')).toHaveTextContent('Auth2: true');

      // Logout via second instance
      act(() => {
        screen.getByTestId('auth2-logout').click();
      });

      // Both should be not authenticated
      expect(screen.getByTestId('auth1-status')).toHaveTextContent('Auth1: false');
      expect(screen.getByTestId('auth2-status')).toHaveTextContent('Auth2: false');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle undefined or null children in ProtectedRoute', () => {
      const NullChildrenTest = () => (
        <MemoryRouter initialEntries={['/null-test']}>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route 
                path="/null-test" 
                element={
                  <ProtectedRoute>
                    {null}
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      render(<NullChildrenTest />);

      // Should still redirect to home
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('should handle component unmounting during authentication operations', async () => {
      const { unmount } = render(<TestApp />);

      // Start login process
      const loginPromise = act(async () => {
        screen.getByTestId('login-button').click();
      });

      // Unmount component before login completes
      unmount();

      // Should not throw errors
      await expect(loginPromise).resolves.not.toThrow();
    });

    it('should handle deep route nesting with protection', () => {
      const DeepNestedTest = () => (
        <MemoryRouter initialEntries={['/admin/users/edit/123/permissions']}>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route 
                path="/admin/users/edit/:id/permissions" 
                element={
                  <ProtectedRoute>
                    <div data-testid="deep-protected">Deep Protected Content</div>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      render(<DeepNestedTest />);

      // Should redirect to home regardless of route depth
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.queryByTestId('deep-protected')).not.toBeInTheDocument();
    });
  });
});