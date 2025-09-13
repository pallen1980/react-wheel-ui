# Mock API Service - Deployment Guide

## Overview

This guide covers different deployment scenarios for the Mock API Service, from local development to production-ready deployments.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Monitoring and Health Checks](#monitoring-and-health-checks)
6. [Troubleshooting](#troubleshooting)

## Local Development

### Prerequisites

- .NET 8.0 SDK
- Git

### Setup Steps

1. **Clone and Navigate**
   ```bash
   cd mocks/mock-api-service
   ```

2. **Restore Dependencies**
   ```bash
   dotnet restore
   ```

3. **Build Project**
   ```bash
   dotnet build
   ```

4. **Run Development Server**
   ```bash
   dotnet run
   ```

5. **Verify Service**
   ```bash
   curl http://localhost:3001/health
   ```

### Development Configuration

Create `appsettings.Development.json` for local overrides:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "MockApiService": "Debug"
    }
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:51235",
      "http://localhost:3000",
      "http://localhost:4173"
    ]
  }
}
```

### Hot Reload Development

For automatic rebuilds during development:

```bash
dotnet watch run
```

## Docker Deployment

### Prerequisites

- Docker
- Docker Compose

### Quick Start

1. **Development Mode**
   ```bash
   cd mocks/mock-api-service
   docker-compose up -d
   ```

2. **View Logs**
   ```bash
   docker-compose logs -f mock-api
   ```

3. **Stop Service**
   ```bash
   docker-compose down
   ```

### Docker Compose Configurations

#### Development (docker-compose.yml + docker-compose.override.yml)

Automatically used when running `docker-compose up`:

```yaml
# docker-compose.override.yml
version: '3.8'
services:
  mock-api:
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - Logging__LogLevel__MockApiService=Debug
    volumes:
      # Uncomment for hot reload development
      # - .:/app
    ports:
      - "3001:3001"
```

#### Production (docker-compose.prod.yml)

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  mock-api:
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - Logging__LogLevel__Default=Warning
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Manual Docker Commands

1. **Build Image**
   ```bash
   docker build -t mock-api-service .
   ```

2. **Run Container**
   ```bash
   docker run -d \
     --name mock-api-service \
     -p 3001:3001 \
     -e ASPNETCORE_ENVIRONMENT=Production \
     mock-api-service
   ```

3. **View Logs**
   ```bash
   docker logs -f mock-api-service
   ```

4. **Stop Container**
   ```bash
   docker stop mock-api-service
   docker rm mock-api-service
   ```

### Build Scripts

Use the provided build scripts for convenience:

**Windows:**
```bash
# Batch script
build-docker.bat

# PowerShell script
.\build-docker.ps1
```

**Linux/macOS:**
```bash
# Make script executable
chmod +x build-docker.sh

# Run script
./build-docker.sh
```

## Production Deployment

### Security Considerations

1. **Environment Variables**
   - Use secure secret management
   - Don't commit sensitive values to version control
   - Rotate JWT secret keys regularly

2. **CORS Configuration**
   - Restrict to specific production domains
   - Avoid wildcard origins in production

3. **Logging**
   - Set appropriate log levels
   - Configure log aggregation
   - Monitor for security events

### Production Docker Setup

1. **Create Production Environment File**
   ```bash
   # .env.production
   FIREBASE_PROJECT_ID=your-production-firebase-project
   CORS_ORIGINS=https://your-production-domain.com
   ASPNETCORE_ENVIRONMENT=Production
   JWT_SECRET_KEY=your-secure-secret-key
   ```

2. **Deploy with Production Config**
   ```bash
   docker-compose --env-file .env.production \
     -f docker-compose.yml \
     -f docker-compose.prod.yml \
     up -d
   ```

### Reverse Proxy Setup

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
```

#### Traefik Configuration

```yaml
# docker-compose.traefik.yml
version: '3.8'
services:
  mock-api:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.mock-api.rule=Host(`api.yourdomain.com`)"
      - "traefik.http.routers.mock-api.tls=true"
      - "traefik.http.routers.mock-api.tls.certresolver=letsencrypt"
      - "traefik.http.services.mock-api.loadbalancer.server.port=3001"
```

### Kubernetes Deployment

#### Deployment Manifest

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mock-api-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mock-api-service
  template:
    metadata:
      labels:
        app: mock-api-service
    spec:
      containers:
      - name: mock-api
        image: mock-api-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: FIREBASE_PROJECT_ID
          valueFrom:
            secretKeyRef:
              name: mock-api-secrets
              key: firebase-project-id
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: mock-api-service
spec:
  selector:
    app: mock-api-service
  ports:
  - port: 80
    targetPort: 3001
  type: ClusterIP
```

## Environment Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ASPNETCORE_ENVIRONMENT` | No | `Development` | Runtime environment |
| `ASPNETCORE_HTTP_PORTS` | No | `3001` | HTTP port |
| `FIREBASE_PROJECT_ID` | Yes | `myauth-1569840907611` | Firebase project ID |
| `CORS_ORIGINS` | No | `http://localhost:51235,http://localhost:3000` | Allowed CORS origins |
| `JWT_SECRET_KEY` | No | Auto-generated | JWT signing key |
| `ERROR_SIMULATION_ENABLED` | No | `false` | Enable error simulation |

### Configuration Files

