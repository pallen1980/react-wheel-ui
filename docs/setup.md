# The Wheel - React Application

A React-based web application featuring a spinner/wheel component with Firebase authentication integration.

## Quick Start

### Environment Setup

Create a `.env` file in your project root directory with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=[YOUR-FIREBASE-API-KEY]
VITE_FIREBASE_AUTH_DOMAIN=[YOUR-FIREBASE-AUTH-DOMAIN]
VITE_FIREBASE_DATABASE_URL=[YOUR-FIREBASE-DB-URL]
VITE_FIREBASE_PROJECT_ID=[YOUR-FIREBASE-PROJECT-ID]
VITE_FIREBASE_STORAGE_BUCKET=[YOUR-FIREBASE-STORAGE-BUCKET]
VITE_FIREBASE_MESSAGING_SENDER_ID=[YOUR-FIREBASE-MESSAGING-SENDER-ID]
VITE_FIREBASE_APP_ID=[YOUR-FIREBASE-APP-ID]
VITE_FIREBASE_MEASUREMENT_ID=[YOUR-FIREBASE-MEASUREMENT-ID] # Optional

# Custom API Configuration
VITE_API_BASE_URL=[BASE-URL-TO-THE-API] # e.g. http://mycustomapi:512345
```

#### Environment Variables Explained

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase authentication domain |
| `VITE_FIREBASE_DATABASE_URL` | ✅ | Firebase Realtime Database URL |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase project identifier |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase storage bucket name |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase application ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | ❌ | Google Analytics measurement ID |
| `VITE_API_BASE_URL` | ❌ | Custom API endpoint (defaults to `/api`) |

### Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## Docker Deployment

### Prerequisites
- Docker Desktop installed and running
- `.env` file configured (see Environment Setup above)

### Quick Start with Setup Scripts

The `setup/` folder contains convenient scripts to run the application with Docker:

**Windows (Batch Script):**
```cmd
setup\run-docker.bat
```

**Windows/Linux/macOS (PowerShell):**
```powershell
.\setup\run-docker.ps1
```

**PowerShell with Options:**
```powershell
.\setup\run-docker.ps1 -Detached    # Run in background
.\setup\run-docker.ps1 -Build       # Force rebuild
.\setup\run-docker.ps1 -Clean       # Clean rebuild
```

### Setup Scripts Overview

#### Windows Batch Script (`setup/run-docker.bat`)
- **Simple interactive menu** - Choose from 3 run modes
- **Automatic validation** - Checks Docker status and required files
- **User-friendly** - Clear error messages and guidance
- **Options**: Normal (with logs), Background, or Rebuild mode

#### PowerShell Script (`setup/run-docker.ps1`)
- **Advanced validation** - Loads and validates all environment variables
- **Configuration summary** - Shows your settings before starting
- **Command-line parameters** - Perfect for automation and CI/CD
- **Comprehensive error handling** - Detailed troubleshooting information

### Manual Docker Commands

If you prefer running Docker commands directly:

```bash
# Start the application (foreground with logs)
docker-compose up

# Start in background (detached mode)
docker-compose up -d

# Force rebuild and start
docker-compose up --build

# Stop the application
docker-compose down

# Stop and remove volumes
docker-compose down --volumes

# View logs (follow mode)
docker-compose logs -f

# View logs for specific service
docker-compose logs -f web

# Restart the application
docker-compose restart
```

### Docker Configuration Details

The Docker setup automatically:

- **Builds** the React application with your environment variables
- **Serves** the app through Nginx on port **51235**
- **Configures** Firebase and custom API endpoints at build time
- **Optimizes** the build for production deployment
- **Uses** Alpine Linux for minimal image size
- **Handles** environment variable substitution

### Accessing Your Application

Once started, your application will be available at:
- **Local**: http://localhost:51235
- **Network**: http://[your-ip]:51235 (accessible from other devices on your network)

### Troubleshooting

#### Common Issues

**Docker not running:**
```
ERROR: Docker is not running. Please start Docker Desktop.
```
**Solution**: Start Docker Desktop and wait for it to fully initialize.

**Missing .env file:**
```
ERROR: .env file not found
```
**Solution**: Create a `.env` file in your project root with the required variables.

**Port already in use:**
```
Error: Port 51235 is already in use
```
**Solution**: Stop other services using port 51235 or modify the port in `docker-compose.yml`.

**Build failures:**
```
npm install failed
```
**Solution**: Try the rebuild option or clean your Docker cache:
```bash
docker system prune -f
docker-compose up --build
```

#### Getting Help

1. **Check logs**: Use `docker-compose logs -f` to see detailed error messages
2. **Verify environment**: Ensure all required environment variables are set
3. **Clean rebuild**: Use the `-Clean` option in PowerShell or option 3 in the batch script
4. **Manual commands**: Try running `docker-compose up --build` directly for more verbose output

### Development vs Production

- **Development**: Use `npm run dev` for hot reloading and faster iteration
- **Production**: Use Docker deployment for optimized builds and consistent environments
- **Testing**: Docker setup mirrors production environment for accurate testing

## Architecture Overview

The application follows an **Areas-based architecture** where each major feature/page has its own folder:

- **Areas/**: Feature-based components (Header, Home, Main, Nav, Profile)
- **Auth/**: Authentication logic with Firebase integration
- **services/**: API services and business logic
- **store/**: Redux state management

## Key Features

- Interactive spinner/wheel functionality
- User authentication via Firebase
- Protected routes for authenticated users
- Responsive design with dark/light theme support
- Options persistence with backend API
- Dockerized deployment ready

## Documentation Structure

This documentation is organized to mirror the source code structure:

- [Authentication](./Auth/) - Firebase auth setup and usage
- [Services](./services/) - API services and data layer
- [Store](./store/) - Redux state management
- [Areas](./Areas/) - Component documentation by feature

## Technology Stack

- **Frontend**: React 18.3.1 with TypeScript
- **Routing**: React Router 7.3.0
- **Build Tool**: Vite 6.1.1
- **State Management**: Redux Toolkit with async thunks
- **Authentication**: Firebase 11.4.0
- **Styling**: SCSS/Sass 1.83.4
- **Testing**: Vitest with React Testing Library
- **Deployment**: Docker with Nginx