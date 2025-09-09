# Error Handling Documentation

## Overview

The mock API service implements comprehensive error handling through a global exception handling middleware and custom exception types. This provides consistent error responses and enables testing of various error scenarios.

## Components

### 1. Global Exception Handling Middleware

**File**: `Middleware/GlobalExceptionHandlingMiddleware.cs`

This middleware catches all unhandled exceptions and converts them to appropriate HTTP responses with consistent error format.

**Supported Exception Types**:
- `AuthenticationException` → 401 Unauthorized
- `AuthorizationException` → 403 Forbidden  
- `ValidationException` → 400 Bad Request
- `ResourceNotFoundException` → 404 Not Found
- `ResourceConflictException` → 409 Conflict
- `RateLimitException` → 429 Too Many Requests (includes Retry-After header)
- `ServiceUnavailableException` → 503 Service Unavailable
- `ArgumentException` → 400 Bad Request
- `ArgumentNullException` → 400 Bad Request
- `UnauthorizedAccessException` → 401 Unauthorized
- `InvalidOperationException` → 400 Bad Request
- `TimeoutException` → 408 Request Timeout
- `TaskCanceledException` → 408 Request Timeout
- All other exceptions → 500 Internal Server Error

### 2. Custom Exception Types

**File**: `Exceptions/ApiExceptions.cs`

Custom exception classes that provide structured error information:

- `ApiException` - Base class for all API exceptions
- `AuthenticationException` - Authentication failures
- `AuthorizationException` - Authorization failures  
- `ValidationException` - Data validation errors
- `ResourceNotFoundException` - Resource not found errors
- `ResourceConflictException` - Resource conflict errors
- `RateLimitException` - Rate limiting errors
- `ServiceUnavailableException` - Service unavailable errors

### 3. Error Simulation Service

**Files**: 
- `Services/IErrorSimulationService.cs`
- `Services/ErrorSimulationService.cs`
- `Controllers/ErrorSimulationController.cs`

Provides functionality to simulate various error scenarios for testing purposes.

**Features**:
- Enable/disable error simulation
- Configure specific errors for endpoints
- Simulate network delays
- Clear all error configurations
- Manually trigger specific error types

## Error Response Format

All errors return a consistent JSON format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {
    // Optional additional error details
  }
}
```

## Error Simulation API

### Enable Error Simulation
```http
POST /api/error-simulation/enable
```

### Disable Error Simulation  
```http
POST /api/error-simulation/disable
```

### Configure Error for Endpoint
```http
POST /api/error-simulation/configure
Content-Type: application/json

{
  "endpoint": "/api/users/123/options",
  "errorType": "TIMEOUT",
  "delayMs": 5000
}
```

### Clear All Error Configurations
```http
DELETE /api/error-simulation/clear
```

### Manually Trigger Error
```http
POST /api/error-simulation/trigger/{errorType}
```

**Supported Error Types**:
- `TIMEOUT`
- `AUTHENTICATION_ERROR`
- `AUTHORIZATION_ERROR`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMIT`
- `SERVICE_UNAVAILABLE`
- `INTERNAL_SERVER_ERROR`

## Usage in Controllers

Controllers can use the error simulation service to test error scenarios:

```csharp
// Check for error simulation
var endpoint = "/api/users/{userId}/options";
if (await _errorSimulationService.ShouldSimulateErrorAsync(endpoint))
{
    var (errorType, delayMs) = await _errorSimulationService.GetConfiguredErrorAsync(endpoint);
    if (delayMs.HasValue)
    {
        await _errorSimulationService.SimulateNetworkDelayAsync(delayMs.Value);
    }
    if (!string.IsNullOrEmpty(errorType))
    {
        throw ErrorSimulationService.CreateExceptionForErrorType(errorType);
    }
}
```

## Testing

Comprehensive unit tests are provided for all error handling components:

- `Tests/GlobalExceptionHandlingMiddlewareTests.cs`
- `Tests/ErrorSimulationServiceTests.cs`
- `Tests/ErrorSimulationControllerTests.cs`

## Integration

The error handling is integrated into the application pipeline in `Program.cs`:

```csharp
// Add global exception handling middleware first
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();
```

The error simulation service is registered in the DI container via `ServiceCollectionExtensions.cs`.