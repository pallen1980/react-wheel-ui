import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AuthProvider, { useAuth } from '../../src/Auth/AuthProvider';

// Wrapper component for the hook tests
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth hook', () => {
  describe('hook behavior and state management', () => {
    it('should return initial authentication state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
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
    it('should update isAuthenticated to true when onLogin is called', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);

      await act(async () => {
        await result.current.onLogin();
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle onLogin as async operation', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // The onLogin function should be async and return a promise
      let loginResult: Promise<void>;
      act(() => {
        loginResult = result.current.onLogin();
      });
      expect(loginResult!).toBeInstanceOf(Promise);

      await act(async () => {
        await loginResult!;
      });
      
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should maintain authentication state after login', async () => {
      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.onLogin();
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Rerender should maintain state
      rerender();
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle multiple consecutive login calls', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.onLogin();
      });
      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.onLogin();
      });
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('logout operations', () => {
    it('should update isAuthenticated to false when onLogout is called', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // First login
      await act(async () => {
        await result.current.onLogin();
      });
      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.onLogout();
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle logout when already logged out', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.onLogout();
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle onLogout as synchronous operation', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        const logoutResult = result.current.onLogout();
        // Should not return a promise (synchronous)
        expect(logoutResult).toBeUndefined();
      });
    });

    it('should maintain logout state after logout', async () => {
      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      // Login first
      await act(async () => {
        await result.current.onLogin();
      });

      // Then logout
      act(() => {
        result.current.onLogout();
      });
      expect(result.current.isAuthenticated).toBe(false);

      // Rerender should maintain state
      rerender();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle multiple consecutive logout calls', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login first
      await act(async () => {
        await result.current.onLogin();
      });

      // Multiple logouts
      act(() => {
        result.current.onLogout();
      });
      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.onLogout();
      });
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('state consistency', () => {
    it('should maintain consistent state within the same provider context', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initial state
      expect(result.current.isAuthenticated).toBe(false);

      // Login and verify state change
      await act(async () => {
        await result.current.onLogin();
      });
      expect(result.current.isAuthenticated).toBe(true);

      // Logout and verify state change
      act(() => {
        result.current.onLogout();
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle complete authentication cycle', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initial state
      expect(result.current.isAuthenticated).toBe(false);

      // Login
      await act(async () => {
        await result.current.onLogin();
      });
      expect(result.current.isAuthenticated).toBe(true);

      // Logout
      act(() => {
        result.current.onLogout();
      });
      expect(result.current.isAuthenticated).toBe(false);

      // Login again
      await act(async () => {
        await result.current.onLogin();
      });
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});