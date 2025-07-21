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
                // Exclude unused authentication methods for now
                'src/Auth/Firebase/OAuth/**'
            ],
            include: [
                'src/**/*.{ts,tsx}'
            ],
            thresholds: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80
                },
                // Higher thresholds for critical business logic
                'src/store/**': {
                    branches: 90,
                    functions: 90,
                    lines: 90,
                    statements: 90
                },
                'src/services/**': {
                    branches: 90,
                    functions: 90,
                    lines: 90,
                    statements: 90
                },
                // Core application components should have high coverage
                'src/Areas/Main/**': {
                    branches: 85,
                    functions: 85,
                    lines: 85,
                    statements: 85
                },
                // Authentication is critical
                'src/Auth/**': {
                    branches: 85,
                    functions: 85,
                    lines: 85,
                    statements: 85
                }
            },
            all: true,
            clean: true
        }
    },
});