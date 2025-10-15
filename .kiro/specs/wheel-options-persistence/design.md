# Design Document

## Overview

The wheel options persistence feature will integrate with the existing React application architecture to provide seamless backend synchronization of user options. The design leverages Redux for centralized state management, implements Redux middleware for API communication, and uses your existing backend API for data persistence while maintaining the current component structure.

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React UI      │    │   Redux Store    │    │   Redux Thunks   │    │   Backend API   │
│   Components    │◄──►│   (State Mgmt)   │◄──►│   (API Client)   │◄──►│   Database      │
└─────────────────┘    └──────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow
1. **Load**: App starts → Dispatch loadOptions thunk → API call → Update Redux store → UI updates
2. **Save**: User modifies options → Dispatch updateOptions action → Redux middleware → Debounced API save → UI feedback

## Components and Interfaces

### Redux Store Structure

#### Options Slice State
```typescript
interface OptionsState {
  options: Option[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaved: Date | null;
}
```

#### Redux Actions
```typescript
// Synchronous actions
const optionsSlice = createSlice({
  name: 'options',
  initialState,
  reducers: {
    setOptions: (state, action: PayloadAction<Option[]>) => void;
    addOption: (state, action: PayloadAction<Option>) => void;
    updateOption: (state, action: PayloadAction<Option>) => void;
    deleteOption: (state, action: PayloadAction<string>) => void;
    setLoading: (state, action: PayloadAction<boolean>) => void;
    setSaving: (state, action: PayloadAction<boolean>) => void;
    setError: (state, action: PayloadAction<string | null>) => void;
  }
});

// Async thunks
const loadOptionsThunk = createAsyncThunk('options/load', async (userId: string));
const saveOptionsThunk = createAsyncThunk('options/save', async ({ userId, options }));
```

### Service Layer

#### OptionsService
```typescript
interface OptionsService {
  loadUserOptions(userId: string): Promise<Option[]>;
  saveUserOptions(userId: string, options: Option[]): Promise<void>;
}
```

#### OptionsRepository (HTTP API Implementation)
```typescript
class HttpOptionsRepository implements OptionsService {
  private baseUrl: string;
  private authToken: string | null;
  
  async loadUserOptions(userId: string): Promise<Option[]>;
  async saveUserOptions(userId: string, options: Option[]): Promise<void>;
}
```

### Redux Middleware

#### Auto-Save Middleware
```typescript
const autoSaveMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Debounced save on option changes
  if (optionsSlice.actions.setOptions.match(action) || 
      optionsSlice.actions.addOption.match(action) ||
      optionsSlice.actions.updateOption.match(action) ||
      optionsSlice.actions.deleteOption.match(action)) {
    
    debouncedSave(store.dispatch, store.getState);
  }
  
  return result;
};
```

### Modified Components

#### Main/App.tsx Enhancements
- Replace local useState with Redux useSelector and useDispatch
- Add loading and error state handling from Redux store
- Integrate with authentication context

#### New UI Components
- LoadingSpinner component for initial load
- SaveIndicator component for save feedback
- Error notifications using existing react-toastify

## Data Models

### Backend API Data Structure
```typescript
// API Endpoint: GET/POST /v1/users/{userId}/options
interface UserOptionsResponse {
  userId: string;
  options: Option[];
  lastModified: string; // ISO date string
  version: number; // For future conflict resolution
}

// API Request/Response formats
interface SaveOptionsRequest {
  options: Option[];
}

interface LoadOptionsResponse {
  options: Option[];
  lastModified: string;
}
```

### Enhanced Option Model
```typescript
// Updated Option interface with sequence property
interface Option {
  key: string;
  value: string;
  sequence: number; // For maintaining display order, especially after shuffle
}

// New sync-related types
interface SyncState {
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}
```

## Error Handling

### Error Categories
1. **Network Errors**: Connection timeouts, offline state
2. **Authentication Errors**: Invalid/expired tokens
3. **Permission Errors**: Insufficient API permissions (401/403)
4. **Data Errors**: Malformed data, validation failures

### Error Handling Strategy
```typescript
enum ErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  PERMISSION = 'permission',
  DATA = 'data'
}

interface OptionsError {
  type: ErrorType;
  message: string;
  retryable: boolean;
}
```

### Fallback Behavior
- **Load Failure**: Continue with empty options array
- **Save Failure**: Show error toast, maintain local state
- **Auth Failure**: Clear options, redirect to login if needed

## Testing Strategy

### Unit Tests
- OptionsService implementation with mocked HTTP client
- Redux slice reducers and actions
- Redux thunks with various auth states
- Auto-save middleware behavior
- Error handling scenarios
- Debouncing behavior

### Integration Tests
- End-to-end option sync flow
- Authentication integration
- Backend API connection and data persistence
- Error recovery scenarios

### Test Data
```typescript
const mockOptions: Option[] = [
  { key: 'test-1', value: 'Option 1', sequence: 1 },
  { key: 'test-2', value: 'Option 2', sequence: 2 }
];

const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com'
};
```

## Implementation Considerations

### Performance Optimizations
- **Debouncing**: 500ms delay for save operations
- **Caching**: Local state remains authoritative during session
- **Lazy Loading**: Only load options after authentication

### Security
- Backend API authentication to ensure users can only access their own options
- Input validation for option values on both client and server
- Rate limiting considerations for API calls

### API Configuration
```typescript
// API endpoints
const API_ENDPOINTS = {
  LOAD_OPTIONS: '/v1/users/{userId}/options',
  SAVE_OPTIONS: '/v1/users/{userId}/options'
} as const;

// HTTP client configuration
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};
```

### Migration Strategy
- Existing users will start with empty options (no migration needed)
- New feature is additive and doesn't break existing functionality
- Graceful degradation when backend is unavailable