#### appsettings.json (Base Configuration)
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
  "JwtSettings": {
    "SecretKey": "mock-secret-key-for-development-only",
    "Issuer": "mock-api-service",
    "Audience": "the-wheel-app",
    "ExpirationMinutes": 60
  },
  "MockUsers": [
    {
      "uid": "mock-user-1",
      "email": "test@example.com",
      "displayName": "Test User",
      "password": "password123"
    }
  ]
}
```

#### appsettings.Production.json (Production Overrides)
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Error"
    }
  },
  "JwtSettings": {
    "SecretKey": "${JWT_SECRET_KEY}"
  }
}
```

### Docker Environment Files

#### .env (Development)
```bash
FIREBASE_PROJECT_ID=myauth-1569840907611
CORS_ORIGINS=http://localhost:51235,http://localhost:3000
ASPNETCORE_ENVIRONMENT=Development
```

#### .env.production (Production)
```bash
FIREBASE_PROJECT_ID=your-production-project-id
CORS_ORIGINS=https://your-production-domain.com
ASPNETCORE_ENVIRONMENT=Production
JWT_SECRET_KEY=your-secure-secret-key-here
```

## Monitoring and Health Checks

### Health Check Endpoints

- **Basic Health**: `GET /health`
- **Readiness Check**: `GET /ready`

### Health Check Response

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

### Docker Health Checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Monitoring Scripts

#### Basic Monitoring Script
```bash
#!/bin/bash
# monitor.sh

while true; do
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)
  if [ $response -eq 200 ]; then
    echo "$(date): Service is healthy"
  else
    echo "$(date): Service is unhealthy (HTTP $response)"
  fi
  sleep 30
done
```

#### Advanced Monitoring with Metrics
```bash
#!/bin/bash
# advanced-monitor.sh

check_service() {
  local endpoint=$1
  local expected_code=$2
  
  response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" $endpoint)
  http_code=$(echo $response | cut -d: -f1)
  response_time=$(echo $response | cut -d: -f2)
  
  if [ $http_code -eq $expected_code ]; then
    echo "✓ $endpoint: HTTP $http_code (${response_time}s)"
  else
    echo "✗ $endpoint: HTTP $http_code (${response_time}s)"
  fi
}

echo "$(date): Checking Mock API Service..."
check_service "http://localhost:3001/health" 200
check_service "http://localhost:3001/api/auth/login" 400  # Expected without body
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using port 3001
netstat -an | grep 3001
# or
lsof -i :3001

# Kill process using port
kill -9 $(lsof -t -i:3001)
```

#### Docker Issues
```bash
# View container logs
docker-compose logs mock-api

# Check container status
docker-compose ps

# Restart service
docker-compose restart mock-api

# Rebuild and restart
docker-compose up -d --build
```

#### CORS Problems
```bash
# Check current CORS configuration
curl -I -X OPTIONS http://localhost:3001/api/auth/login \
  -H "Origin: http://localhost:51235" \
  -H "Access-Control-Request-Method: POST"

# Expected response should include:
# Access-Control-Allow-Origin: http://localhost:51235
# Access-Control-Allow-Methods: POST, GET, OPTIONS
```

#### Authentication Issues
```bash
# Test login endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -v

# Check token format
echo "your-jwt-token" | cut -d. -f2 | base64 -d | jq .
```

### Debug Mode

Enable detailed logging:

```bash
# Environment variable
export Logging__LogLevel__MockApiService=Debug

# Or in appsettings
{
  "Logging": {
    "LogLevel": {
      "MockApiService": "Debug",
      "Microsoft.AspNetCore": "Information"
    }
  }
}
```

### Performance Issues

#### Check Resource Usage
```bash
# Docker stats
docker stats mock-api-service

# System resources
top -p $(pgrep -f "MockApiService")
```

#### Load Testing
```bash
# Simple load test with curl
for i in {1..100}; do
  curl -s http://localhost:3001/health > /dev/null &
done
wait

# Using Apache Bench
ab -n 1000 -c 10 http://localhost:3001/health
```

### Log Analysis

#### View Recent Logs
```bash
# Docker logs
docker-compose logs --tail=100 -f mock-api

# System logs (if running directly)
journalctl -u mock-api-service -f
```

#### Log Patterns to Watch
- Authentication failures: `Login attempt failed`
- CORS issues: `CORS policy`
- Validation errors: `Validation failed`
- Performance issues: Response times > 1000ms

### Recovery Procedures

#### Service Recovery
```bash
# Graceful restart
docker-compose restart mock-api

# Force restart
docker-compose down
docker-compose up -d

# Complete rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Data Recovery
Since the service uses in-memory storage, data is lost on restart. For persistent data:

1. Implement database storage
2. Use external storage service
3. Regular data exports/backups

### Support and Maintenance

#### Regular Maintenance Tasks
- Monitor disk space and logs
- Update base Docker images
- Review and rotate secrets
- Monitor performance metrics
- Update dependencies

#### Backup Procedures
```bash
# Export configuration
docker-compose config > backup-config.yml

# Export environment
env | grep -E "(FIREBASE|CORS|JWT)" > backup.env

# Export logs
docker-compose logs mock-api > logs-backup.txt
```

This deployment guide provides comprehensive coverage for deploying the Mock API Service in various environments, from local development to production-ready deployments with proper monitoring and troubleshooting procedures.