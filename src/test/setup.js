// Test setup file
import { vi } from 'vitest'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.sessionStorage = sessionStorageMock

// Mock document
global.document = {
  ...global.document,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  visibilityState: 'visible',
  cookie: ''
}

// Mock window
global.window = {
  ...global.window,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}