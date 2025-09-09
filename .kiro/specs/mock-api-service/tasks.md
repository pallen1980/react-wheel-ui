# Implementation Plan

- [x] 1. Set up project structure and core configuration
  - Create mocks/mock-api-service directory structure
  - Initialize .NET 8 Web API project with required NuGet packages
  - Configure appsettings.json with Firebase project settings and mock users
  - Set up dependency injection container and service registration
  - _Requirements: 5.1, 5.2, 9.1, 9.2_

- [X] 2. Implement core data models and interfaces
  - [x] 2.1 Create Option model matching frontend interface
    - Define Option class with Key, Value, and Sequence properties
    - Add data annotations for validation
    - _Requirements: 4.1, 4.2_

  - [x] 2.2 Create authentication models and DTOs
    - Implement MockUser, LoginRequest, LoginResponse models
    - Create TokenValidationResult and error response models
    - Add RegisterRequest and RefreshTokenRequest models
    - _Requirements: 2.1, 8.1, 8.2_

  - [x] 2.3 Define service interfaces
    - Create IAuthService interface for authentication operations
    - Define ITokenService interface for JWT token management
    - Implement IStorageService interface for data persistence
    - _Requirements: 2.3, 3.1, 3.2_

- [X] 3. Implement mock authentication services
  - [x] 3.1 Create MockTokenService for JWT operations
    - Implement JWT token generation with Firebase-compatible claims
    - Add token validation with signature verification
    - Include token expiration and refresh logic
    - _Requirements: 2.1, 2.4, 2.6_

  - [x] 3.2 Implement MockAuthService for user authentication
    - Create user authentication with email/password validation
    - Implement password hashing and verification
    - Add user registration and management functionality
    - Load default test users from configuration
    - _Requirements: 2.1, 2.2, 8.1, 9.1, 9.4_

- [X] 4. Create authentication middleware and controllers
  - [x] 4.1 Implement MockFirebaseAuthMiddleware
    - Extract Bearer tokens from Authorization headers
    - Validate tokens using MockTokenService
    - Set user context for authenticated requests
    - Handle authentication errors with appropriate HTTP status codes
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

  - [x] 4.2 Create AuthController for authentication endpoints
    - Implement POST /api/auth/login endpoint
    - Add POST /api/auth/register endpoint
    - Create POST /api/auth/refresh endpoint for token refresh
    - Handle authentication errors and validation
    - _Requirements: 2.1, 2.2, 8.1, 8.2, 8.3, 8.4_

- [X] 5. Implement data storage and options management
  - [x] 5.1 Create InMemoryStorageService
    - Implement thread-safe in-memory storage using ConcurrentDictionary
    - Add methods for saving and retrieving user options
    - Include data validation and error handling
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 5.2 Implement OptionsController
    - Create GET /api/users/{userId}/options endpoint
    - Add POST /api/users/{userId}/options endpoint
    - Validate user ID matches authenticated user
    - Handle 404 responses for users with no saved options
    - _Requirements: 1.1, 1.2, 1.3, 2.5, 2.6_

- [ ] 6. Add request validation and error handling
  - [ ] 6.1 Implement option data validation
    - Validate required fields (key, value, sequence) in options
    - Check for duplicate keys in options arrays
    - Return appropriate validation error messages
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ] 6.2 Create comprehensive error handling
    - Implement global exception handling middleware
    - Add specific error responses for authentication failures
    - Create error responses for validation failures
    - Handle server errors with appropriate status codes
    - _Requirements: 1.4, 2.2, 6.1, 6.2, 6.3, 6.4_

- [ ] 7. Configure CORS and middleware pipeline
  - [ ] 7.1 Set up CORS configuration
    - Configure CORS to allow requests from frontend origins
    - Handle preflight OPTIONS requests
    - Allow localhost origins for development
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 7.2 Configure middleware pipeline in Program.cs
    - Set up authentication middleware before controllers
    - Add CORS middleware with proper configuration
    - Configure JSON serialization and request parsing
    - Add logging and error handling middleware
    - _Requirements: 5.3, 7.1_

- [ ] 8. Create Docker containerization
  - [ ] 8.1 Write Dockerfile with multi-stage build
    - Use mcr.microsoft.com/dotnet/sdk:8.0 for build stage
    - Use mcr.microsoft.com/dotnet/aspnet:8.0 for runtime
    - Configure port exposure and environment variables
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ] 8.2 Add docker-compose configuration
    - Create docker-compose.yml for easy local deployment
    - Configure environment variables and port mapping
    - Set up networking for frontend integration
    - _Requirements: 5.3, 5.4_

- [ ] 9. Write comprehensive tests
  - [ ] 9.1 Create unit tests for services
    - Test MockTokenService JWT generation and validation
    - Test MockAuthService authentication logic
    - Test InMemoryStorageService data operations
    - _Requirements: 2.1, 2.4, 3.1, 3.2_

  - [ ] 9.2 Write integration tests for API endpoints
    - Test authentication endpoints with valid/invalid credentials
    - Test options endpoints with authentication scenarios
    - Test CORS functionality and error handling
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 7.1_

- [ ] 10. Add documentation and deployment scripts
  - [ ] 10.1 Create API documentation
    - Document all endpoints with request/response examples
    - Include authentication flow documentation
    - Add setup and deployment instructions
    - _Requirements: 5.4_

  - [ ] 10.2 Create deployment and testing scripts
    - Add scripts for building and running Docker containers
    - Create scripts for testing API endpoints
    - Include integration testing with frontend application
    - _Requirements: 5.2, 5.3, 5.4_