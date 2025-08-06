# Project Structure

## Root Level Organization
```
├── src/                    # Source code
├── tests/                  # Test files (mirrors src structure)
├── docs/                   # Documentation
├── coverage/               # Test coverage reports
├── dist/                   # Build output
├── public/                 # Static assets
├── setup/                  # Deployment scripts
└── scripts/                # Utility scripts
```

## Source Code Structure (`src/`)

### Feature-Based Architecture
The project follows a feature-based folder structure under `src/Areas/`:

```
src/
├── Areas/                  # Feature-based components
│   ├── Header/            # Header component
│   ├── Home/              # Home page
│   ├── Main/              # Main spinner application
│   ├── Nav/               # Navigation component
│   └── Profile/           # User profile page
├── Auth/                  # Authentication logic
│   ├── Firebase/          # Firebase integration
│   ├── Models/            # Auth-related types
│   ├── AuthProvider.tsx   # Auth context provider
│   ├── ProtectedRoute.tsx # Route protection
│   └── hooks.ts           # Auth hooks
├── services/              # API and data services
├── store/                 # Redux store and slices
├── utils/                 # Utility functions
├── assets/                # Static assets
├── main.tsx              # Application entry point
└── main.scss             # Global styles
```

## Key Architectural Patterns

### Component Organization
- **Areas**: Feature-based components grouped by functionality
- **Components within Areas**: Each area can contain its own components, helpers, and models
- **Shared Services**: Common functionality in `src/services/`
- **Global State**: Redux store in `src/store/`

### Authentication Flow
- `AuthProvider.tsx` wraps the entire application
- `ProtectedRoute.tsx` guards authenticated routes
- Firebase integration isolated in `Auth/Firebase/`

### Testing Structure
- Tests mirror the `src/` structure in `tests/`
- Integration tests in `tests/integration/`
- Shared test setup in `tests/setup.ts`

## File Naming Conventions
- **Components**: PascalCase (e.g., `AuthProvider.tsx`)
- **Services**: PascalCase with "Service" suffix (e.g., `OptionsService.ts`)
- **Hooks**: camelCase with "hooks" suffix (e.g., `hooks.ts`)
- **Types/Models**: PascalCase in dedicated folders
- **Utilities**: camelCase (e.g., `errorLogger.ts`)

## Import/Export Patterns
- Each major folder has an `index.ts` for clean imports
- Services exported from `src/services/index.ts`
- Store exports from `src/store/index.ts`
- Relative imports for local components, absolute for shared services