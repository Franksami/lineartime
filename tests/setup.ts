/**
 * Vitest Test Setup
 * Global test configuration and utilities
 */

import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest expectations with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  }),
}));

// Mock Next.js navigation (App Router)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock Clerk authentication
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
  }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'test-user-id',
  }),
  useClerk: () => ({
    signOut: vi.fn(),
  }),
  SignInButton: ({ children }: any) => children,
  SignUpButton: ({ children }: any) => children,
  UserButton: () => null,
}));

// Mock Convex
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useAction: vi.fn(),
  ConvexProvider: ({ children }: any) => children,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: () => [],
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Performance testing utilities
export const measurePerformance = async (name: string, fn: () => Promise<void> | void) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  const duration = end - start;

  // Log performance metrics
  console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);

  return duration;
};

// Custom matchers for Command Center Calendar
expect.extend({
  toBeWithinPerformanceBudget(received: number, budget: number) {
    const pass = received <= budget;
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received}ms to exceed budget of ${budget}ms`
          : `Expected ${received}ms to be within budget of ${budget}ms`,
    };
  },

  toHaveAccessibilityCompliance(element: HTMLElement) {
    const issues = [];

    // Check for alt text on images
    const images = element.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.alt) issues.push('Image missing alt text');
    });

    // Check for ARIA labels on interactive elements
    const buttons = element.querySelectorAll('button');
    buttons.forEach((btn) => {
      if (!btn.textContent && !btn.getAttribute('aria-label')) {
        issues.push('Button missing accessible label');
      }
    });

    const pass = issues.length === 0;
    return {
      pass,
      message: () =>
        pass
          ? 'Element has accessibility compliance'
          : `Accessibility issues found: ${issues.join(', ')}`,
    };
  },
});

// Declare custom matchers for TypeScript
declare global {
  namespace Vi {
    interface Assertion {
      toBeWithinPerformanceBudget(budget: number): void;
      toHaveAccessibilityCompliance(): void;
    }
  }
}
