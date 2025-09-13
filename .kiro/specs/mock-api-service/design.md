# Design Document

## Overview

The mock API service will be a lightweight .NET Core Web API application that simulates the backend API for The Wheel application. It will provide realistic responses for user options persistence, implement Firebase token validation, and support the exact API contract expected by the frontend application. The service will be containerized for easy deployment and integration with the existing development workflow.

## Architecture

### Technology Stack
- **Runtime**: .NET 8.0
- **Framework**: ASP.NET Core Web API
- **Authentication**: FirebaseAdmin SDK for token validation
- **Storage**: In-memory storage (Dictionary-based) for development simplicity
- **Containerization**: Docker with multi-stage build
- **CORS**: Built-in ASP.NET Core CORS middleware

### Service Structure
```
mocks/
└── mock-api-service/
    ├── Controllers/
    │   ├── OptionsController.cs
    │   └── AuthController.cs
    ├── Middleware/
    │   └── MockFirebaseAuthMiddleware.cs
    ├── Models/
    │   ├── Option.cs
    │   ├── LoadOptionsResponse.cs
    │   ├── SaveOptionsRequest.cs
    │   ├── ErrorResponse.cs
    │   ├── MockUser.cs
    │   ├── LoginRequest.cs
    │   └── LoginResponse.cs
    ├── Services/
    │   ├── IAuthService.cs
    │   ├── MockAuthService.cs
    │   ├── ITokenService.cs
    │   ├── MockTokenService.cs
    │   ├── IStorageService.cs
    │   └── InMemoryStorageService.cs
    ├── Extensions/
    │   └── ServiceCollectionExtensions.cs
    ├── Program.cs
    ├── appsettings.json
    ├── appsettings.Development.json
    ├── MockApiService.csproj
    └── Dockerfile
```

## Components and Interfaces

### 1. Program.cs
**Purpose**: Main application entry point and service configuration
**Responsibilities**:
- Configure ASP.NET Core services and middleware pipeline
- Set up dependency injection container
- Configure CORS, authentication, and logging
- Handle application startup and configuration

### 2. Firebase Authentication Middleware (Middleware/FirebaseAuthMiddleware.cs)
**Purpose**: Validate Firebase authentication tokens
**Responsibilities**:
- Extract Bearer tokens from Authorization headers
- Validate token format and structure
- Verify token signature using Firebase Admin SDK
- Extract user ID from validated tokens
- Return appropriate HTTP status codes for auth failures

**Interface**:
```csharp
public class FirebaseAuthMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next);
}

public class FirebaseUser
{
    public string Uid { get; set; }
    public string Email { get; set; }
}
```

### 3. Options Controller (Controllers/OptionsController.cs)
**Purpose**: Handle HTTP requests for options endpoints
**Responsibilities**:
- Process GET requests for loading user options
- Process POST requests for saving user options
- Validate user ID matches authenticated user
- Return appropriate HTTP status codes and response bodies
- Handle error scenarios with proper error messages

**Interface**:
```csharp
[ApiController]
[Route("api/users/{userId}/options")]
public class OptionsController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<LoadOptionsResponse>> GetUserOptions(string userId);
    
    [HttpPost]
    public async Task<ActionResult> SaveUserOptions(string userId, SaveOptionsRequest request);
}
```

### 4. Storage Service (Services/InMemoryStorageService.cs)
**Purpose**: Manage in-memory data persistence
**Responsibilities**:
- Store user options in memory using ConcurrentDictionary
- Retrieve user options by user ID
- Handle data serialization and validation
- Provide thread-safe operations for concurrent requests

**Interface**:
```csharp
public interface IStorageService
{
    Task<Option[]?> GetUserOptionsAsync(string userId);
    Task SaveUserOptionsAsync(string userId, Option[] options);
    Task ClearUserOptionsAsync(string userId);
}
```

### 5. Mock Authentication Service (Services/MockAuthService.cs)
**Purpose**: Handle mock Firebase authentication without external dependencies
**Responsibilities**:
- Validate mock Firebase ID tokens
- Extract user information from tokens
- Handle authentication errors and edge cases
- Manage mock user accounts for testing

**Interface**:
```csharp
public interface IAuthService
{
    Task<MockUser?> ValidateTokenAsync(string token);
    Task<bool> IsTokenValidForUserAsync(string token, string userId);
    Task<string> CreateTokenAsync(string userId, string email);
    Task<MockUser?> AuthenticateUserAsync(string email, string password);
}
```

### 6. Mock Token Service (Services/MockTokenService.cs)
**Purpose**: Generate and validate JWT tokens for mock authentication
**Responsibilities**:
- Generate JWT tokens with Firebase-like structure
- Validate token signatures and expiration
- Extract claims from tokens
- Handle token refresh scenarios

**Interface**:
```csharp
public interface ITokenService
{
    string GenerateToken(string userId, string email, TimeSpan? expiry = null);
    Task<TokenValidationResult> ValidateTokenAsync(string token);
    string ExtractUserIdFromToken(string token);
}
```

