# Mock User Management UI

A React-based web interface for managing test users in the mock API service environment. This tool allows developers and testers to easily create, edit, delete, and impersonate test users for development and testing purposes.

## Features

- Create and manage test users
- Edit user information (email, display name, password)
- Delete users with confirmation
- Impersonate users for quick authentication testing
- Responsive web interface
- Docker containerization support

## Technology Stack

- **React 18.3.1** with TypeScript
- **Vite** for build tooling and dev server
- **SCSS** for styling
- **Axios** for HTTP client communication
- **React Hook Form** for form management
- **Docker** for containerization

## Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Update environment variables in `.env` as needed

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3002`

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t mock-user-ui .
```

### Run Docker Container

```bash
docker run -p 3002:3002 mock-user-ui
```

### Docker Compose

This service is designed to work with the existing mock API service through docker-compose. See the main project's docker-compose.yml for the complete setup.

## Environment Variables

- `VITE_API_BASE_URL`: Base URL for the mock API service (default: http://localhost:3001)
- `VITE_MAIN_APP_URL`: URL of the main application for redirects (default: http://localhost:5173)
- `VITE_APP_TITLE`: Application title (default: User Management)

## Project Structure

```
src/
├── components/          # React components
├── services/           # API services and HTTP client
├── types/              # TypeScript type definitions
├── styles/             # SCSS stylesheets and variables
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── vite-env.d.ts       # Vite environment types
```

## API Integration

This UI communicates with the mock API service to perform user management operations. Ensure the mock API service is running and accessible at the configured `VITE_API_BASE_URL`.

## Development Notes

- This is a development/testing tool and should not be used in production environments
- The UI assumes the mock API service provides the necessary user management endpoints
- Authentication is handled through the impersonation feature that generates tokens for the main application