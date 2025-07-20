import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
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
                '**/*.spec.{ts,tsx}'
            ],
            include: [
                'src/**/*.{ts,tsx}'
            ],
            thresholds: {
                global: {
                    branches: 70,
                    functions: 70,
                    lines: 70,
                    statements: 70
                },
                // Higher thresholds for critical business logic
                'src/store/**': {
                    branches: 85,
                    functions: 85,
                    lines: 85,
                    statements: 85
                },
                'src/services/**': {
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