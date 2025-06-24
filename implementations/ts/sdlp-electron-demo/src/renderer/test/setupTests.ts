import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the Electron API for testing
Object.defineProperty(window, 'electronAPI', {
  value: {
    onSDLPCommandOutput: vi.fn(),
    onSDLPCommandToExecute: vi.fn(),
    executeCommand: vi.fn(),
    getTrustStore: vi.fn().mockResolvedValue([]),
    addToTrustStore: vi.fn().mockResolvedValue(undefined),
    removeFromTrustStore: vi.fn().mockResolvedValue(undefined),
    clearTrustStore: vi.fn().mockResolvedValue(undefined),
    removeAllListeners: vi.fn(),
  },
  writable: true,
});

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
