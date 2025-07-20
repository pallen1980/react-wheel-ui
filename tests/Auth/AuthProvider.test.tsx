import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthProvider, { useAuth } from '../../src/Auth/AuthProvider';

// Test component to access the auth context
const TestComponent = () => {
  const { isAuthenticated, onLogin, onLogout } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <button data-testid="login-btn" onClick={onLogin}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
};

describe('AuthProvider', () => {
  describe('context functionality and state management', () => {
    it('should provide initial unauthenticated state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    it('should provide authentication context to child components', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Verify all context methods are available
      expect(screen.getByTestId('login-btn')).toBeInTheDocument();
      expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
      expect(screen.getByTestId('auth-status')).toBeInTheDocument();
    });

    it('should maintain consistent state across multiple child components', () => {
      const SecondTestComponent = () => {
        const { isAuthenticated } = useAuth();
        return (
          <div data-testid="second-auth-status">
            {isAuthenticated ? 'authenticated' : 'not-authenticated'}
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
          <SecondTestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('second-auth-status')).toHaveTextContent('not-authenticated');
    });
  });

  describe('login functionality', () => {
    it('should update authentication state when login is called', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');

      await act(async () => {
        screen.getByTestId('login-btn').click();
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    it('should handle multiple login calls gracefully', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // First login
      await act(async () => {
        screen.getByTestId('login-btn').click();
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');

      // Second login (should remain authenticated)
      await act(async () => {
        screen.getByTestId('login-btn').click();
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    it('should be async and handle promise resolution', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const AsyncTestComponent = () => {
        const { onLogin } = useAuth();
        
        const handleAsyncLogin = async () => {
          await onLogin();
          console.log('Login completed');
        };
        
        return (
          <button data-testid="async-login-btn" onClick={handleAsyncLogin}>
            Async Login
          </button>
        );
      };

      render(
        <AuthProvider>
          <AsyncTestComponent />
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByTestId('async-login-btn').click();
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      
      consoleSpy.mockRestore();
    });
  });

  describe('logout functionality', () => {
    it('should update authentication state when logout is called', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // First login
      await act(async () => {
        screen.getByTestId('login-btn').click();
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');

      // Then logout
      act(() => {
        screen.getByTestId('logout-btn').click();
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    it('should handle logout when already logged out', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');

      // Logout when already logged out
      act(() => {
        screen.getByTestId('logout-btn').click();
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    it('should handle multiple logout calls gracefully', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Login first
      await act(async () => {
        screen.getByTestId('login-btn').click();
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');

      // First logout
      act(() => {
        screen.getByTestId('logout-btn').click();
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');

      // Second logout
      act(() => {
        screen.getByTestId('logout-btn').click();
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
  });

  describe('state transitions', () => {
    it('should handle complete login/logout cycle', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initial state
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');

      // Login
      await act(async () => {
        screen.getByTestId('login-btn').click();
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');

      // Logout
      act(() => {
        screen.getByTestId('logout-btn').click();
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');

      // Login again
      await act(async () => {
        screen.getByTestId('login-btn').click();
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    it('should maintain state consistency during rapid state changes', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Rapid login/logout sequence
      await act(async () => {
        screen.getByTestId('login-btn').click();
      });
      
      act(() => {
        screen.getByTestId('logout-btn').click();
      });
      
      await act(async () => {
        screen.getByTestId('login-btn').click();
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });
  });
});