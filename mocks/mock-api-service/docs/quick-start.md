# Mock API Service - Quick Start Guide

## 🚀 Get Started in 2 Minutes

### Option 1: Docker (Recommended)

```bash
# Navigate to the mock API service directory
cd mocks/mock-api-service

# Start the service
docker-compose up -d

# Verify it's running
curl http://localhost:3001/health
```

### Option 2: .NET CLI

```bash
# Navigate to the mock API service directory
cd mocks/mock-api-service

# Run the service
dotnet run

# Service will be available at http://localhost:3001
```

## 🧪 Test the API

### 1. Login with Test User

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Response:**
```json
{
  "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_string",
  "localId": "mock-user-1",
  "email": "test@example.com",
  "expiresIn": 3600
}
```

### 2. Save Options (Copy token from step 1)

```bash
TOKEN="your_token_here"

curl -X POST http://localhost:3001/api/users/mock-user-1/options \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "options": [
      {"key":"opt1","value":"Pizza","sequence":1},
      {"key":"opt2","value":"Burger","sequence":2}
    ]
  }'
```

### 3. Retrieve Options

```bash
curl -X GET http://localhost:3001/api/users/mock-user-1/options \
  -H "Authorization: Bearer $TOKEN"
```

## 🔧 Frontend Integration

Set your frontend environment variable:

```bash
# In your .env file
VITE_API_BASE_URL=http://localhost:3001
```

## 📋 Pre-configured Test Users

| Email | Password | User ID |
|-------|----------|---------|
| `test@example.com` | `password123` | `mock-user-1` |
| `demo@example.com` | `demo123` | `mock-user-2` |

## 🛠️ Available Endpoints

- **Authentication**: `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`
- **Options**: `/api/users/{userId}/options` (GET/POST)
- **Error Simulation**: `/api/error-simulation/*`
- **Health Check**: `/health`

## 📖 Full Documentation

For complete API documentation, see [api-documentation.md](./api-documentation.md)

## 🐛 Troubleshooting

### Service won't start?
```bash
# Check if port 3001 is in use
netstat -an | grep 3001

# View Docker logs
docker-compose logs mock-api
```

### CORS issues?
Add your frontend URL to the `CORS_ORIGINS` environment variable:
```bash
CORS_ORIGINS=http://localhost:51235,http://localhost:3000,your-frontend-url
```

### Need help?
Check the [full documentation](./api-documentation.md) or [error handling guide](./error-handling.md).