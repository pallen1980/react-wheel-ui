# Services Documentation

## Overview

The services layer provides a clean abstraction for API communication and business logic. It follows the interface segregation principle with clear contracts and comprehensive error handling.

## Architecture

```
services/
├── OptionsService.ts      # Interface and types
├── HttpOptionsService.ts  # HTTP implementation
└── index.ts              # Factory and exports
```

## OptionsService Interface

The core interface for managing user options persistence:

```typescript
interface OptionsService {
  loadUserOptions(userId: string): Promise<Option[]>;
  saveUserOptions(userId: string, options: Option[]): Promise<void>;
}
```

## HttpOptionsService Implementation

HTTP-based implementation that communicates with a REST API backend.

### Features

- **Authentication Integration**: Works with Firebase auth tokens
- **Comprehensive Error Handling**: Structured error types with retry logic
- **Request Timeout**: Configurable timeout with abort controller
- **Data Validation**: Validates API responses and request data
- **Type Safety**: Full TypeScript support

### Configuration

```typescript
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};
```

### API Endpoints

```typescript
const API_ENDPOINTS = {
  LOAD_OPTIONS: '/users/{userId}/options',
  SAVE_OPTIONS: '/users/{userId}/options'
};
```

## Error Handling

### Error Types

```typescript
enum OptionsErrorType {
  NETWORK = 'network',     // Connection issues, timeouts
  AUTH = 'auth',           // Authentication failures
  PERMISSION = 'permission', // Authorization failures
  DATA = 'data'            // Invalid data format
}
```

### OptionsServiceError

Custom error class with structured information:

```typescript
class OptionsServiceError extends Error {
  constructor(
    public type: OptionsErrorType,
    message: string,
    public retryable: boolean = false,
    public originalError?: Error
  )
}
```

### Error Scenarios

| HTTP Status | Error Type | Retryable | Description |
|-------------|------------|-----------|-------------|
| 401 | AUTH | No | Authentication failed |
| 403 | PERMISSION | No | Insufficient permissions |
| 404 | - | No | No options found (returns empty array) |
| 5xx | NETWORK | Yes | Server errors |
| Timeout | NETWORK | Yes | Request timeout |
| Network failure | NETWORK | Yes | Connection issues |

## Service Factory

Use the factory function to create properly configured service instances:

```typescript
import { createOptionsService } from '../services';

// Creates HttpOptionsService with Firebase auth integration
const optionsService = createOptionsService();
```

The factory automatically:
- Configures Firebase auth token retrieval
- Sets up proper error handling
- Uses environment-based configuration

## Usage Examples

### Loading Options

```typescript
try {
  const options = await optionsService.loadUserOptions(userId);
  console.log('Loaded options:', options);
} catch (error) {
  if (error instanceof OptionsServiceError) {
    console.error(`${error.type} error:`, error.message);
    if (error.retryable) {
      // Implement retry logic
    }
  }
}
```

### Saving Options

```typescript
const options = [
  { key: 'opt1', value: 'Option 1', sequence: 1 },
  { key: 'opt2', value: 'Option 2', sequence: 2 }
];

try {
  await optionsService.saveUserOptions(userId, options);
  console.log('Options saved successfully');
} catch (error) {
  if (error instanceof OptionsServiceError) {
    console.error(`Save failed: ${error.message}`);
  }
}
```

## Testing

The services include comprehensive test coverage with mocked HTTP responses. Tests cover:

- Successful operations
- All error scenarios
- Authentication edge cases
- Network timeout handling
- Data validation

## Integration

The services layer integrates with:

- **[Redux Store](../store/)**: Via async thunks for state management
- **[Firebase Auth](../Auth/)**: For authentication token retrieval
- **Backend API**: RESTful endpoints for data persistence

## Future Enhancements

Potential improvements to consider:

- **Caching**: Add local caching with cache invalidation
- **Offline Support**: Queue operations when offline
- **Batch Operations**: Support for bulk option updates
- **Real-time Updates**: WebSocket integration for live updates
- **Optimistic Updates**: Update UI before API confirmation