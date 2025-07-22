# Areas Documentation

## Overview

The Areas architecture organizes the application into feature-based modules, where each major section of the app has its own dedicated folder. This promotes code organization, maintainability, and clear separation of concerns.

## Architecture Pattern

```
Areas/
├── Header/          # Application header with navigation
├── Home/            # Landing page (public)
├── Main/            # Core application features
│   ├── Options/     # Options management
│   ├── Spinner/     # Wheel spinner functionality
│   └── Title/       # Title display component
├── Nav/             # Navigation component
└── Profile/         # User profile page (protected)
```

## Design Principles

### 1. Feature-Based Organization
Each area represents a distinct feature or page section:
- **Self-contained**: All related components, styles, and logic in one place
- **Clear boundaries**: Well-defined interfaces between areas
- **Independent development**: Teams can work on different areas simultaneously

### 2. Consistent Structure
Each area follows a similar internal structure:
```
AreaName/
├── components/      # Area-specific components
├── models/          # TypeScript interfaces and types
├── helpers/         # Utility functions
├── AreaName.tsx     # Main area component
└── AreaName.scss    # Area-specific styles (if needed)
```

### 3. Shared Dependencies
Areas can share common functionality through:
- **Auth system**: Authentication state and components
- **Services**: API communication and business logic
- **Store**: Redux state management
- **Shared components**: Reusable UI components

## Area Descriptions

### Header
Application header with branding and navigation elements.

**Features:**
- Application logo/title
- User authentication status
- Navigation links
- Responsive design

### Home
Public landing page that introduces the application.

**Features:**
- Welcome message
- Application overview
- Call-to-action for authentication
- Public access (no authentication required)

### Main
Core application functionality container.

**Sub-areas:**
- **Options**: Manage wheel options (add, edit, delete, reorder)
- **Spinner**: Interactive wheel spinning functionality
- **Title**: Dynamic title display

**Features:**
- Protected access (authentication required)
- Integrated user experience
- State management for options

### Nav
Navigation component for authenticated users.

**Features:**
- Route navigation
- User menu
- Responsive navigation
- Authentication-aware links

### Profile
User profile management page.

**Features:**
- User information display
- Account settings
- Authentication management
- Protected access

## Routing Structure

Areas map to application routes:

```typescript
const routes = [
  { path: '/', component: Home },           // Public
  { path: '/spinner', component: Main },    // Protected
  { path: '/profile', component: Profile }  // Protected
];
```

## State Management

Areas interact with global state through Redux:

```typescript
// Areas can read from global state
const { options, isLoading } = useSelector(state => state.options);

// Areas can dispatch actions
dispatch(loadOptionsThunk(optionsService));
```

## Styling Approach

Each area manages its own styles:
- **Scoped styles**: Area-specific SCSS files
- **Global styles**: Shared theme and utilities
- **Component styles**: Co-located with components

## Inter-Area Communication

Areas communicate through:

1. **Redux Store**: Shared state management
2. **Services**: Shared business logic
3. **Props**: Parent-child component communication
4. **Events**: Custom events for loose coupling

## Testing Strategy

Each area includes:
- **Component tests**: Individual component behavior
- **Integration tests**: Area-level functionality
- **E2E tests**: Cross-area user flows

## Development Guidelines

### Adding a New Area

1. Create area folder structure
2. Implement main area component
3. Add routing configuration
4. Create area-specific tests
5. Update documentation

### Area Dependencies

- **Minimize coupling**: Areas should be as independent as possible
- **Use abstractions**: Depend on interfaces, not implementations
- **Share through store**: Use Redux for cross-area state
- **Document interfaces**: Clear contracts between areas

## Future Enhancements

Potential improvements:

- **Lazy loading**: Load areas on demand
- **Micro-frontends**: Deploy areas independently
- **Feature flags**: Toggle areas based on configuration
- **Analytics**: Track area-specific user interactions
- **Theming**: Area-specific theme customization