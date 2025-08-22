import React, { act, ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook, waitFor } from '@testing-library/react';
import { fail } from 'assert';

import { useWristbandToken } from '../../src/hooks/use-wristband-token';
import { WristbandAuthContext } from '../../src/context/wristband-auth-context';
import { AuthStatus, IWristbandAuthContext, WristbandErrorCode } from '../../src/types/auth-provider-types';
import { WristbandError } from '../../src/error';

describe('useWristbandToken', () => {
  // Reset any mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return getToken and clearToken from context', () => {
    const mockGetToken = vi.fn().mockResolvedValue('test-token-123');
    const mockClearToken = vi.fn();

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
      clearToken: mockClearToken,
      getToken: mockGetToken,
    };

    // Create a wrapper that provides the mock context
    const wrapper = ({ children }: { children: ReactNode }) => (
      <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
    );

    // Use the hook with the provided context
    const { result } = renderHook(() => useWristbandToken(), { wrapper });

    // The hook should return only the token-related properties
    expect(result.current).toEqual({ getToken: mockGetToken, clearToken: mockClearToken });

    // Verify that the returned object only has the expected keys
    expect(Object.keys(result.current).sort()).toEqual(['clearToken', 'getToken'].sort());
  });

  it('should call getToken and return the token when authenticated', async () => {
    const mockGetToken = vi.fn().mockResolvedValue('test-token-123');
    const mockClearToken = vi.fn();

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
      clearToken: mockClearToken,
      getToken: mockGetToken,
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
    );

    const { result } = renderHook(() => useWristbandToken(), { wrapper });

    // Call getToken
    let token: string;
    await act(async () => {
      token = await result.current.getToken();
    });

    // Verify the mock was called and returned the correct value
    expect(mockGetToken).toHaveBeenCalledTimes(1);
    expect(token!).toBe('test-token-123');
  });

  it('should throw WristbandError when user is not authenticated', async () => {
    const mockGetToken = vi
      .fn()
      .mockRejectedValue(new WristbandError(WristbandErrorCode.UNAUTHENTICATED, 'User is not authenticated'));
    const mockClearToken = vi.fn();

    const contextValue: IWristbandAuthContext = {
      isAuthenticated: false,
      isLoading: false,
      authStatus: AuthStatus.UNAUTHENTICATED,
      authError: null,
      userId: '',
      tenantId: '',
      metadata: {},
      updateMetadata: vi.fn(),
      clearAuthData: vi.fn(),
      clearToken: mockClearToken,
      getToken: mockGetToken,
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
    );

    const { result } = renderHook(() => useWristbandToken(), { wrapper });

    // Call getToken and expect it to reject with WristbandError
    await act(async () => {
      try {
        await result.current.getToken();
        fail('Expected a WristbandError');
      } catch (error) {
        expect(error).instanceOf(WristbandError);
        const testError = error as WristbandError;
        expect(testError.code).toBe('UNAUTHENTICATED');
        expect(testError.message).toBe('User is not authenticated');
        expect(testError.originalError).toBeUndefined();
      }
    });
    expect(mockGetToken).toHaveBeenCalledTimes(1);
  });

  it('should throw WristbandError when tokenUrl is not configured', async () => {
    const mockGetToken = vi
      .fn()
      .mockRejectedValue(new WristbandError(WristbandErrorCode.INVALID_TOKEN_URL, 'Token URL not configured'));
    const mockClearToken = vi.fn();

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
      clearToken: mockClearToken,
      getToken: mockGetToken,
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
    );

    const { result } = renderHook(() => useWristbandToken(), { wrapper });

    // Call getToken and expect it to reject with WristbandError
    await act(async () => {
      try {
        await result.current.getToken();
        fail('Expected a WristbandError');
      } catch (error) {
        expect(error).instanceOf(WristbandError);
        const testError = error as WristbandError;
        expect(testError.code).toBe('INVALID_TOKEN_URL');
        expect(testError.message).toBe('Token URL not configured');
        expect(testError.originalError).toBeUndefined();
      }
    });
    expect(mockGetToken).toHaveBeenCalledTimes(1);
  });

  it('should throw WristbandError when token fetch fails due to 401', async () => {
    const mockGetToken = vi
      .fn()
      .mockRejectedValue(
        new WristbandError(
          WristbandErrorCode.UNAUTHENTICATED,
          'Token request unauthorized',
          new Error('401 Unauthorized')
        )
      );
    const mockClearToken = vi.fn();

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
      clearToken: mockClearToken,
      getToken: mockGetToken,
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
    );

    const { result } = renderHook(() => useWristbandToken(), { wrapper });

    // Call getToken and expect it to reject with WristbandError
    await act(async () => {
      try {
        await result.current.getToken();
        fail('Expected a WristbandError');
      } catch (error) {
        expect(error).instanceOf(WristbandError);
        const testError = error as WristbandError;
        expect(testError.code).toBe('UNAUTHENTICATED');
        expect(testError.message).toBe('Token request unauthorized');
        expect(testError.originalError).toBeDefined();
      }
    });
    expect(mockGetToken).toHaveBeenCalledTimes(1);
  });

  it('should throw WristbandError for general token fetch failures', async () => {
    const mockGetToken = vi
      .fn()
      .mockRejectedValue(
        new WristbandError(WristbandErrorCode.TOKEN_FETCH_FAILED, 'Failed to fetch token', new Error('Network error'))
      );
    const mockClearToken = vi.fn();

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
      clearToken: mockClearToken,
      getToken: mockGetToken,
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
    );

    const { result } = renderHook(() => useWristbandToken(), { wrapper });

    // Call getToken and expect it to reject with WristbandError
    await act(async () => {
      try {
        await result.current.getToken();
        fail('Expected a WristbandError');
      } catch (error) {
        expect(error).instanceOf(WristbandError);
        const testError = error as WristbandError;
        expect(testError.code).toBe('TOKEN_FETCH_FAILED');
        expect(testError.message).toBe('Failed to fetch token');
        expect(testError.originalError).toBeDefined();
      }
    });
    expect(mockGetToken).toHaveBeenCalledTimes(1);
  });

  it('should return cached token when available and not expired', async () => {
    // Mock getToken to return cached token without making API call
    const mockGetToken = vi.fn().mockResolvedValue('cached-token-123');
    const mockClearToken = vi.fn();

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
      clearToken: mockClearToken,
      getToken: mockGetToken,
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
    );

    const { result } = renderHook(() => useWristbandToken(), { wrapper });

    // Call getToken multiple times quickly
    const tokens = await act(async () => {
      return await Promise.all([result.current.getToken(), result.current.getToken()]);
    });

    // Should return same cached token
    expect(tokens[0]).toBe('cached-token-123');
    expect(tokens[1]).toBe('cached-token-123');
    expect(mockGetToken).toHaveBeenCalledTimes(2); // Both calls should go through to getToken
  });

  it('should call clearToken when invoked', () => {
    const mockGetToken = vi.fn().mockResolvedValue('test-token-123');
    const mockClearToken = vi.fn();

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
      clearToken: mockClearToken,
      getToken: mockGetToken,
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
    );

    const { result } = renderHook(() => useWristbandToken(), { wrapper });

    // Call clearToken
    act(() => result.current.clearToken());

    // Verify the mock was called
    expect(mockClearToken).toHaveBeenCalledTimes(1);
  });

  it('should throw error when used outside of WristbandAuthProvider', () => {
    // Attempt to use the hook without a provider
    const consoleError = console.error;
    console.error = vi.fn(); // Suppress React error logs

    // We have to handle the expected error here
    expect(() => renderHook(() => useWristbandToken())).toThrow(
      'useWristbandToken() must be used within a WristbandAuthProvider.'
    );

    // Restore console.error
    console.error = consoleError;
  });

  it('should work correctly in a component with all scenarios', async () => {
    const mockGetToken = vi
      .fn()
      .mockResolvedValueOnce('test-token-456')
      .mockRejectedValueOnce(new WristbandError(WristbandErrorCode.UNAUTHENTICATED, 'User is not authenticated'));
    const mockClearToken = vi.fn();

    // Create a test component that uses the hook
    const TestComponent = () => {
      const { getToken, clearToken } = useWristbandToken();
      const [token, setToken] = React.useState<string>('');
      const [error, setError] = React.useState<string>('');

      const handleGetToken = async () => {
        try {
          setError('');
          const newToken = await getToken();
          setToken(newToken);
        } catch (err) {
          if (err instanceof WristbandError) {
            setError(err.message);
          } else {
            setError('Unknown error');
          }
          setToken('');
        }
      };

      const handleClearToken = () => {
        clearToken();
        setToken('');
        setError('');
      };

      return (
        <div>
          <div data-testid="current-token">{token}</div>
          <div data-testid="current-error">{error}</div>
          <button data-testid="get-token" onClick={handleGetToken}>
            Get Token
          </button>
          <button data-testid="clear-token" onClick={handleClearToken}>
            Clear Token
          </button>
        </div>
      );
    };

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
      clearToken: mockClearToken,
      getToken: mockGetToken,
    };

    // Render the test component with the context provider
    render(
      <WristbandAuthContext.Provider value={contextValue}>
        <TestComponent />
      </WristbandAuthContext.Provider>
    );

    // Initially no token or error
    expect(screen.getByTestId('current-token').textContent).toBe('');
    expect(screen.getByTestId('current-error').textContent).toBe('');

    // Click get token button - should succeed
    await act(async () => screen.getByTestId('get-token').click());

    // Wait for token to be set
    await waitFor(() => expect(screen.getByTestId('current-token').textContent).toBe('test-token-456'));
    expect(screen.getByTestId('current-error').textContent).toBe('');
    expect(mockGetToken).toHaveBeenCalledTimes(1);

    // Click get token button again - should fail
    await act(async () => screen.getByTestId('get-token').click());

    // Wait for error to be set
    await waitFor(() => expect(screen.getByTestId('current-error').textContent).toBe('User is not authenticated'));
    expect(screen.getByTestId('current-token').textContent).toBe('');
    expect(mockGetToken).toHaveBeenCalledTimes(2);

    // Click clear token button
    act(() => screen.getByTestId('clear-token').click());

    // Token and error should be cleared from display
    expect(screen.getByTestId('current-token').textContent).toBe('');
    expect(screen.getByTestId('current-error').textContent).toBe('');
    expect(mockClearToken).toHaveBeenCalledTimes(1);
  });
});
