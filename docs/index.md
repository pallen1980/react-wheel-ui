# Documentation Index

Welcome to The Wheel application documentation. This documentation is organized to mirror the source code structure for easy navigation.

## Quick Navigation

### 🚀 Getting Started
- [**Main README**](./README.md) - Project overview, setup, and quick start
- [Environment Setup](./README.md#environment-variables) - Firebase configuration
- [Development Commands](./README.md#development-commands) - Build, test, and run commands

### 🏗️ Architecture
- [**Areas**](./Areas/) - Feature-based component architecture
- [**Authentication**](./Auth/) - Firebase auth integration and security
- [**Services**](./services/) - API communication and business logic
- [**State Management**](./store/) - Redux store with async thunks

### 📚 Detailed Documentation

#### Authentication System
- [Firebase Configuration](./Auth/README.md#firebase-configuration)
- [Authentication Flows](./Auth/README.md#authentication-flows)
- [Protected Routes](./Auth/README.md#protected-routes)
- [Integration with Services](./Auth/README.md#integration-with-services)

#### Services Layer
- [OptionsService Interface](./services/README.md#optionsservice-interface)
- [HTTP Implementation](./services/README.md#httpoptionsservice-implementation)
- [Error Handling](./services/README.md#error-handling)
- [Service Factory](./services/README.md#service-factory)

#### State Management
- [Redux Store Structure](./store/README.md#store-structure)
- [Async Thunks](./store/README.md#options-async-thunks)
- [Error Handling](./store/README.md#error-handling)
- [Testing](./store/README.md#testing)

#### Component Architecture
- [Areas Pattern](./Areas/README.md#architecture-pattern)
- [Feature Organization](./Areas/README.md#design-principles)
- [Inter-Area Communication](./Areas/README.md#inter-area-communication)
- [Development Guidelines](./Areas/README.md#development-guidelines)

## Documentation Structure

This documentation follows the same structure as the source code:

```
docs/
├── README.md           # Main project documentation
├── index.md           # This navigation file
├── Auth/              # Authentication documentation
│   └── README.md
├── services/          # Services layer documentation
│   └── README.md
├── store/             # Redux state management documentation
│   └── README.md
└── Areas/             # Component architecture documentation
    └── README.md
```

## Contributing to Documentation

When adding new features or modifying existing code:

1. **Update relevant documentation** in the corresponding docs folder
2. **Follow the existing structure** and formatting conventions
3. **Include code examples** for complex functionality
4. **Update this index** if adding new documentation sections

## External Resources

- [React Documentation](https://react.dev/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/guide/)