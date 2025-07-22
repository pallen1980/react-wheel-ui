# Authentication Documentation

## Overview

The authentication system uses Firebase Auth with Google OAuth integration. It provides both popup and redirect authentication flows with proper state management and route protection.

## Architecture

```
Auth/
├── Firebase/
│   ├── Config/
│   │   └── Firebase.tsx          # Firebase configuration
│   ├── OAuth/
│   │   ├── GoogleAuthByPopup.tsx     # Popup auth flow
│   │   └── GoogleAuthByRedirect.tsx  # Redirect auth flow
│   ├── Auth.tsx                  # Main auth component
│   └── SignOut.tsx              # Sign out component
├── Models/
│   └── index.tsx                # Identity interface
├── AuthProvider.tsx             # Auth context provider
└── ProtectedRoute.tsx          # Route protection component
```

## Firebase Configuration

### Environment Variables

Configure Firebase in your `.env` file:

```env
VITE_FIREBASE_API_KEY=[YOUR-FIREBASE-API-KEY]
VITE_FIREBASE_AUTH_DOMAIN=[YOUR-FIREBASE-AUTH-DOMAIN]
VITE_FIREBASE_DATABASE_URL=[YOUR-FIREBASE-DB-URL]
VITE_FIREBASE_PROJECT_ID=[YOUR-FIREBASE-PROJECT-ID]
VITE_FIREBASE_STORAGE_BUCKET=[YOUR-FIREBASE-STORAGE-BUCKET]
VITE_FIREBASE_MESSAGING_SENDER_ID=[YOUR-FIREBASE-MESSAGING-SENDER-ID]
VITE_FIREBASE_APP_ID=[YOUR-FIREBASE-APP-ID]
VITE_FIREBASE_MEASUREMENT_ID=[YOUR-FIREBASE-MEASUREMENT-ID] # Optional
```

### Configuration Setup

The Firebase configuration supports both environment variables and runtime window variables for flexible deployment:

```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? window.FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? window.FIREBASE_AUTH_DOMAIN,
  // ... other config options
};
```

## Authentication Flows

### Popup Authentication

Best for desktop applications where popup blockers are not an issue:

```typescript
import Auth, { AuthType } from './Auth/Firebase/Auth';

function App() {
  return <Auth type={AuthType.Popup} />;
}
```

### Redirect Authentication

Better for mobile devices and environments with strict popup policies:

```typescript
import Auth, { AuthType } from './Auth/Firebase/Auth';

function App() {
  return <Auth type={AuthType.Redirect} />;
}
```

## Identity Model

User information is represented by the Identity interface:

```typescript
interface Identity {
  id: string;
  name?: string;
  email?: string;
}
```

## Auth Context

The AuthProvider manages authentication state across the application:

```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  onLogin: () => Promise<void>;
  onLogout: () => void;
}
```

### Usage

```typescript
import { useAuth } from './Auth/AuthProvider';

function MyComponent() {
  const { isAuthenticated, onLogin, onLogout } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <button onClick={onLogout}>Sign Out</button>
      ) : (
        <button onClick={onLogin}>Sign In</button>
      )}
    </div>
  );
}
```

## Protected Routes

Use ProtectedRoute to restrict access to authenticated users:

```typescript
import ProtectedRoute from './Auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route 
        path="/spinner" 
        element={
          <ProtectedRoute>
            <SpinnerApp />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

## Authentication Events

The Auth component handles various authentication events:

### Sign In Events

- `onSigningIn()`: Called when sign-in process starts
- `onSuccessfulSignIn(user, token)`: Called when sign-in succeeds
- `onFailedSignIn(error)`: Called when sign-in fails

### Sign Out Events

- `onSigningOut()`: Called when sign-out process starts
- `onSuccessfulSignOut()`: Called when sign-out succeeds
- `onSignOutError(error)`: Called when sign-out fails

## Integration with Services

The authentication system integrates with the [services layer](../services/) to provide auth tokens for API requests:

```typescript
// Services automatically get auth tokens
const optionsService = createOptionsService();

// The service uses Firebase auth internally
const options = await optionsService.loadUserOptions(userId);
```

## Error Handling

Authentication errors are handled gracefully with user feedback:

```typescript
const handleSignInError = (error: Error) => {
  console.error('Authentication failed:', error);
  // Show user-friendly error message
};
```

## Testing

The authentication system includes comprehensive tests covering:

- Successful authentication flows
- Error scenarios
- Route protection
- Context state management
- Component integration

## Security Considerations

- **Token Management**: Auth tokens are automatically refreshed by Firebase
- **Route Protection**: Sensitive routes are protected by authentication checks
- **Error Handling**: Authentication errors don't expose sensitive information
- **Session Management**: User sessions are managed by Firebase Auth

## Future Enhancements

Potential improvements:

- **Multi-factor Authentication**: Add MFA support
- **Social Providers**: Support for additional OAuth providers
- **Role-based Access**: Implement user roles and permissions
- **Session Persistence**: Configure session persistence options
- **Auth Guards**: More granular route protection