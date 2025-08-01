import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AuthProvider, { useAuth } from '../../src/Auth/AuthProvider';
import { Identity } from '../../src/Auth/Models';

// Wrapper component for the hook tests
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// Mock user for testing
const mockUser: Identity = {
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com'
};

describe('useAuth hook', () => {
  describe('hook behavior and state management', () => {
    it('should return initial authentication state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(typeof result.current.onLogin).toBe('function');
      expect(typeof result.current.onLogout).toBe('function');
    });

    it('should provide stable function references', () => {
      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      const initialOnLogin = result.current.onLogin;
      const initialOnLogout = result.current.onLogout;

      rerender();

      expect(result.current.onLogin).toBe(initialOnLogin);
      expect(result.current.onLogout).toBe(initialOnLogout);
    });

    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test since we expect an error
      const originalError = console.error;
      console.error = () => {};

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });
  });

  describe('login operations', () => {
    it('should update isAuthenticated to true when onLogin is called', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);

      act(() => {
        result.current.onLogin(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle onLogin as synchronous operation', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // The onLogin function should be synchronous
      act(() => {
        const loginResult = result.current.onLogin(mockUser);
        expect(loginResult).toBeUndefined();
      });
      
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should maintain authentication state after login', () => {
      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.onLogin(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);

      // Rerender should maintain state
      rerender();
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle multiple consecutive login calls', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.onLogin(mockUser);
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);

      const anotherUser: Identity = { id: 'user-456', name: 'Another User', email: 'another@example.com' };
      act(() => {
        result.current.onLogin(anotherUser);
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(anotherUser);
    });
  });

  describe('logout operations', () => {
    it('should update isAuthenticated to false when onLogout is called', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // First login
      act(() => {
        result.current.onLogin(mockUser);
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);

      // Then logout
      act(() => {
        result.current.onLogout();
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('should handle logout when already logged out', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);

      act(() => {
        result.current.onLogout();
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('should handle onLogout as synchronous operation', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        const logoutResult = result.current.onLogout();
        // Should not return a promise (synchronous)
        expect(logoutResult).toBeUndefined();
      });
    });

    it('should maintain logout state after logout', () => {
      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      // Login first
      act(() => {
        result.current.onLogin(mockUser);
      });

      // Then logout
      act(() => {
        result.current.onLogout();
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);

      // Rerender should maintain state
      rerender();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('should handle multiple consecutive logout calls', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login first
      act(() => {
        result.current.onLogin(mockUser);
      });

      // Multiple logouts
      act(() => {
        result.current.onLogout();
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);

      act(() => {
        result.current.onLogout();
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });
  });

  describe('state consistency', () => {
    it('should maintain consistent state within the same provider context', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initial state
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);

      // Login and verify state change
      act(() => {
        result.current.onLogin(mockUser);
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);

      // Logout and verify state change
      act(() => {
        result.current.onLogout();
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('should handle complete authentication cycle', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initial state
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);

      // Login
      act(() => {
        result.current.onLogin(mockUser);
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);

      // Logout
      act(() => {
        result.current.onLogout();
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);

      // Login again
      act(() => {
        result.current.onLogin(mockUser);
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });
  });
});