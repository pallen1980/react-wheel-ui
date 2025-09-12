import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3002',
    origin: 'http://localhost:3002',
  },
  writable: true,
})

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_BASE_URL: 'http://localhost:3001',
  },
  writable: true,
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
}