# Mock API Service - Complete API Documentation

## Overview

The Mock API Service is a .NET 8 Web API that provides backend functionality for The Wheel application. It simulates Firebase authentication and provides user options persistence with realistic responses that match the expected API contract.

**Base URL**: `http://localhost:3001`

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [API Endpoints](#api-endpoints)
3. [Data Models](#data-models)
4. [Error Handling](#error-handling)
5. [Error Simulation](#error-simulation)
6. [Setup and Deployment](#setup-and-deployment)
7. [Testing](#testing)

## Authentication Flow

The service implements Firebase-compatible JWT authentication with the following flow:

1. **Login/Register** → Receive JWT access token and refresh token
2. **API Requests** → Include `Authorization: Bearer <access_token>` header
3. **Token Refresh** → Use refresh token to get new access token when expired

### Pre-configured Test Users

The service comes with pre-configured test users for immediate testing:

| Email | Password | User ID | Display Name |
|-------|----------|---------|--------------|
| `test@example.com` | `password123` | `mock-user-1` | Test User |
| `demo@example.com` | `demo123` | `mock-user-2` | Demo User |

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/login

Authenticate a user with email and password.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Success Response (200 OK):**
```json
{
  "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_string",
  "localId": "mock-user-1",
  "email": "test@example.com",
  "expiresIn": 3600
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password"
}
```

#### POST /api/auth/register

Register a new user account.

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "newpassword123",
  "displayName": "New User"
}
```

**Success Response (200 OK):**
```json
{
  "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_string",
  "localId": "generated-user-id",
  "email": "newuser@example.com",
  "expiresIn": 3600
}
```

**Error Response (409 Conflict):**
```json
{
  "error": "EMAIL_EXISTS",
  "message": "An account with this email already exists"
}
```

#### POST /api/auth/refresh

Refresh an expired access token using a refresh token.

**Request:**
```http
POST /api/auth/refresh
Content-Type: application/json
Authorization: Bearer <current_access_token>

{
  "refreshToken": "refresh_token_string"
}
```

**Success Response (200 OK):**
```json
{
  "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "new_refresh_token_string",
  "localId": "mock-user-1",
  "email": "test@example.com",
  "expiresIn": 3600
}
```

#### POST /api/auth/impersonate

**⚠️ Development Only**: Impersonate any user for testing purposes. This endpoint is only available when the application is running in Development environment.

**Request:**
```http
POST /api/auth/impersonate
Content-Type: application/json

{
  "userId": "mock-user-1"
}
```

**Success Response (200 OK):**
```json
{
  "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_string",
  "localId": "mock-user-1",
  "email": "test@example.com",
  "expiresIn": 3600
}
```

**Error Response (404 Not Found - Production Mode):**
```json
{
  "error": "ENDPOINT_NOT_FOUND",
  "message": "This endpoint is only available in development mode"
}
```

**Error Response (404 Not Found - User Not Found):**
```json
{
  "error": "USER_NOT_FOUND",
  "message": "User not found"
}
```

### User Management Endpoints

#### GET /api/users

Retrieve all test users.

**Request:**
```http
GET /api/users
```

**Success Response (200 OK):**
```json
[
  {
    "uid": "mock-user-1",
    "email": "test@example.com",
    "displayName": "Test User",
    "createdAt": "2024-01-01T00:00:00Z",
    "emailVerified": true,
    "isTestUser": true
  },
  {
    "uid": "mock-user-2",
    "email": "demo@example.com",
    "displayName": "Demo User",
    "createdAt": "2024-01-01T00:00:00Z",
    "emailVerified": true,
    "isTestUser": true
  }
]
```

#### GET /api/users/{id}

Retrieve a specific user by ID.

**Request:**
```http
GET /api/users/mock-user-1
```

**Success Response (200 OK):**
```json
{
  "uid": "mock-user-1",
  "email": "test@example.com",
  "displayName": "Test User",
  "createdAt": "2024-01-01T00:00:00Z",
  "emailVerified": true,
  "isTestUser": true
}
```

#### POST /api/users

Create a new test user.

**Request:**
```http
POST /api/users
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "displayName": "New User"
}
```

**Success Response (201 Created):**
```json
{
  "uid": "generated-user-id",
  "email": "newuser@example.com",
  "displayName": "New User",
  "createdAt": "2024-01-01T00:00:00Z",
  "emailVerified": true,
  "isTestUser": true
}
```

#### PUT /api/users/{id}

Update an existing user.

**Request:**
```http
PUT /api/users/mock-user-1
Content-Type: application/json

{
  "displayName": "Updated Name",
  "email": "updated@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "uid": "mock-user-1",
  "email": "updated@example.com",
  "displayName": "Updated Name",
  "createdAt": "2024-01-01T00:00:00Z",
  "emailVerified": true,
  "isTestUser": true
}
```

#### DELETE /api/users/{id}

Delete a user.

**Request:**
```http
DELETE /api/users/mock-user-1
```

**Success Response (204 No Content)**

### Options Management Endpoints

#### GET /api/users/{userId}/options

Retrieve saved options for a specific user.

**Request:**
```http
GET /api/users/mock-user-1/options
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "options": [
    {
      "key": "option1",
      "value": "Pizza",
      "sequence": 1
    },
    {
      "key": "option2", 
      "value": "Burger",
      "sequence": 2
    }
  ],
  "lastModified": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "NOT_FOUND",
  "message": "No options found for user mock-user-1"
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "FORBIDDEN",
  "message": "Access denied"
}
```

#### POST /api/users/{userId}/options

Save options for a specific user.

**Request:**
```http
POST /api/users/mock-user-1/options
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "options": [
    {
      "key": "option1",
      "value": "Pizza",
      "sequence": 1
    },
    {
      "key": "option2",
      "value": "Burger", 
      "sequence": 2
    }
  ]
}
```

**Success Response (200 OK):**
```http
HTTP/1.1 200 OK
```

**Error Response (400 Bad Request):**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid option data",
  "details": {
    "field": "sequence",
    "value": "invalid",
    "expected": "number"
  }
}
```

### Error Simulation Endpoints

These endpoints allow testing various error scenarios.

#### POST /api/error-simulation/enable

Enable error simulation mode.

**Request:**
```http
POST /api/error-simulation/enable
```

**Response (200 OK):**
```json
{
  "message": "Error simulation enabled"
}
```

#### POST /api/error-simulation/disable

Disable error simulation mode.

**Request:**
```http
POST /api/error-simulation/disable
```

**Response (200 OK):**
```json
{
  "message": "Error simulation disabled"
}
```

#### POST /api/error-simulation/configure

Configure specific errors for endpoints.

**Request:**
```http
POST /api/error-simulation/configure
Content-Type: application/json

{
  "endpoint": "/api/users/mock-user-1/options",
  "errorType": "TIMEOUT",
  "delayMs": 5000
}
```

**Supported Error Types:**
- `TIMEOUT`
- `AUTHENTICATION_ERROR`
- `AUTHORIZATION_ERROR`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMIT`
- `SERVICE_UNAVAILABLE`
- `INTERNAL_SERVER_ERROR`

#### DELETE /api/error-simulation/clear

Clear all error configurations.

**Request:**
```http
DELETE /api/error-simulation/clear
```

#### POST /api/error-simulation/trigger/{errorType}

Manually trigger a specific error type.

**Request:**
```http
POST /api/error-simulation/trigger/TIMEOUT
```

## Data Models

### Option
```typescript
interface Option {
  key: string;      // Unique identifier for the option
  value: string;    // Display text for the option  
  sequence: number; // Order/position of the option
}
```

### LoginRequest
```typescript
interface LoginRequest {
  email: string;    // Valid email address
  password: string; // User password
}
```

### RegisterRequest
```typescript
interface RegisterRequest {
  email: string;       // Valid email address
  password: string;    // Minimum 6 characters
  displayName: string; // User's display name
}
```

### LoginResponse
```typescript
interface LoginResponse {
  idToken: string;     // JWT access token
  refreshToken: string; // Refresh token for token renewal
  localId: string;     // User ID
  email: string;       // User email
  expiresIn: number;   // Token expiration in seconds
}
```

### LoadOptionsResponse
```typescript
interface LoadOptionsResponse {
  options: Option[];    // Array of user options
  lastModified: string; // ISO 8601 timestamp
}
```

### SaveOptionsRequest
```typescript
interface SaveOptionsRequest {
  options: Option[]; // Array of options to save
}
```

### ErrorResponse
```typescript
interface ErrorResponse {
  error: string;    // Error code
  message: string;  // Human-readable error message
  details?: any;    // Optional additional error details
}
```

## Error Handling

The API uses standard HTTP status codes and returns consistent error responses:

### HTTP Status Codes

| Code | Description | When Used |
|------|-------------|-----------|
| 200 | OK | Successful requests |
| 400 | Bad Request | Invalid request data or validation errors |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists (e.g., email in use) |
| 429 | Too Many Requests | Rate limiting (includes Retry-After header) |
| 500 | Internal Server Error | Unexpected server errors |
| 503 | Service Unavailable | Service temporarily unavailable |

### Common Error Codes

| Error Code | Description |
|------------|-------------|
| `INVALID_CREDENTIALS` | Invalid email or password |
| `EMAIL_EXISTS` | Email already registered |
| `VALIDATION_ERROR` | Request data validation failed |
| `NOT_FOUND` | Requested resource not found |
| `FORBIDDEN` | Access denied |
| `INVALID_REFRESH_TOKEN` | Refresh token is invalid or expired |
| `INTERNAL_SERVER_ERROR` | Unexpected server error |

## Error Simulation

The service includes comprehensive error simulation capabilities for testing error handling in frontend applications.

### Enabling Error Simulation

1. **Via API**: Use the error simulation endpoints
2. **Via Environment**: Set `ERROR_SIMULATION_ENABLED=true`

### Configuring Errors

Configure specific errors for endpoints:

```bash
# Enable error simulation
curl -X POST http://localhost:3001/api/error-simulation/enable

# Configure timeout for options endpoint
curl -X POST http://localhost:3001/api/error-simulation/configure \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/api/users/mock-user-1/options",
    "errorType": "TIMEOUT", 
    "delayMs": 5000
  }'
```

### Testing Error Scenarios

```bash
# Test authentication error
curl -X POST http://localhost:3001/api/error-simulation/trigger/AUTHENTICATION_ERROR

# Test validation error  
curl -X POST http://localhost:3001/api/error-simulation/trigger/VALIDATION_ERROR

# Test server error
curl -X POST http://localhost:3001/api/error-simulation/trigger/INTERNAL_SERVER_ERROR
```

## Setup and Deployment

### Prerequisites

- .NET 8.0 SDK
- Docker (for containerized deployment)

### Local Development

#### 1. Clone and Build

```bash
cd mocks/mock-api-service
dotnet restore
dotnet build
```

#### 2. Run Locally

```bash
dotnet run
```

The service will be available at `http://localhost:3001`.

#### 3. Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```bash
FIREBASE_PROJECT_ID=your-firebase-project-id
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
ASPNETCORE_ENVIRONMENT=Development
```

### Docker Deployment

#### 1. Using Docker Compose (Recommended)

**Development:**
```bash
docker-compose up -d
```

**Production:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

#### 2. Using Docker Build Scripts

**Windows:**
```bash
# Build and run
build-docker.bat

# Or using PowerShell
.\build-docker.ps1
```

**Manual Docker Commands:**
```bash
# Build image
docker build -t mock-api-service .

# Run container
docker run -d -p 3001:3001 --name mock-api-service mock-api-service
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FIREBASE_PROJECT_ID` | `myauth-1569840907611` | Firebase project ID |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed CORS origins |
| `ASPNETCORE_ENVIRONMENT` | `Development` | Environment mode |
| `ASPNETCORE_HTTP_PORTS` | `3001` | HTTP port |
| `ERROR_SIMULATION_ENABLED` | `false` | Enable error simulation |

### Integration with Frontend

To integrate with The Wheel frontend:

1. **Set Frontend Environment Variable:**
   ```bash
   VITE_API_BASE_URL=http://localhost:3001
   ```

2. **Start Both Services:**
   ```bash
   # From project root
   docker-compose up -d
   ```

3. **Verify Connection:**
   ```bash
   curl http://localhost:3001/health
   ```

### Health Checks

The service includes health check endpoints:

- **Health Check**: `GET /health`
- **Ready Check**: `GET /ready`

Example health check response:
```json
{
  "status": "Healthy",
  "totalDuration": "00:00:00.0010000",
  "entries": {
    "self": {
      "data": {},
      "duration": "00:00:00.0000000",
      "status": "Healthy"
    }
  }
}
```

## Testing

### Manual Testing with curl

#### Authentication Flow
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Save the token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get options (should return 404 initially)
curl -X GET http://localhost:3001/api/users/mock-user-1/options \
  -H "Authorization: Bearer $TOKEN"

# Save options
curl -X POST http://localhost:3001/api/users/mock-user-1/options \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "options": [
      {"key":"opt1","value":"Pizza","sequence":1},
      {"key":"opt2","value":"Burger","sequence":2}
    ]
  }'

# Get options again (should return saved options)
curl -X GET http://localhost:3001/api/users/mock-user-1/options \
  -H "Authorization: Bearer $TOKEN"
```

#### Error Testing
```bash
# Test invalid credentials
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@example.com","password":"wrong"}'

# Test unauthorized access
curl -X GET http://localhost:3001/api/users/mock-user-1/options

# Test user mismatch
curl -X GET http://localhost:3001/api/users/different-user/options \
  -H "Authorization: Bearer $TOKEN"
```

### Using HTTP Files

The service includes `MockApiService.http` file for testing with REST clients:

```http
### Login
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}

### Get Options
GET http://localhost:3001/api/users/mock-user-1/options
Authorization: Bearer {{token}}

### Save Options
POST http://localhost:3001/api/users/mock-user-1/options
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "options": [
    {"key": "opt1", "value": "Pizza", "sequence": 1},
    {"key": "opt2", "value": "Burger", "sequence": 2}
  ]
}
```

### Automated Testing

The service includes comprehensive unit and integration tests:

```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test category
dotnet test --filter Category=Integration
```

### Performance Testing

Test the service under load:

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:3001/health

# Using curl in a loop
for i in {1..100}; do
  curl -s http://localhost:3001/health > /dev/null
  echo "Request $i completed"
done
```

## Troubleshooting

### Common Issues

#### Service Won't Start
- **Check port availability**: `netstat -an | findstr 3001`
- **View logs**: `docker-compose logs mock-api`
- **Check configuration**: Verify `.env` file and appsettings.json

#### CORS Issues
- **Verify origins**: Check `CORS_ORIGINS` environment variable
- **Browser console**: Look for specific CORS error messages
- **Preflight requests**: Ensure OPTIONS requests are handled

#### Authentication Issues
- **Token format**: Ensure Bearer token format is correct
- **Token expiration**: Check if token has expired (default 1 hour)
- **User ID mismatch**: Verify user ID in URL matches token

#### Database/Storage Issues
- **In-memory storage**: Data is lost on service restart
- **Concurrent access**: Service handles concurrent requests safely
- **Data validation**: Check option data structure

### Debug Mode

Enable debug logging:

```bash
# Environment variable
Logging__LogLevel__MockApiService=Debug

# Or in appsettings.Development.json
{
  "Logging": {
    "LogLevel": {
      "MockApiService": "Debug"
    }
  }
}
```

### Monitoring

Monitor service health:

```bash
# Health check
curl http://localhost:3001/health

# Application metrics (if enabled)
curl http://localhost:3001/metrics

# Docker container stats
docker stats mock-api-service
```

## API Contract Compatibility

This mock service is designed to be compatible with Firebase Authentication and provides the exact API contract expected by The Wheel frontend application. The JWT tokens generated are Firebase-compatible and include standard claims for seamless integration.

### Firebase Compatibility

- **Token Structure**: JWT tokens with Firebase-compatible claims
- **Authentication Flow**: Matches Firebase Auth REST API
- **Error Responses**: Compatible error codes and messages
- **User Management**: Supports registration, login, and token refresh

### Frontend Integration

The service is designed to be a drop-in replacement for Firebase services during development and testing, requiring only a change in the `VITE_API_BASE_URL` environment variable.