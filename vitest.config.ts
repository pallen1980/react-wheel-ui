import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react({
        fastRefresh: false
    })],
    test: {
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './coverage',
            exclude: [
                'node_modules/**',
                'dist/**',
                'coverage/**',
                'tests/**',
                '**/*.d.ts',
                '**/*.config.{js,ts}',
                '**/vite-env.d.ts',
                'src/main.tsx',
                '**/*.test.{ts,tsx}',
                '**/*.spec.{ts,tsx}',
                // Exclude simple model/interface files
                '**/models/index.{ts,tsx}',
                '**/enums/index.{ts,tsx}',
                // Exclude simple export files
                'src/services/index.ts',
                'src/store/index.ts',
                'src/store/hooks.ts',
                'src/Auth/Models/index.tsx',
                // Exclude Firebase config (external service setup)
                'src/Auth/Firebase/Config/**',
                // Exclude OAuth components (complex Firebase integration)
                'src/Auth/Firebase/OAuth/**',
                // Exclude SignOut component (simple Firebase wrapper)
                'src/Auth/Firebase/SignOut.tsx',
                // Exclude SCSS/CSS files
                '**/*.scss',
                '**/*.css',
                // Exclude simple interface exports in components
                'src/Areas/Main/Title/components/TitleComponent.tsx',
                // Exclude complex components that are primarily UI rendering
                'src/Areas/Main/Spinner/components/WheelComponent.tsx',
                'src/Areas/Main/Spinner/components/SpinWheelComponent.tsx',
                // Exclude helper utilities that are primarily DOM manipulation
                'src/Areas/Main/Spinner/helpers/ColourUtility.tsx'
            ],
            include: [
                'src/**/*.{ts,tsx}'
            ],
            thresholds: {
                global: {
                    branches: 75,
                    functions: 75,
                    lines: 75,
                    statements: 75
                },
                // Higher thresholds for critical business logic
                'src/store/**': {
                    branches: 90,
                    functions: 90,
                    lines: 90,
                    statements: 90
                },
                'src/services/**': {
                    branches: 85,
                    functions: 85,
                    lines: 85,
                    statements: 85
                },
                // Core application components should have good coverage
                'src/Areas/Main/App.tsx': {
                    branches: 85,
                    functions: 85,
                    lines: 85,
                    statements: 85
                },
                'src/Areas/Main/Options/**': {
                    branches: 85,
                    functions: 85,
                    lines: 85,
                    statements: 85
                },
                // Authentication is critical
                'src/Auth/AuthProvider.tsx': {
                    branches: 90,
                    functions: 90,
                    lines: 90,
                    statements: 90
                },
                'src/Auth/ProtectedRoute.tsx': {
                    branches: 50,
                    functions: 100,
                    lines: 75,
                    statements: 75
                },
                // Simple components can have lower thresholds
                'src/Areas/Header/**': {
                    branches: 60,
                    functions: 60,
                    lines: 60,
                    statements: 60
                },
                'src/Areas/Home/**': {
                    branches: 70,
                    functions: 70,
                    lines: 70,
                    statements: 70
                },
                'src/Areas/Nav/**': {
                    branches: 70,
                    functions: 70,
                    lines: 70,
                    statements: 70
                },
                'src/Areas/Profile/**': {
                    branches: 60,
                    functions: 60,
                    lines: 60,
                    statements: 60
                }
            },
            all: true,
            clean: true
        }
    },
});