### 7. Auth Controller (Controllers/AuthController.cs)
**Purpose**: Handle authentication endpoints for mock Firebase auth
**Responsibilities**:
- Process login requests with email/password
- Generate and return mock Firebase tokens
- Handle user registration for testing
- Provide token refresh endpoints

**Interface**:
```csharp
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request);
    
    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register(RegisterRequest request);
    
    [HttpPost("refresh")]
    public async Task<ActionResult<LoginResponse>> RefreshToken(RefreshTokenRequest request);
}
```

## Data Models

### Option Model
```csharp
public class Option
{
    public string Key { get; set; } = string.Empty;        // Unique identifier for the option
    public string Value { get; set; } = string.Empty;      // Display text for the option
    public int Sequence { get; set; }                      // Order/position of the option
}
```

### API Request/Response Models
```csharp
public class LoadOptionsResponse
{
    public Option[] Options { get; set; } = Array.Empty<Option>();
    public string LastModified { get; set; } = string.Empty;  // ISO timestamp
}

public class SaveOptionsRequest
{
    public Option[] Options { get; set; } = Array.Empty<Option>();
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string IdToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public string LocalId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class ErrorResponse
{
    public string Error { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public object? Details { get; set; }
}
```

### Storage Model
```csharp
public class UserOptionsData
{
    public Option[] Options { get; set; } = Array.Empty<Option>();
    public DateTime LastModified { get; set; }
    public string UserId { get; set; } = string.Empty;
}

public class MockUser
{
    public string Uid { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool EmailVerified { get; set; } = true;
}

public class TokenValidationResult
{
    public bool IsValid { get; set; }
    public string? UserId { get; set; }
    public string? Email { get; set; }
    public string? ErrorMessage { get; set; }
}
```

## Error Handling

### Authentication Errors
- **401 Unauthorized**: Missing or invalid Bearer token
- **403 Forbidden**: Valid token but user ID mismatch
- **401 Unauthorized**: Expired or malformed token

### Validation Errors
- **400 Bad Request**: Invalid option data structure
- **400 Bad Request**: Missing required fields
- **400 Bad Request**: Duplicate option keys

### Server Errors
- **500 Internal Server Error**: Unexpected server errors
- **503 Service Unavailable**: Service temporarily unavailable

### Error Response Format
```typescript
{
  "error": "VALIDATION_ERROR",
  "message": "Some of your options have invalid data",
  "details": {
    "field": "sequence",
    "value": "invalid",
    "expected": "number"
  }
}
```

## Testing Strategy

### Unit Tests
- **Authentication Middleware**: Token validation, error scenarios
- **Options Controller**: Request handling, response formatting
- **Storage Service**: Data persistence, retrieval operations
- **Validation Middleware**: Data validation rules

### Integration Tests
- **API Endpoints**: Full request/response cycle testing
- **Authentication Flow**: End-to-end token validation
- **Error Scenarios**: Various failure modes and error responses

### Test Tools
- **xUnit**: Test runner and assertion library
- **Microsoft.AspNetCore.Mvc.Testing**: Integration testing for Web API
- **Moq**: Mocking framework for unit tests
- **FirebaseAdmin**: Mock Firebase authentication

### Docker Testing
- **Container Build**: Verify Docker image builds successfully
- **Service Startup**: Confirm service starts and responds to health checks
- **Network Connectivity**: Test API accessibility from external containers

## Configuration

### appsettings.json
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "Firebase": {
    "ProjectId": "myauth-1569840907611"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:51235", "http://localhost:3000"]
  },
  "AllowedHosts": "*"
}
```

### Environment Variables
```bash
ASPNETCORE_ENVIRONMENT=Development     # Environment mode
ASPNETCORE_URLS=http://+:3001         # Server URLs and port
FIREBASE_PROJECT_ID=myauth-1569840907611  # Firebase project ID
CORS_ORIGINS=http://localhost:51235    # Allowed CORS origins
```

### Docker Configuration
- **Base Image**: mcr.microsoft.com/dotnet/aspnet:8.0 for runtime
- **Build Image**: mcr.microsoft.com/dotnet/sdk:8.0 for compilation
- **Multi-stage Build**: Separate build and runtime stages
- **Port Exposure**: Configurable port (default 3001)
- **Health Check**: HTTP endpoint for container health monitoring

### Mock Firebase Setup
- Use System.IdentityModel.Tokens.Jwt for JWT token generation and validation
- Create Firebase-compatible token structure with standard claims
- Pre-populate mock users for testing (configurable via appsettings)
- Support standard Firebase authentication flows without external dependencies
- Generate tokens that match Firebase ID token format for frontend compatibility

### Default Mock Users
```json
{
  "MockUsers": [
    {
      "uid": "mock-user-1",
      "email": "test@example.com",
      "displayName": "Test User",
      "password": "password123"
    },
    {
      "uid": "mock-user-2", 
      "email": "demo@example.com",
      "displayName": "Demo User",
      "password": "demo123"
    }
  ]
}
```