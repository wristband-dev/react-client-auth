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
    expect(Object.keys(api.AuthStatus).length).toBe(3);
    expect(api.AuthStatus.LOADING).toBe('LOADING');
    expect(api.AuthStatus.AUTHENTICATED).toBe('AUTHENTICATED');
    expect(api.AuthStatus.UNAUTHENTICATED).toBe('UNAUTHENTICATED');
  });

  it('should export WristbandErrorCode enum', () => {
    expect(api.WristbandErrorCode).toBeDefined();
    expect(Object.keys(api.WristbandErrorCode).length).toBe(9);
    expect(api.WristbandErrorCode.INVALID_LOGIN_URL).toBe('INVALID_LOGIN_URL');
    expect(api.WristbandErrorCode.INVALID_LOGOUT_URL).toBe('INVALID_LOGOUT_URL');
    expect(api.WristbandErrorCode.INVALID_SESSION_RESPONSE).toBe('INVALID_SESSION_RESPONSE');
    expect(api.WristbandErrorCode.INVALID_SESSION_URL).toBe('INVALID_SESSION_URL');
    expect(api.WristbandErrorCode.INVALID_TOKEN_RESPONSE).toBe('INVALID_TOKEN_RESPONSE');
    expect(api.WristbandErrorCode.INVALID_TOKEN_URL).toBe('INVALID_TOKEN_URL');
    expect(api.WristbandErrorCode.SESSION_FETCH_FAILED).toBe('SESSION_FETCH_FAILED');
    expect(api.WristbandErrorCode.TOKEN_FETCH_FAILED).toBe('TOKEN_FETCH_FAILED');
    expect(api.WristbandErrorCode.UNAUTHENTICATED).toBe('UNAUTHENTICATED');
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
      'AuthStatus',
      'WristbandError',
      'WristbandErrorCode',
      'redirectToLogin',
      'redirectToLogout',
    ];

    // Type-only exports (not testable at runtime):
    // - SessionResponse
    // - LoginRedirectConfig
    // - LogoutRedirectConfig

    const actualExports = Object.keys(api);
    expect(actualExports.length).toBe(9); // Runtime exports only

    // Total exports should be 12 (9 runtime + 3 types)
    const totalExpectedExports = expectedRuntimeExports.length + 3; // +3 for type exports
    expect(totalExpectedExports).toBe(12);

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
