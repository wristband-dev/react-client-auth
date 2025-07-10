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

  it('should export AuthStatus enum', () => {
    expect(api.AuthStatus).toBeDefined();
    expect(api.AuthStatus.LOADING).toBe('loading');
    expect(api.AuthStatus.AUTHENTICATED).toBe('authenticated');
    expect(api.AuthStatus.UNAUTHENTICATED).toBe('unauthenticated');
  });

  it('should export utility functions', () => {
    expect(api.redirectToLogin).toBeDefined();
    expect(typeof api.redirectToLogin).toBe('function');

    expect(api.redirectToLogout).toBeDefined();
    expect(typeof api.redirectToLogout).toBe('function');
  });

  it('should not export any unexpected members', () => {
    const expectedExports = [
      'WristbandAuthProvider',
      'useWristbandAuth',
      'useWristbandSession',
      'useWristbandToken',
      'AuthStatus',
      'WristbandTokenError',
      'redirectToLogin',
      'redirectToLogout',
    ];

    // Get all keys that aren't types
    const actualExports = Object.keys(api);

    // Ensure all expected exports exist
    expectedExports.forEach((exportName) => {
      expect(actualExports).toContain(exportName);
    });

    // Ensure there are no unexpected exports
    expect(actualExports.length).toBe(expectedExports.length);
    actualExports.forEach((exportName) => {
      expect(expectedExports).toContain(exportName);
    });
  });
});
