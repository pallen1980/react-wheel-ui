# Project Structure

## Root Directory
```
├── src/                    # Source code
├── public/                 # Static assets
├── dist/                   # Build output
├── .kiro/                  # Kiro configuration
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── eslint.config.js        # ESLint configuration
├── Dockerfile              # Docker build configuration
└── docker-compose.yml      # Docker Compose setup
```

## Source Code Organization (`src/`)

### Areas-Based Architecture
The application follows an **Areas pattern** where each major feature/page has its own folder:

```
src/
├── Areas/
│   ├── Header/             # Header component
│   ├── Home/               # Home page
│   ├── Main/               # Main app/spinner component
│   ├── Nav/                # Navigation component
│   └── Profile/            # User profile page
├── Auth/                   # Authentication logic
│   ├── Firebase/           # Firebase configuration
│   ├── Models/             # Auth-related types/models
│   ├── AuthProvider.tsx    # Auth context provider
│   └── ProtectedRoute.tsx  # Route protection component
├── assets/                 # Static assets (images, icons)
├── main.tsx                # Application entry point
├── main.scss               # Global styles
└── vite-env.d.ts          # Vite type definitions
```

## Architectural Patterns

### Component Organization
- **Areas**: Feature-based folders for major app sections
- **Shared Auth**: Centralized authentication logic
- **Provider Pattern**: Context-based state management for auth

### Routing Structure
- `/` - Home page (public)
- `/Spinner` - Main spinner application
- `/Profile` - User profile (protected route)

### File Naming Conventions
- React components: PascalCase (e.g., `AuthProvider.tsx`)
- Folders: PascalCase for Areas, camelCase for utilities
- Styles: kebab-case or match component name

### Import Patterns
- Relative imports for local components
- Absolute imports from `src/` root when needed
- Group imports: React first, then third-party, then local

## Configuration Files
- **TypeScript**: Project references pattern with separate app/node configs
- **ESLint**: Modern flat config with React-specific rules
- **Vite**: Minimal configuration with React plugin
- **Docker**: Multi-stage build with Nginx serving