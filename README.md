# The Wheel - React Application

A React-based web application featuring a spinner/wheel component with Firebase authentication integration.

## Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
```

## Documentation

Comprehensive documentation is available in the [docs](./docs/) folder:

- **[Getting Started](./docs/README.md)** - Setup, configuration, and overview
- **[Authentication](./docs/Auth/)** - Firebase auth integration and usage
- **[Services](./docs/services/)** - API services and data layer
- **[State Management](./docs/store/)** - Redux store and async thunks
- **[Components](./docs/Areas/)** - Feature-based component architecture

## Environment Setup

Add a `.env` file to your root directory:

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