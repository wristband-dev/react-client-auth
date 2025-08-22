import React, { act, ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';

import { useWristbandAuth } from '../../src/hooks/use-wristband-auth';
import { WristbandAuthContext } from '../../src/context/wristband-auth-context';
import { AuthStatus, IWristbandAuthContext, WristbandErrorCode } from '../../src/types/auth-provider-types';
import { WristbandError } from '../../src/error';

describe('useWristbandAuth', () => {
  // Reset any mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return authentication state and clearAuthData from context', () => {
    const mockClearAuthData = vi.fn();

    const contextValue: IWristbandAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      authStatus: AuthStatus.AUTHENTICATED,
      authError: null,
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { role: 'admin' },
      updateMetadata: vi.fn(),
      clearAuthData: mockClearAuthData,
      clearToken: vi.fn(),
      getToken: vi.fn(),
    };

    // Create a wrapper that provides the mock context
    const wrapper = ({ children }: { children: ReactNode }) => (
      <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
    );

    // Use the hook with the provided context
    const { result } = renderHook(() => useWristbandAuth(), { wrapper });

    // The hook should return only the specified properties
    expect(result.current).toEqual({
      authError: null,
      isAuthenticated: true,
      isLoading: false,
      authStatus: AuthStatus.AUTHENTICATED,
      clearAuthData: mockClearAuthData,
    });

    // Verify that the returned object only has the expected keys
    expect(Object.keys(result.current).sort()).toEqual(
      ['authError', 'authStatus', 'clearAuthData', 'isAuthenticated', 'isLoading'].sort()
    );
  });

  it('should call clearAuthData when invoked', () => {
    const mockClearAuthData = vi.fn();

    const contextValue: IWristbandAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      authStatus: AuthStatus.AUTHENTICATED,
      authError: null,
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { role: 'admin' },
      updateMetadata: vi.fn(),
      clearAuthData: mockClearAuthData,
      clearToken: vi.fn(),
      getToken: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
    );

    const { result } = renderHook(() => useWristbandAuth(), { wrapper });

    // Call clearAuthData
    act(() => {
      result.current.clearAuthData();
    });

    // Verify the mock was called
    expect(mockClearAuthData).toHaveBeenCalledTimes(1);
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
      const { isAuthenticated, isLoading, authStatus, clearAuthData } = useWristbandAuth();
      return (
        <div>
          <div data-testid="auth-status">{authStatus}</div>
          <div data-testid="is-authenticated">{String(isAuthenticated)}</div>
          <div data-testid="is-loading">{String(isLoading)}</div>
          <button data-testid="clear-auth" onClick={clearAuthData}>
            Clear Auth
          </button>
        </div>
      );
    };

    const mockClearAuthData = vi.fn();
    const contextValue: IWristbandAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      authStatus: AuthStatus.AUTHENTICATED,
      authError: null,
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { role: 'admin' },
      updateMetadata: vi.fn(),
      clearAuthData: mockClearAuthData,
      clearToken: vi.fn(),
      getToken: vi.fn(),
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

    // Test that clicking the button calls clearAuthData
    act(() => {
      screen.getByTestId('clear-auth').click();
    });
    expect(mockClearAuthData).toHaveBeenCalledTimes(1);
  });

  it('should handle all authentication states correctly', () => {
    // Test all possible authentication states
    const testStates = [
      {
        contextValue: {
          isAuthenticated: false,
          isLoading: true,
          authStatus: AuthStatus.LOADING,
          authError: null,
          userId: '',
          tenantId: '',
          metadata: {},
          updateMetadata: vi.fn(),
          clearAuthData: vi.fn(),
          clearToken: vi.fn(),
          getToken: vi.fn(),
        } as IWristbandAuthContext,
        expected: {
          authError: null,
          isAuthenticated: false,
          isLoading: true,
          authStatus: AuthStatus.LOADING,
          clearAuthData: expect.any(Function),
        },
      },
      {
        contextValue: {
          isAuthenticated: true,
          isLoading: false,
          authStatus: AuthStatus.AUTHENTICATED,
          authError: null,
          userId: 'user-123',
          tenantId: 'tenant-456',
          metadata: { role: 'admin' },
          updateMetadata: vi.fn(),
          clearAuthData: vi.fn(),
          clearToken: vi.fn(),
          getToken: vi.fn(),
        } as IWristbandAuthContext,
        expected: {
          authError: null,
          isAuthenticated: true,
          isLoading: false,
          authStatus: AuthStatus.AUTHENTICATED,
          clearAuthData: expect.any(Function),
        },
      },
      {
        contextValue: {
          isAuthenticated: false,
          isLoading: false,
          authStatus: AuthStatus.UNAUTHENTICATED,
          authError: null,
          userId: '',
          tenantId: '',
          metadata: {},
          updateMetadata: vi.fn(),
          clearAuthData: vi.fn(),
          clearToken: vi.fn(),
          getToken: vi.fn(),
        } as IWristbandAuthContext,
        expected: {
          authError: null,
          isAuthenticated: false,
          isLoading: false,
          authStatus: AuthStatus.UNAUTHENTICATED,
          clearAuthData: expect.any(Function),
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

  it('should return authError when present in context', () => {
    const mockError = new WristbandError(WristbandErrorCode.SESSION_FETCH_FAILED, 'Session failed');

    const contextValue: IWristbandAuthContext = {
      isAuthenticated: false,
      isLoading: false,
      authStatus: AuthStatus.UNAUTHENTICATED,
      authError: mockError,
      userId: '',
      tenantId: '',
      metadata: {},
      updateMetadata: vi.fn(),
      clearAuthData: vi.fn(),
      clearToken: vi.fn(),
      getToken: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
    );

    const { result } = renderHook(() => useWristbandAuth(), { wrapper });

    expect(result.current.authError).toBe(mockError);
    expect(result.current.authError?.code).toBe(WristbandErrorCode.SESSION_FETCH_FAILED);
    expect(result.current.authError?.message).toBe('Session failed');
  });

  it('should not expose session or token data', () => {
    const contextValue: IWristbandAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      authStatus: AuthStatus.AUTHENTICATED,
      authError: null,
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { role: 'admin' },
      updateMetadata: vi.fn(),
      clearAuthData: vi.fn(),
      clearToken: vi.fn(),
      getToken: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
    );

    const { result } = renderHook(() => useWristbandAuth(), { wrapper });

    // Verify session/token data is NOT included
    expect('userId' in result.current).toBe(false);
    expect('tenantId' in result.current).toBe(false);
    expect('metadata' in result.current).toBe(false);
    expect('getToken' in result.current).toBe(false);
    expect('clearToken' in result.current).toBe(false);
    expect('updateMetadata' in result.current).toBe(false);
  });

  it('should handle different types of authError', () => {
    const testCases = [
      new WristbandError(WristbandErrorCode.INVALID_SESSION_RESPONSE, 'Invalid session'),
      new WristbandError(WristbandErrorCode.TOKEN_FETCH_FAILED, 'Token failed'),
      new WristbandError(WristbandErrorCode.UNAUTHENTICATED, 'Not authenticated'),
    ];

    testCases.forEach((error) => {
      const contextValue: IWristbandAuthContext = {
        isAuthenticated: false,
        isLoading: false,
        authStatus: AuthStatus.UNAUTHENTICATED,
        authError: error,
        userId: '',
        tenantId: '',
        metadata: {},
        updateMetadata: vi.fn(),
        clearAuthData: vi.fn(),
        clearToken: vi.fn(),
        getToken: vi.fn(),
      };

      const wrapper = ({ children }: { children: ReactNode }) => (
        <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
      );

      const { result } = renderHook(() => useWristbandAuth(), { wrapper });
      expect(result.current.authError).toBe(error);
    });
  });
});
