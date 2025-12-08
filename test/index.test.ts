import { describe, it, expect } from 'vitest';

import * as api from '../src/index';

describe('Public API exports', () => {
  it('should export WristbandAuthProvider', () => {
    expect(api.WristbandAuthProvider).toBeDefined();
    expect(typeof api.WristbandAuthProvider).toBe('function');
  });

  it('should export useWristbandAuth hook', () => {
    expect(api.useWristbandAuth).toBeDefined();
    expect(typeof api.useWristbandAuth).toBe('function');
  });

  it('should export useWristbandSession hook', () => {
    expect(api.useWristbandSession).toBeDefined();
    expect(typeof api.useWristbandSession).toBe('function');
  });

  it('should export utility functions', () => {
    expect(api.redirectToLogin).toBeDefined();
    expect(typeof api.redirectToLogin).toBe('function');

    expect(api.redirectToLogout).toBeDefined();
    expect(typeof api.redirectToLogout).toBe('function');
  });

  it('should not export any unexpected members', () => {
    const expectedRuntimeExports = [
      'WristbandAuthProvider',
      'useWristbandAuth',
      'useWristbandSession',
      'useWristbandToken',
      'WristbandError',
      'getCsrfToken',
      'redirectToLogin',
      'redirectToLogout',
    ];

    // Type-only exports (not testable at runtime):
    // - AuthStatus
    // - SessionResponse
    // - LoginRedirectConfig
    // - LogoutRedirectConfig
    // - WristbandErrorCode

    const actualExports = Object.keys(api);
    expect(actualExports.length).toBe(8); // Runtime exports only

    // Total exports should be 13 (8 runtime + 5 types)
    const totalExpectedExports = expectedRuntimeExports.length + 5; // +4 for type exports
    expect(totalExpectedExports).toBe(13);

    // Ensure all expected exports exist
    expectedRuntimeExports.forEach((exportName) => {
      expect(actualExports).toContain(exportName);
    });

    // Ensure there are no unexpected exports
    expect(actualExports.length).toBe(expectedRuntimeExports.length);
    actualExports.forEach((exportName) => {
      expect(expectedRuntimeExports).toContain(exportName);
    });
  });
});
