import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Auth from '../../../src/Auth/Firebase/Auth';
import { AuthType } from '../../../src/Auth/Firebase/types';
import { Identity } from '../../../src/Auth/Models';
import AuthProvider from '../../../src/Auth/AuthProvider';

// Mock Firebase auth to avoid real Firebase calls
vi.mock('../../../src/Auth/Firebase/Config/Firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn((callback) => {
      // Simulate no user initially
      callback(null);
      // Return unsubscribe function
      return vi.fn();
    })
  }
}));

// Extend Window interface for testing
declare global {
  interface Window {
    mockAuthCallbacks?: {
      onSuccessfulSignIn: (user: Identity, token: string) => void;
      onSuccessfulSignOut: () => void;
      onFailedSignIn: (error: Error) => void;
    };
  }
}

// Mock the OAuth components
interface MockAuthProps {
  onSigningIn: () => void;
  onFailedSignIn: (error: Error) => void;
}

interface MockCallbackProps {
  onSuccessfulSignIn: (user: Identity, token: string) => void;
  onSuccessfulSignOut: () => void;
  onFailedSignIn: (error: Error) => void;
}

vi.mock('../../../src/Auth/Firebase/OAuth/GoogleAuthByPopup', () => ({
  default: ({ onSigningIn }: MockAuthProps) => (
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
  GoogleAuthByPopupCallback: ({ onSuccessfulSignIn, onSuccessfulSignOut, onFailedSignIn }: MockCallbackProps) => {
    // Store callbacks for testing
    React.useEffect(() => {
      window.mockAuthCallbacks = {
        onSuccessfulSignIn,
        onSuccessfulSignOut,
        onFailedSignIn
      };
    }, [onFailedSignIn, onSuccessfulSignIn, onSuccessfulSignOut]);
    return null;
  }
}));

vi.mock('../../../src/Auth/Firebase/OAuth/GoogleAuthByRedirect', () => ({
  default: ({ onSigningIn }: MockAuthProps) => (
    <button 
      data-testid="google-redirect-signin"
      onClick={() => {
        onSigningIn();
      }}
    >
      Sign in with Google (Redirect)
    </button>
  ),
  GoogleAuthByRedirectCallback: ({ onSuccessfulSignIn, onSuccessfulSignOut, onFailedSignIn }: MockCallbackProps) => {
    React.useEffect(() => {
      window.mockAuthCallbacks = {
        onSuccessfulSignIn,
        onSuccessfulSignOut,
        onFailedSignIn
      };
    }, [onFailedSignIn, onSuccessfulSignIn, onSuccessfulSignOut]);
    return null;
  }
}));

interface MockSignOutProps {
  onSigningOut: () => void;
  onError: (error: Error) => void;
}

vi.mock('../../../src/Auth/Firebase/SignOut', () => ({
  default: ({ onSigningOut }: MockSignOutProps) => (
    <button 
      data-testid="signout-button"
      onClick={() => {
        onSigningOut();
        // Simulate successful sign out
        setTimeout(() => {
          window.mockAuthCallbacks?.onSuccessfulSignOut();
        }, 50);
      }}
    >
      Sign Out
    </button>
  )
}));

// Mock the useAuth hook and AuthContext
const mockOnLogin = vi.fn();
const mockOnLogout = vi.fn();

vi.mock('../../../src/Auth/hooks', async () => {
  const React = await import('react');
  return {
    AuthContext: React.createContext(null),
    useAuth: () => ({
      onLogin: mockOnLogin,
      onLogout: mockOnLogout
    })
  };
});

// Test wrapper with AuthProvider
const renderWithAuthProvider = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.mockAuthCallbacks;
  });

  describe('Popup Authentication', () => {
    it('should render Google sign-in button for popup type when not authenticated', () => {
      renderWithAuthProvider(<Auth type={AuthType.Popup} />);
      
      expect(screen.getByTestId('google-popup-signin')).toBeInTheDocument();
      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    });

    it('should show loading state when signing in', () => {
      renderWithAuthProvider(<Auth type={AuthType.Popup} />);
      
      const signInButton = screen.getByTestId('google-popup-signin');
      fireEvent.click(signInButton);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle successful sign in', async () => {
      renderWithAuthProvider(<Auth type={AuthType.Popup} />);
      
      // Wait for callbacks to be set up
      await waitFor(() => {
        expect(window.mockAuthCallbacks).toBeDefined();
      });

      const mockUser: Identity = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      };

      // Simulate successful sign in
      await act(async () => {
        window.mockAuthCallbacks!.onSuccessfulSignIn(mockUser, 'mock-token');
      });

      await waitFor(() => {
        expect(screen.getByText('Logged in as: Test User')).toBeInTheDocument();
        expect(screen.getByTestId('signout-button')).toBeInTheDocument();
      });

      expect(mockOnLogin).toHaveBeenCalledTimes(1);
    });

    it('should handle successful sign in with email when name is not available', async () => {
      renderWithAuthProvider(<Auth type={AuthType.Popup} />);
      
      await waitFor(() => {
        expect(window.mockAuthCallbacks).toBeDefined();
      });

      const mockUser: Identity = {
        id: 'test-user-id',
        name: '',
        email: 'test@example.com'
      };

      await act(async () => {
        window.mockAuthCallbacks!.onSuccessfulSignIn(mockUser, 'mock-token');
      });

      await waitFor(() => {
        expect(screen.getByText('Logged in as: test@example.com')).toBeInTheDocument();
      });
    });

    it('should handle sign in error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithAuthProvider(<Auth type={AuthType.Popup} />);
      
      await waitFor(() => {
        expect(window.mockAuthCallbacks).toBeDefined();
      });

      const mockError = new Error('Sign in failed');
      window.mockAuthCallbacks!.onFailedSignIn(mockError);

      expect(consoleSpy).toHaveBeenCalledWith(mockError);
      
      consoleSpy.mockRestore();
    });

    it('should handle sign out', async () => {
      renderWithAuthProvider(<Auth type={AuthType.Popup} />);
      
      await waitFor(() => {
        expect(window.mockAuthCallbacks).toBeDefined();
      });

      // First sign in
      const mockUser: Identity = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      };
      await act(async () => {
        window.mockAuthCallbacks!.onSuccessfulSignIn(mockUser, 'mock-token');
      });

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
      renderWithAuthProvider(<Auth type={AuthType.Redirect} />);
      
      expect(screen.getByTestId('google-redirect-signin')).toBeInTheDocument();
      expect(screen.getByText('Sign in with Google (Redirect)')).toBeInTheDocument();
    });

    it('should show loading state when signing in via redirect', () => {
      renderWithAuthProvider(<Auth type={AuthType.Redirect} />);
      
      const signInButton = screen.getByTestId('google-redirect-signin');
      fireEvent.click(signInButton);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle successful sign in via redirect', async () => {
      renderWithAuthProvider(<Auth type={AuthType.Redirect} />);
      
      await waitFor(() => {
        expect(window.mockAuthCallbacks).toBeDefined();
      });

      const mockUser: Identity = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      };

      await act(async () => {
        window.mockAuthCallbacks!.onSuccessfulSignIn(mockUser, 'mock-token');
      });

      await waitFor(() => {
        expect(screen.getByText('Logged in as: Test User')).toBeInTheDocument();
      });

      expect(mockOnLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should not sign in when user is undefined', async () => {
      renderWithAuthProvider(<Auth type={AuthType.Popup} />);
      
      await waitFor(() => {
        expect(window.mockAuthCallbacks).toBeDefined();
      });

      // Try to sign in with undefined user
      window.mockAuthCallbacks!.onSuccessfulSignIn(undefined as unknown as Identity, 'mock-token');

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