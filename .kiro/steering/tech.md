# Technology Stack

## Frontend Framework
- **React 18.3.1** with TypeScript
- **Vite** as build tool and dev server
- **SCSS** for styling

## State Management
- **Redux Toolkit** (@reduxjs/toolkit) for application state
- **React Redux** for React-Redux bindings

## Authentication & Backend
- **Firebase 11.4.0** for authentication and data persistence
- OAuth integration for user authentication

## Routing
- **React Router 7.3.0** for client-side routing

## Testing
- **Vitest** as test runner
- **@testing-library/react** for component testing
- **@testing-library/jest-dom** for DOM assertions
- **@testing-library/user-event** for user interaction testing
- **jsdom** as test environment

## Code Quality
- **ESLint** with TypeScript support
- **TypeScript 5.6.2** for type safety

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production (TypeScript compile + Vite build)
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Testing
```bash
npm run test                    # Run tests in watch mode
npm run test:run               # Run tests once
npm run test:coverage          # Run tests with coverage report
npm run test:coverage:watch    # Run tests with coverage in watch mode
npm run test:coverage:ui       # Run tests with coverage UI
npm run coverage:analyze       # Analyze coverage with custom script
```

### Docker
```bash
# Use provided scripts in setup/ folder
setup/run-docker.bat    # Windows batch script
setup/run-docker.ps1    # PowerShell script
```

## Build System
- **Vite** handles bundling, dev server, and hot module replacement
- **TypeScript** compilation integrated into build process
- **Docker** support with nginx for production deployment