import React, { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';

import { useWristbandAuth } from './use-wristband-auth';
import { WristbandAuthContext } from '../context/wristband-auth-context';
import { AuthStatus, IWristbandAuthContext } from '../types/auth-provider-types';

describe('useWristbandAuth', () => {
  // Reset any mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return authentication state from context', () => {
    const contextValue: IWristbandAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      authStatus: AuthStatus.AUTHENTICATED,
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { role: 'admin' },
      updateMetadata: vi.fn(),
    };

    // Create a wrapper that provides the mock context
    const wrapper = ({ children }: { children: ReactNode }) => (
      <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
    );

    // Use the hook with the provided context
    const { result } = renderHook(() => useWristbandAuth(), { wrapper });

    // The hook should return only the specified properties
    expect(result.current).toEqual({
      isAuthenticated: true,
      isLoading: false,
      authStatus: AuthStatus.AUTHENTICATED,
    });

    // Verify that other properties are not included in the returned object
    // We know they're not there because of the Pick type, so we don't need to test this
    // But we can test that the object only has the expected keys
    expect(Object.keys(result.current).sort()).toEqual(['authStatus', 'isAuthenticated', 'isLoading'].sort());
  });

  it('should throw error when used outside of WristbandAuthProvider', () => {
    // Attempt to use the hook without a provider
    const consoleError = console.error;
    console.error = vi.fn(); // Suppress React error logs

    // We have to handle the expected error here
    expect(() => {
      renderHook(() => useWristbandAuth());
    }).toThrow('useWristbandAuth() must be used within a WristbandAuthProvider.');

    // Restore console.error
    console.error = consoleError;
  });

  it('should work correctly in a component', () => {
    // Create a test component that uses the hook
    const TestComponent = () => {
      const { isAuthenticated, isLoading, authStatus } = useWristbandAuth();
      return (
        <div>
          <div data-testid="auth-status">{authStatus}</div>
          <div data-testid="is-authenticated">{String(isAuthenticated)}</div>
          <div data-testid="is-loading">{String(isLoading)}</div>
        </div>
      );
    };

    const contextValue: IWristbandAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      authStatus: AuthStatus.AUTHENTICATED,
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { role: 'admin' },
      updateMetadata: vi.fn(),
    };

    // Render the test component with the context provider
    render(
      <WristbandAuthContext.Provider value={contextValue}>
        <TestComponent />
      </WristbandAuthContext.Provider>
    );

    // The component should render with the correct values
    expect(screen.getByTestId('auth-status').textContent).toBe(AuthStatus.AUTHENTICATED.toString());
    expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
    expect(screen.getByTestId('is-loading').textContent).toBe('false');
  });

  it('should handle all authentication states correctly', () => {
    // Test all possible authentication states
    const testStates = [
      {
        contextValue: {
          isAuthenticated: false,
          isLoading: true,
          authStatus: AuthStatus.LOADING,
          userId: '',
          tenantId: '',
          metadata: {},
          updateMetadata: vi.fn(),
        } as IWristbandAuthContext,
        expected: {
          isAuthenticated: false,
          isLoading: true,
          authStatus: AuthStatus.LOADING,
        },
      },
      {
        contextValue: {
          isAuthenticated: true,
          isLoading: false,
          authStatus: AuthStatus.AUTHENTICATED,
          userId: 'user-123',
          tenantId: 'tenant-456',
          metadata: { role: 'admin' },
          updateMetadata: vi.fn(),
        } as IWristbandAuthContext,
        expected: {
          isAuthenticated: true,
          isLoading: false,
          authStatus: AuthStatus.AUTHENTICATED,
        },
      },
      {
        contextValue: {
          isAuthenticated: false,
          isLoading: false,
          authStatus: AuthStatus.UNAUTHENTICATED,
          userId: '',
          tenantId: '',
          metadata: {},
          updateMetadata: vi.fn(),
        } as IWristbandAuthContext,
        expected: {
          isAuthenticated: false,
          isLoading: false,
          authStatus: AuthStatus.UNAUTHENTICATED,
        },
      },
    ];

    // Test each state
    testStates.forEach(({ contextValue, expected }) => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
      );

      const { result } = renderHook(() => useWristbandAuth(), { wrapper });

      expect(result.current).toEqual(expected);
    });
  });
});
