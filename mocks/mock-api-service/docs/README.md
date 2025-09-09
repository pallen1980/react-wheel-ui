# Mock API Service Documentation

Welcome to the Mock API Service documentation. This service provides a complete backend API for The Wheel application with Firebase-compatible authentication and user options persistence.

## 📖 Documentation Index

### Getting Started
- **[Quick Start Guide](quick-start.md)** - Get the service running in 2 minutes
- **[Deployment Guide](deployment-guide.md)** - Comprehensive deployment instructions for all environments

### API Reference
- **[Complete API Documentation](api-documentation.md)** - Full API reference with request/response examples
- **[Error Handling Guide](error-handling.md)** - Error simulation and troubleshooting

## 🎯 What is the Mock API Service?

The Mock API Service is a lightweight .NET 8 Web API that simulates the backend functionality needed by The Wheel application. It provides:

- **Firebase-compatible authentication** with JWT tokens
- **User options persistence** with in-memory storage
- **Error simulation capabilities** for testing error scenarios
- **CORS support** for local development
- **Docker containerization** for easy deployment

## 🚀 Quick Navigation

### I want to...

**Get started immediately** → [Quick Start Guide](quick-start.md)

**Deploy to production** → [Deployment Guide](deployment-guide.md)

**Understand the API** → [API Documentation](api-documentation.md)

**Test error scenarios** → [Error Handling Guide](error-handling.md)

**Integrate with my frontend** → [API Documentation - Frontend Integration](api-documentation.md#frontend-integration)

## 🔧 Key Features

### Authentication
- Login/register endpoints with email/password
- JWT token generation and validation
- Token refresh functionality
- Pre-configured test users for immediate testing

### Options Management
- Save/load user wheel options
- User-specific data isolation
- Validation and error handling
- RESTful API design

### Error Simulation
- Configurable error scenarios
- Network delay simulation
- Various HTTP error codes
- Testing-friendly error endpoints

### Development Features
- Hot reload support
- Comprehensive logging
- Health check endpoints
- Docker containerization

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Mock API       │    │   In-Memory     │
│   (The Wheel)   │◄──►│   Service        │◄──►│   Storage       │
│                 │    │   (.NET 8)       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│   JWT Tokens    │    │   Error          │
│   (Firebase     │    │   Simulation     │
│   Compatible)   │    │   Service        │
└─────────────────┘    └──────────────────┘
```

## 🧪 Testing

The service includes comprehensive testing capabilities:

- **Unit tests** for all components
- **Integration tests** for API endpoints
- **Error simulation** for testing error handling
- **Manual testing** with curl examples
- **HTTP files** for REST client testing

## 🔒 Security

While this is a mock service for development/testing, it includes:

- JWT token validation
- User authorization checks
- Input validation
- CORS configuration
- Secure defaults

## 🤝 Contributing

This service is part of The Wheel application project. For contributions:

1. Follow the existing code structure
2. Add tests for new functionality
3. Update documentation
4. Ensure Docker compatibility

## 📋 Requirements

- **.NET 8.0** SDK (for local development)
- **Docker** (for containerized deployment)
- **curl** or REST client (for testing)

## 🆘 Need Help?

- Check the [Troubleshooting section](deployment-guide.md#troubleshooting) in the deployment guide
- Review the [error handling documentation](error-handling.md)
- Look at the [API examples](api-documentation.md#testing) for common usage patterns

## 📄 License

This mock service is part of The Wheel application and follows the same licensing terms.