# Technology Stack

## Frontend Framework
- **React 18.3.1** with TypeScript
- **React Router 7.3.0** for client-side routing
- **Vite 6.1.1** as build tool and dev server

## Backend Services
- **Firebase 11.4.0** for authentication and database
- Environment-based configuration via `.env` file

## Styling & UI
- **SCSS/Sass 1.83.4** for styling
- Custom CSS with dark/light theme support
- Responsive design patterns

## Development Tools
- **TypeScript 5.6.2** with strict mode enabled
- **ESLint 9.17.0** with React-specific rules
- **Vite** for hot module replacement and fast builds

## Deployment
- **Docker** multi-stage builds with Nginx
- **Docker Compose** for local development
- Environment variable injection for Firebase config

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Docker
```bash
docker-compose up    # Run with Docker Compose
docker build .       # Build Docker image
```

## Environment Setup
Required environment variables in `.env`:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)