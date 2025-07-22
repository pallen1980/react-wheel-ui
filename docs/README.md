# The Wheel - React Application

A React-based web application featuring a spinner/wheel component with Firebase authentication integration.

## Quick Start

### Environment Variables

Add a `.env` file to your root directory with the following Firebase configuration:

```env
VITE_FIREBASE_API_KEY=[YOUR-FIREBASE-API-KEY]
VITE_FIREBASE_AUTH_DOMAIN=[YOUR-FIREBASE-AUTH-DOMAIN]
VITE_FIREBASE_DATABASE_URL=[YOUR-FIREBASE-DB-URL]
VITE_FIREBASE_PROJECT_ID=[YOUR-FIREBASE-PROJECT-ID]
VITE_FIREBASE_STORAGE_BUCKET=[YOUR-FIREBASE-STORAGE-BUCKET]
VITE_FIREBASE_MESSAGING_SENDER_ID=[YOUR-FIREBASE-MESSAGING-SENDER-ID]
VITE_FIREBASE_APP_ID=[YOUR-FIREBASE-APP-ID]
VITE_FIREBASE_MEASUREMENT_ID=[YOUR-FIREBASE-MEASUREMENT-ID] # Optional
```

### Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run ESLint
```

### Docker Commands

```bash
docker-compose up    # Run with Docker Compose
docker build .       # Build Docker image
```

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