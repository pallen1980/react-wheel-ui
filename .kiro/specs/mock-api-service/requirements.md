# Requirements Document

## Introduction

This document outlines the requirements for creating a mock API service that provides backend functionality for The Wheel application. The mock API will handle user options persistence, authentication validation, and provide realistic responses that match the expected API contract. The service will be containerized using Docker and designed to replace the external API dependency during development and testing.

## Requirements

### Requirement 1

**User Story:** As a developer, I want a mock API service that handles user options persistence, so that I can develop and test The Wheel application without depending on external services.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/users/{userId}/options` with valid authentication THEN the system SHALL return a JSON response with user options in the format `{ options: Option[], lastModified: string }`
2. WHEN a GET request is made to `/api/users/{userId}/options` for a user with no saved options THEN the system SHALL return HTTP 404 status
3. WHEN a POST request is made to `/api/users/{userId}/options` with valid authentication and option data THEN the system SHALL save the options and return HTTP 200 status
4. WHEN any request is made without valid Bearer token authentication THEN the system SHALL return HTTP 401 status with appropriate error message

### Requirement 2

**User Story:** As a developer, I want the mock API to provide complete Firebase authentication simulation, so that I can test the entire authentication flow without external dependencies.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/login` with valid email/password THEN the system SHALL return a Firebase-compatible JWT token
2. WHEN a POST request is made to `/api/auth/login` with invalid credentials THEN the system SHALL return HTTP 401 status
3. WHEN a request includes a Bearer token in the Authorization header THEN the system SHALL validate the token format and signature
4. WHEN a request includes an invalid or expired token THEN the system SHALL return HTTP 401 status
5. WHEN a request includes a valid token but for a different user than the URL parameter THEN the system SHALL return HTTP 403 status
6. WHEN a request includes a valid token matching the user ID THEN the system SHALL process the request normally

### Requirement 3

**User Story:** As a developer, I want the mock API to persist data across requests, so that I can test the full save/load cycle of wheel options.

#### Acceptance Criteria

1. WHEN options are saved for a user THEN the system SHALL store them persistently for the duration of the service runtime
2. WHEN options are loaded for a user THEN the system SHALL return the most recently saved options
3. WHEN the service is restarted THEN the system SHALL start with empty data (no permanent persistence required)
4. WHEN multiple users save options THEN the system SHALL keep each user's options separate

### Requirement 4

**User Story:** As a developer, I want the mock API to validate option data structure, so that it behaves like a real API with proper data validation.

#### Acceptance Criteria

1. WHEN option data is received THEN the system SHALL validate each option has required fields: key (string), value (string), sequence (number)
2. WHEN invalid option data is received THEN the system SHALL return HTTP 400 status with validation error details
3. WHEN empty options array is sent THEN the system SHALL accept it and clear the user's saved options
4. WHEN options array contains duplicate keys THEN the system SHALL return HTTP 400 status with appropriate error message

### Requirement 5

**User Story:** As a developer, I want the mock API service to be containerized, so that it can be easily deployed and integrated with the existing Docker setup.

#### Acceptance Criteria

1. WHEN the service is built THEN the system SHALL create a Docker image that can run independently
2. WHEN the Docker container is started THEN the system SHALL expose the API on a configurable port (default 3001)
3. WHEN the container is deployed THEN the system SHALL be accessible at the URL configured in VITE_API_BASE_URL
4. WHEN the container starts THEN the system SHALL log startup information and available endpoints

### Requirement 6

**User Story:** As a developer, I want the mock API to handle error scenarios realistically, so that I can test error handling in the frontend application.

#### Acceptance Criteria

1. WHEN network timeouts occur THEN the system SHALL simulate realistic response delays
2. WHEN server errors are needed for testing THEN the system SHALL provide endpoints to trigger 500 status responses
3. WHEN rate limiting scenarios are needed THEN the system SHALL provide configurable rate limiting responses
4. WHEN the system encounters internal errors THEN the system SHALL return appropriate HTTP status codes with error details

### Requirement 7

**User Story:** As a developer, I want the mock API to support CORS for local development, so that the frontend can communicate with it during development.

#### Acceptance Criteria

1. WHEN cross-origin requests are made from the frontend THEN the system SHALL include appropriate CORS headers
2. WHEN preflight OPTIONS requests are made THEN the system SHALL respond with allowed methods and headers
3. WHEN requests are made from localhost origins THEN the system SHALL allow them regardless of port
4. WHEN the API is accessed from the configured frontend URL THEN the system SHALL allow the requests
##
# Requirement 8

**User Story:** As a developer, I want the mock API to support user registration for testing, so that I can create test accounts without external services.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/register` with email/password/displayName THEN the system SHALL create a new mock user account
2. WHEN a registration request uses an existing email THEN the system SHALL return HTTP 409 status with appropriate error message
3. WHEN a registration request has invalid data THEN the system SHALL return HTTP 400 status with validation errors
4. WHEN registration is successful THEN the system SHALL return a Firebase-compatible JWT token for the new user

### Requirement 9

**User Story:** As a developer, I want the mock API to pre-populate test users, so that I can immediately test authentication without manual setup.

#### Acceptance Criteria

1. WHEN the service starts THEN the system SHALL load default test users from configuration
2. WHEN default users are loaded THEN the system SHALL make them available for authentication
3. WHEN configuration specifies custom test users THEN the system SHALL use those instead of defaults
4. WHEN test users are authenticated THEN the system SHALL generate valid tokens for options API access