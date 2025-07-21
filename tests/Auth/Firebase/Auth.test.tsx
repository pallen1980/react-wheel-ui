import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Auth, { AuthType } from '../../../src/Auth/Firebase/Auth';
import { Identity } from '../../../src/Auth/Models';

// Mock the OAuth components
vi.mock('../../../src/Auth/Firebase/OAuth/GoogleAuthByPopup', () => ({
  default: ({ onSigningIn, onFailedSignIn }: any) => (
    <button 
      data-testid="google-popup-signin"
      onClick={() => {
        onSigningIn();
        // Simulate successful sign in after a delay
        setTimeout(() => {
          // This would normally be handled by the callback component
        }, 100);
      }}
    >
      Sign in with Google
    </button>
  ),
  GoogleAuthByPopupCallback: ({ onSuccessfulSignIn, onSuccessfulSignOut, onFailedSignIn }: any) => {
    // Store callbacks for testing
    React.useEffect(() => {
      (window as any).mockAuthCallbacks = {
        onSuccessfulSignIn,
        onSuccessfulSignOut,
        onFailedSignIn
      };
    }, []);
    return null;
  }
}));

vi.mock('../../../src/Auth/Firebase/OAuth/GoogleAuthByRedirect', () => ({
  default: ({ onSigningIn, onFailedSignIn }: any) => (
    <button 
      data-testid="google-redirect-signin"
      onClick={() => {
        onSigningIn();
      }}
    >
      Sign in with Google (Redirect)
    </button>
  ),
  GoogleAuthByRedirectCallback: ({ onSuccessfulSignIn, onSuccessfulSignOut, onFailedSignIn }: any) => {
    React.useEffect(() => {
      (window as any).mockAuthCallbacks = {
        onSuccessfulSignIn,
        onSuccessfulSignOut,
        onFailedSignIn
      };
    }, []);
    return null;
  }
}));

vi.mock('../../../src/Auth/Firebase/SignOut', () => ({
  default: ({ onSigningOut, onError }: any) => (
    <button 
      data-testid="signout-button"
      onClick={() => {
        onSigningOut();
        // Simulate successful sign out
        setTimeout(() => {
          (window as any).mockAuthCallbacks?.onSuccessfulSignOut();
        }, 50);
      }}
    >
      Sign Out
    </button>
  )
}));

// Mock the useAuth hook
const mockOnLogin = vi.fn();
const mockOnLogout = vi.fn();
vi.mock('../../../src/Auth/AuthProvider', () => ({
  useAuth: () => ({
    onLogin: mockOnLogin,
    onLogout: mockOnLogout
  })
}));

describe('Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).mockAuthCallbacks;
  });

  describe('Popup Authentication', () => {
    it('should render Google sign-in button for popup type when not authenticated', () => {
      render(<Auth type={AuthType.Popup} />);
      
      expect(screen.getByTestId('google-popup-signin')).toBeInTheDocument();
      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    });

    it('should show loading state when signing in', () => {
      render(<Auth type={AuthType.Popup} />);
      
      const signInButton = screen.getByTestId('google-popup-signin');
      fireEvent.click(signInButton);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle successful sign in', async () => {
      render(<Auth type={AuthType.Popup} />);
      
      // Wait for callbacks to be set up
      await waitFor(() => {
        expect((window as any).mockAuthCallbacks).toBeDefined();
      });

      const mockUser: Identity = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      };

      // Simulate successful sign in
      (window as any).mockAuthCallbacks.onSuccessfulSignIn(mockUser, 'mock-token');

      await waitFor(() => {
        expect(screen.getByText('Logged in as: Test User')).toBeInTheDocument();
        expect(screen.getByTestId('signout-button')).toBeInTheDocument();
      });

      expect(mockOnLogin).toHaveBeenCalledTimes(1);
    });

    it('should handle successful sign in with email when name is not available', async () => {
      render(<Auth type={AuthType.Popup} />);
      
      await waitFor(() => {
        expect((window as any).mockAuthCallbacks).toBeDefined();
      });

      const mockUser: Identity = {
        id: 'test-user-id',
        name: '',
        email: 'test@example.com'
      };

      (window as any).mockAuthCallbacks.onSuccessfulSignIn(mockUser, 'mock-token');

      await waitFor(() => {
        expect(screen.getByText('Logged in as: test@example.com')).toBeInTheDocument();
      });
    });

    it('should handle sign in error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<Auth type={AuthType.Popup} />);
      
      await waitFor(() => {
        expect((window as any).mockAuthCallbacks).toBeDefined();
      });

      const mockError = new Error('Sign in failed');
      (window as any).mockAuthCallbacks.onFailedSignIn(mockError);

      expect(consoleSpy).toHaveBeenCalledWith(mockError);
      
      consoleSpy.mockRestore();
    });

    it('should handle sign out', async () => {
      render(<Auth type={AuthType.Popup} />);
      
      await waitFor(() => {
        expect((window as any).mockAuthCallbacks).toBeDefined();
      });

      // First sign in
      const mockUser: Identity = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      };
      (window as any).mockAuthCallbacks.onSuccessfulSignIn(mockUser, 'mock-token');

      await waitFor(() => {
        expect(screen.getByTestId('signout-button')).toBeInTheDocument();
      });

      // Then sign out
      const signOutButton = screen.getByTestId('signout-button');
      fireEvent.click(signOutButton);

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for sign out to complete
      await waitFor(() => {
        expect(screen.getByTestId('google-popup-signin')).toBeInTheDocument();
      });

      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Redirect Authentication', () => {
    it('should render Google sign-in button for redirect type when not authenticated', () => {
      render(<Auth type={AuthType.Redirect} />);
      
      expect(screen.getByTestId('google-redirect-signin')).toBeInTheDocument();
      expect(screen.getByText('Sign in with Google (Redirect)')).toBeInTheDocument();
    });

    it('should show loading state when signing in via redirect', () => {
      render(<Auth type={AuthType.Redirect} />);
      
      const signInButton = screen.getByTestId('google-redirect-signin');
      fireEvent.click(signInButton);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle successful sign in via redirect', async () => {
      render(<Auth type={AuthType.Redirect} />);
      
      await waitFor(() => {
        expect((window as any).mockAuthCallbacks).toBeDefined();
      });

      const mockUser: Identity = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      };

      (window as any).mockAuthCallbacks.onSuccessfulSignIn(mockUser, 'mock-token');

      await waitFor(() => {
        expect(screen.getByText('Logged in as: Test User')).toBeInTheDocument();
      });

      expect(mockOnLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should not sign in when user is undefined', async () => {
      render(<Auth type={AuthType.Popup} />);
      
      await waitFor(() => {
        expect((window as any).mockAuthCallbacks).toBeDefined();
      });

      // Try to sign in with undefined user
      (window as any).mockAuthCallbacks.onSuccessfulSignIn(undefined, 'mock-token');

      // Should remain in signed out state
      expect(screen.getByTestId('google-popup-signin')).toBeInTheDocument();
      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  describe('AuthType enum', () => {
    it('should export AuthType enum with correct values', () => {
      expect(AuthType.Popup).toBe(0);
      expect(AuthType.Redirect).toBe(1);
    });
  });
});