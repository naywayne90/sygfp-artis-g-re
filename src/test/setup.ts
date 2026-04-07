import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup après chaque test
afterEach(() => {
  cleanup();
});

// Shim localStorage persistant pour le client Supabase.
// En jsdom, le localStorage peut être dessaisi après cleanup, ce qui fait
// crasher le auto-refresh tick GoTrueClient avec « storage.getItem is not a
// function » (5 unhandled rejections). Ce shim garantit qu'un Storage-like
// valide reste disponible tout au long des tests, sans interférer avec les
// tests qui font leurs propres écritures.
const createSafeStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  } satisfies Storage;
};
const safeLocalStorage = createSafeStorage();
Object.defineProperty(globalThis, 'localStorage', {
  value: safeLocalStorage,
  writable: false,
  configurable: true,
});
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: safeLocalStorage,
    writable: false,
    configurable: true,
  });
}

// Mock ResizeObserver
(globalThis as typeof globalThis & { ResizeObserver: unknown }).ResizeObserver = vi
  .fn()
  .mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

// Mock IntersectionObserver
(globalThis as typeof globalThis & { IntersectionObserver: unknown }).IntersectionObserver = vi
  .fn()
  .mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

// Mock matchMedia
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

// Mock scrollTo
window.scrollTo = vi.fn();

// Suppress console errors in tests (optional, remove if you want to see them)
// vi.spyOn(console, 'error').mockImplementation(() => {});
