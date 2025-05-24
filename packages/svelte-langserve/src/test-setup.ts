import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Force browser environment detection for Svelte 5
Object.defineProperty(globalThis, 'window', {
	value: globalThis,
	writable: true,
	configurable: true
});

Object.defineProperty(globalThis, 'document', {
	value: globalThis.document,
	writable: true,
	configurable: true
});

// Ensure browser environment is detected
globalThis.process = globalThis.process || {};
(globalThis.process as typeof globalThis.process & { browser?: boolean }).browser = true;

// required for svelte5 + jsdom as jsdom does not support matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	enumerable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Mock performance API
global.performance = global.performance || {
  now: vi.fn(() => Date.now())
} as unknown as Performance;

// Mock Socket.IO client
vi.mock('socket.io-client', () => ({
	io: vi.fn(() => ({
		on: vi.fn(),
		emit: vi.fn(),
		disconnect: vi.fn(),
		connected: false
	}))
}));