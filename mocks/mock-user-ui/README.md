# User Management UI

A React-based web interface for managing test users in the mock API service environment. This tool provides developers and testers with an intuitive way to create, manage, and impersonate test users without manual configuration.

## Features

### User Management
- ✅ Create new test users with email, password, and display name
- ✅ Edit existing user information
- ✅ Delete users with confirmation dialog
- ✅ View all test users in a clean, responsive interface

### Authentication Testing
- ✅ Quick user impersonation ("Login as User" functionality)
- ✅ Automatic redirect to main application with authentication
- ✅ Seamless integration with Firebase authentication flow

### Developer Experience
- ✅ Real-time form validation with detailed error messages
- ✅ Loading states and user feedback for all operations
- ✅ Error handling with retry mechanisms
- ✅ Responsive design for different screen sizes
- ✅ Toast notifications for success/error states

## Quick Start

### Standalone Development
```bash
cd mocks/mock-user-ui
npm install
npm run dev
```

### Docker Deployment (Recommended)
```bash
# From project root
docker-compose up -d mock-user-ui

# Or start all services
setup/run-docker.bat  # Windows
setup/run-docker.ps1  # PowerShell/Linux
```

## Configuration

### Environment Variables

Create a `.env` file or set these environment variables:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001

# Main Application URL for redirects
VITE_MAIN_APP_URL=http://localhost:51235

# Application Title
VITE_APP_TITLE=User Management
```

### Docker Environment Variables

For containerized deployment, these are automatically configured:

```bash
# Internal service communication
VITE_API_BASE_URL=http://localhost:3001  # External browser access
VITE_MAIN_APP_URL=http://localhost:51235
VITE_APP_TITLE=User Management
```

## Usage

### Accessing the Interface

1. **Docker**: http://localhost:3002
2. **Development**: http://localhost:3002 (after `npm run dev`)

### Managing Test Users

1. **View Users**: The main interface shows all existing test users
2. **Create User**: Click "Add New User" and fill out the form
3. **Edit User**: Click the edit button next to any user
4. **Delete User**: Click delete and confirm in the dialog
5. **Login as User**: Click "Login as User" to authenticate as that user in the main app

### Integration with Main Application

The "Login as User" feature:
1. Generates an authentication token for the selected user
2. Redirects to the main application
3. Automatically logs in the user in the main app
4. Allows immediate testing of user-specific functionality

## API Integration

The UI communicates with the Mock API Service endpoints:

- `GET /v1/users` - Retrieve all test users
- `POST /v1/users` - Create new user
- `PUT /v1/users/{id}` - Update existing user
- `DELETE /v1/users/{id}` - Delete user
- `POST /v1/auth/impersonate` - Generate auth token for user

## Development

### Technology Stack

- **React 18.3.1** with TypeScript
- **Vite** for build tooling and dev server
- **SCSS** for styling
- **Axios** for HTTP client communication
- **React Hook Form** for form management
- **Docker** for containerization

### Project Structure

```
src/
├── components/          # React components
│   ├── UserList.tsx    # Main user listing
│   ├── UserForm.tsx    # Create/edit form
│   ├── ConfirmDialog.tsx # Confirmation dialogs
│   ├── ErrorMessage.tsx  # Error display
│   └── Toast.tsx       # Notifications
├── services/           # API services
│   ├── ApiClient.ts    # HTTP client
│   └── UserManagementService.ts # User operations
├── hooks/              # Custom React hooks
│   └── useToast.ts     # Toast notifications
└── styles/             # SCSS stylesheets
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Docker Commands

```bash
# Build image
docker build -t mock-user-ui .

# Run container
docker run -p 3002:3002 mock-user-ui

# View logs
docker-compose logs mock-user-ui

# Health check
curl http://localhost:3002/health
```

## Testing

### Integration Testing

The user management UI is included in the main project's integration tests:

```bash
# Run integration tests
setup/integration-test.ps1

# Health monitoring
setup/health-check.ps1
```

### Manual Testing Checklist

- [ ] Create a new user with valid information
- [ ] Try to create a user with invalid email (should show error)
- [ ] Edit an existing user's information
- [ ] Delete a user (should ask for confirmation)
- [ ] Use "Login as User" to authenticate in main app
- [ ] Verify error handling when API is unavailable
- [ ] Test responsive design on different screen sizes

## Troubleshooting

### Common Issues

**UI not loading**: Check if the container is running with `docker-compose ps`

**API connection errors**: Verify the Mock API Service is running on port 3001

**Authentication redirect fails**: Ensure `VITE_MAIN_APP_URL` points to the correct main application URL

**CORS errors**: Check that the Mock API Service includes the UI URL in its CORS configuration

### Debugging

```bash
# View container logs
docker-compose logs -f mock-user-ui

# Check service health
curl http://localhost:3002/health

# Test API connectivity
curl http://localhost:3001/v1/users

# Check container status
docker-compose ps
```

## Production Considerations

⚠️ **Important**: This is a development/testing tool and should not be deployed in production environments.

- No authentication required (by design for development ease)
- Exposes user management capabilities
- Intended for development and testing workflows only
- Should be disabled or removed in production builds

## Contributing

When making changes to the User Management UI:

1. Update tests for new functionality
2. Ensure responsive design works on all screen sizes
3. Add proper error handling for new API calls
4. Update this README if adding new features
5. Test integration with the main application