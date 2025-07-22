# Redux Store Documentation

## Overview

The application uses Redux Toolkit for state management with async thunks for handling API operations. The store is configured with proper TypeScript support and includes middleware for development tools.

## Store Structure

```typescript
interface RootState {
  options: OptionsState;
  // Future slices can be added here
}

interface OptionsState {
  options: Option[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaved: string | null; // ISO date string
}
```

## Options Async Thunks

The store includes async thunks for loading and saving user options to the backend with proper error handling and loading state management.

### Usage Example

```typescript
import { useDispatch, useSelector } from 'react-redux';
import { loadOptionsThunk, saveOptionsThunk } from './optionsSlice';
import { createOptionsService } from '../services';
import { RootState, AppDispatch } from './index';

function MyComponent() {
  const dispatch = useDispatch<AppDispatch>();
  const { options, isLoading, isSaving, error } = useSelector((state: RootState) => state.options);
  const optionsService = createOptionsService();

  // Load options on component mount
  useEffect(() => {
    dispatch(loadOptionsThunk(optionsService));
  }, [dispatch]);

  // Save options when they change
  const handleSaveOptions = () => {
    dispatch(saveOptionsThunk({ optionsService, options }));
  };

  return (
    <div>
      {isLoading && <p>Loading options...</p>}
      {isSaving && <p>Saving options...</p>}
      {error && <p>Error: {error}</p>}
      
      {/* Your options UI here */}
      <button onClick={handleSaveOptions}>Save Options</button>
    </div>
  );
}
```

## Thunk Functions

### `loadOptionsThunk(optionsService: OptionsService)`

Loads user options from the backend API.

**Features:**
- Requires authenticated user
- Automatically sorts options by sequence
- Sets loading state during operation
- Handles authentication, network, and data errors

**Usage:**
```typescript
dispatch(loadOptionsThunk(optionsService));
```

**State Changes:**
- `pending`: Sets `isLoading: true`, clears `error`
- `fulfilled`: Sets `isLoading: false`, updates `options` array
- `rejected`: Sets `isLoading: false`, sets `error` message

### `saveOptionsThunk({ optionsService, options })`

Saves user options to the backend API.

**Features:**
- Requires authenticated user
- Sets saving state during operation
- Updates lastSaved timestamp on success
- Handles authentication, network, and data errors

**Usage:**
```typescript
dispatch(saveOptionsThunk({ optionsService, options }));
```

**State Changes:**
- `pending`: Sets `isSaving: true`, clears `error`
- `fulfilled`: Sets `isSaving: false`, updates `lastSaved` timestamp
- `rejected`: Sets `isSaving: false`, sets `error` message

## Error Handling

The thunks handle various error scenarios with structured error responses:

### Error Types

- **Authentication errors**: User not logged in or token expired
- **Network errors**: Connection issues, timeouts
- **Permission errors**: Insufficient API permissions
- **Data errors**: Invalid option format

### Error Structure

```typescript
interface ThunkError {
  type: 'auth' | 'network' | 'permission' | 'data';
  message: string;
  retryable: boolean;
}
```

All errors are stored in the `error` field of the state and can be displayed to the user.

## Synchronous Actions

In addition to async thunks, the options slice provides synchronous actions for local state management:

```typescript
// Add a new option
dispatch(addOption({ key: 'new', value: 'New Option', sequence: 1 }));

// Update existing option
dispatch(updateOption({ key: 'existing', value: 'Updated Value', sequence: 1 }));

// Delete option
dispatch(deleteOption('option-key'));

// Reorder options
dispatch(reorderOptions({ fromIndex: 0, toIndex: 2 }));

// Shuffle options randomly
dispatch(shuffleOptions());

// Clear all options
dispatch(clearOptions());

// Clear error state
dispatch(clearError());
```

## Testing

The store includes comprehensive test coverage for all thunks and reducers. See the test files for examples of how to test async thunks with various scenarios.

## Integration with Services

The thunks work with the [services layer](../services/) to handle API communication. Use the `createOptionsService()` factory function to get a properly configured service instance with Firebase authentication.