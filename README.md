# The Wheel - React Application

A React-based web application featuring a spinner/wheel component with Firebase authentication integration, including a comprehensive development environment with mock services and user management tools.

## Services Overview

This project includes multiple services for development and testing:

- **Main Application** (Port 5173/51235): The primary React application
- **Mock API Service** (Port 3001): Backend API simulation for development
- **User Management UI** (Port 3002): Web interface for managing test users

## Quick Start

### Development Mode
```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
```

### Docker Deployment (All Services)
```bash
# Windows
setup\run-docker.bat

# PowerShell/Linux
setup\run-docker.ps1

# Manual Docker Compose
docker-compose up -d
```

For detailed environment configuration, see **[Setup Guide](./docs/setup.md)**.

## Documentation

Comprehensive documentation is available in the [docs](./docs/) folder:

- **[Getting Started](./docs/setup.md)** - Setup, configuration, and overview
- **[Authentication](./docs/Auth/)** - Firebase auth integration and usage
- **[Services](./docs/services/)** - API services and data layer
- **[State Management](./docs/store/)** - Redux store and async thunks
- **[Components](./docs/Areas/)** - Feature-based component architecture

## Access Points

When running with Docker:

- **Main Application**: http://localhost:51235
- **Mock API Service**: http://localhost:3001
- **User Management UI**: http://localhost:3002

## Development Tools

### Deployment Scripts
- `setup/run-docker.bat` - Windows batch deployment
- `setup/run-docker.ps1` - PowerShell deployment with advanced options
- `setup/integration-test.bat` - Windows integration testing
- `setup/integration-test.ps1` - PowerShell integration testing
- `setup/health-check.ps1` - Service health monitoring

### Docker Configurations
- `docker-compose.yml` - Main service configuration
- `docker-compose.override.yml` - Development overrides
- `docker-compose.prod.yml` - Production configuration

## Setup & Deployment

- **[Setup Guide](./docs/setup.md)** - Environment configuration and Docker deployment
- **[User Management UI](./mocks/mock-user-ui/README.md)** - Test user management interface 