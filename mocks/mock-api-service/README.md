# Mock API Service

A .NET 8 Web API that provides backend functionality for The Wheel application, including Firebase-compatible authentication and user options persistence.

## 🚀 Quick Start

### Development Environment
```bash
# Start the service in development mode
docker-compose up -d

# View logs
docker-compose logs -f mock-api

# Stop the service
docker-compose down
```

### Production Environment
```bash
# Start the service in production mode
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f mock-api

# Stop the service
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## 📚 Documentation

- **[Quick Start Guide](docs/quick-start.md)** - Get up and running in 2 minutes
- **[Complete API Documentation](docs/api-documentation.md)** - Full API reference with examples
- **[Deployment Guide](docs/deployment-guide.md)** - Comprehensive deployment instructions
- **[Error Handling Guide](docs/error-handling.md)** - Error simulation and troubleshooting

## Configuration Files

### docker-compose.yml
Base configuration file with common settings for all environments.

### docker-compose.override.yml
Development-specific overrides that are automatically applied when running `docker-compose up`.

### docker-compose.prod.yml
Production-specific configuration with security and performance optimizations.

## Environment Variables

The following environment variables can be configured:

| Variable | Default | Description |
|----------|---------|-------------|
| `FIREBASE_PROJECT_ID` | `myauth-1569840907611` | Firebase project ID for authentication |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000,http://localhost:51235` | Comma-separated list of allowed CORS origins |
| `ASPNETCORE_ENVIRONMENT` | `Development` | ASP.NET Core environment (Development/Production) |

### Setting Environment Variables

Create a `.env` file in this directory:

```bash
# .env file
FIREBASE_PROJECT_ID=your-firebase-project-id
CORS_ORIGINS=http://localhost:5173,https://your-frontend-domain.com
```

## Service Endpoints

Once running, the service will be available at:

- **Base URL**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/health`
- **Authentication**: `http://localhost:3001/api/auth/login`
- **Options API**: `http://localhost:3001/api/users/{userId}/options`

## Integration with Frontend

To use this mock API service with The Wheel frontend application:

1. Set the `VITE_API_BASE_URL` environment variable in your frontend to `http://localhost:3001`
2. Start both services using the root docker-compose.yml file:

```bash
# From the project root directory
docker-compose up -d
```

This will start both the frontend and mock API service with proper networking configured.

## Troubleshooting

### Service Won't Start
- Check if port 3001 is already in use: `netstat -an | grep 3001`
- View container logs: `docker-compose logs mock-api`

### CORS Issues
- Verify the `CORS_ORIGINS` environment variable includes your frontend URL
- Check the browser developer console for specific CORS error messages

### Authentication Issues
- Ensure the `FIREBASE_PROJECT_ID` matches your frontend configuration
- Check that the mock users are properly configured in appsettings.json

### Health Check Failures
- The service includes a health check endpoint at `/health`
- Health check failures may indicate the service is not starting properly
- Check logs for startup errors

## Development

For development with hot reload:

1. Uncomment the volume mounts in `docker-compose.override.yml`
2. Use `dotnet watch` in the container for automatic rebuilds

## Production Deployment

For production deployment:

1. Use the production compose file: `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
2. Configure appropriate CORS origins for your production domain
3. Set up proper logging and monitoring
4. Consider using a reverse proxy (nginx/traefik) for SSL termination