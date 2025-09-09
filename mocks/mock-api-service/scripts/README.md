# Mock API Service Scripts

This directory contains deployment and testing scripts for the Mock API Service. These scripts provide comprehensive automation for building, deploying, testing, and managing the mock API service.

## Quick Start

### Windows (Command Prompt)
```cmd
# Deploy the service
run.bat deploy

# Run API tests
run.bat test

# Run integration tests with frontend
run.bat integration
```

### Windows (PowerShell)
```powershell
# Deploy the service
.\run.ps1 deploy

# Run API tests
.\run.ps1 test

# Run integration tests with frontend
.\run.ps1 integration
```

## Available Scripts

### Main Script Runner (`run.bat` / `run.ps1`)
Central script that provides easy access to all deployment and testing functionality.

**Commands:**
- `deploy` - Deploy the Mock API Service
- `test` - Run API endpoint tests
- `integration` - Run integration tests with frontend
- `build` - Build Docker image only
- `start` - Start services using docker-compose
- `stop` - Stop services
- `logs` - View service logs
- `status` - Show service status and health
- `clean` - Clean up Docker resources

### Deployment Scripts

#### `deploy.bat` / `deploy.ps1`
Comprehensive deployment script that builds and starts the Mock API Service.

**Options:**
- `--env ENVIRONMENT` - Set environment (development/production)
- `--build-only` - Only build the Docker image, don't start services
- `--clean` - Clean up existing containers and images before building

**Examples:**
```cmd
# Deploy in development mode (default)
scripts\deploy.bat

# Deploy in production mode
scripts\deploy.bat --env production

# Clean build and deploy
scripts\deploy.bat --clean --env production

# Build only (don't start services)
scripts\deploy.bat --build-only
```

### Testing Scripts

#### `test-api.bat` / `test-api.ps1`
API endpoint testing script that validates all Mock API Service endpoints.

**Options:**
- `--integration` - Run integration tests with frontend
- `--verbose` - Show detailed response output
- `--url URL` - Set custom API base URL

**Tests Performed:**
1. Health check endpoint
2. User authentication (login)
3. User registration
4. Options retrieval (authenticated)
5. Options saving (authenticated)
6. Unauthorized access handling
7. CORS configuration (with --integration)

**Examples:**
```cmd
# Run basic API tests
scripts\test-api.bat

# Run with integration tests
scripts\test-api.bat --integration

# Run with verbose output
scripts\test-api.bat --verbose

# Test different API URL
scripts\test-api.bat --url http://localhost:8080
```

#### `integration-test.bat` / `integration-test.ps1`
Full integration testing script that tests the Mock API Service with the frontend application.

**Options:**
- `--api-url URL` - Set API base URL
- `--frontend-url URL` - Set frontend URL
- `--frontend-dir DIR` - Set frontend directory path
- `--timeout SECONDS` - Set startup timeout
- `--no-cleanup` - Don't cleanup services after testing

**Integration Test Process:**
1. Starts Mock API Service using docker-compose
2. Configures frontend environment variables
3. Installs frontend dependencies (if needed)
4. Starts frontend development server
5. Runs comprehensive API tests
6. Tests CORS configuration
7. Validates authentication flow
8. Provides manual testing instructions
9. Cleans up services (unless --no-cleanup specified)

**Examples:**
```cmd
# Run full integration tests
scripts\integration-test.bat

# Keep services running after tests
scripts\integration-test.bat --no-cleanup

# Use custom frontend directory
scripts\integration-test.bat --frontend-dir "C:\path\to\frontend"

# Increase startup timeout
scripts\integration-test.bat --timeout 60
```

## Prerequisites

### Required Software
- **Docker** - For containerization and deployment
- **Docker Compose** - For multi-container orchestration
- **curl** - For API testing (usually included with Windows 10+)
- **Node.js & npm** - For frontend integration testing

### Verification Commands
```cmd
# Check Docker
docker --version

# Check Docker Compose
docker-compose --version

# Check curl
curl --version

# Check Node.js
node --version
npm --version
```

## Environment Configuration

### API Service Configuration
The scripts automatically configure the Mock API Service with appropriate environment variables:

**Development Mode:**
- `ASPNETCORE_ENVIRONMENT=Development`
- `ASPNETCORE_URLS=http://+:3001`
- `CORS_ORIGINS=http://localhost:5173,http://localhost:3000`

**Production Mode:**
- `ASPNETCORE_ENVIRONMENT=Production`
- Enhanced security settings
- Resource limits
- Production logging configuration

### Frontend Integration
For integration testing, the scripts automatically:
1. Create `.env.local` file in frontend directory
2. Set `VITE_API_BASE_URL=http://localhost:3001`
3. Install dependencies if `node_modules` doesn't exist
4. Start development server on port 5173

## Troubleshooting

### Common Issues

#### Docker Build Failures
```cmd
# Clean Docker cache and rebuild
run.bat clean
run.bat deploy --clean
```

#### Port Conflicts
```cmd
# Check what's using port 3001
netstat -ano | findstr :3001

# Stop conflicting services
run.bat stop
```

#### Frontend Integration Issues
```cmd
# Verify frontend directory exists
dir ..\..

# Check Node.js installation
node --version

# Manual frontend setup
cd ..\..
npm install
npm run dev
```

#### API Not Responding
```cmd
# Check service status
run.bat status

# View service logs
run.bat logs

# Restart services
run.bat stop
run.bat start
```

### Debug Mode
For detailed debugging, use the `--verbose` flag with test scripts:
```cmd
scripts\test-api.bat --verbose
```

### Manual Testing
After running integration tests, you can manually test:

1. **Frontend URL:** http://localhost:5173
2. **API Health:** http://localhost:3001/health
3. **Test Credentials:**
   - Email: test@example.com
   - Password: password123

## Script Architecture

### Error Handling
All scripts include comprehensive error handling:
- Exit codes for automation integration
- Detailed error messages
- Automatic cleanup on failures
- Timeout handling for service startup

### Cross-Platform Support
Scripts are provided in both batch (.bat) and PowerShell (.ps1) formats:
- **Batch scripts** - Compatible with Command Prompt
- **PowerShell scripts** - Enhanced features and better error handling

### Modular Design
Scripts are designed to be:
- **Composable** - Can be called individually or through main runner
- **Configurable** - Support command-line options
- **Reusable** - Work in different environments and CI/CD pipelines

## CI/CD Integration

These scripts can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Deploy Mock API
  run: scripts/deploy.bat --env production

- name: Run API Tests
  run: scripts/test-api.bat --integration

- name: Run Integration Tests
  run: scripts/integration-test.bat --no-cleanup
```

## Support

For issues with the scripts:
1. Check the troubleshooting section above
2. Run with `--verbose` flag for detailed output
3. Check service logs with `run.bat logs`
4. Verify prerequisites are installed correctly