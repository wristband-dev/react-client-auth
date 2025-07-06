import React, { act, useContext } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { WristbandAuthProvider } from '../../src/context/wristband-auth-provider';
import { WristbandAuthContext } from '../../src/context/wristband-auth-context';
import apiClient from '../../src/api/api-client';
import { AuthStatus } from '../../src/types/auth-provider-types';
import * as authProviderUtils from '../../src/utils/auth-provider-utils';
import { ApiError } from '../../src/error';

const requestOptions = { csrfCookieName: 'CSRF-TOKEN', csrfHeaderName: 'X-CSRF-TOKEN' };

// Mock the API client
vi.mock('../../src/api/api-client', () => ({ default: { get: vi.fn() } }));

// Mock the auth utility functions
vi.mock('../../src/utils/auth-utils', () => ({ isUnauthorizedError: vi.fn((error) => error.status === 401) }));

// Mock the auth provider utility functions
vi.mock('../../src/utils/auth-provider-utils', () => ({
  resolveAuthProviderLoginUrl: vi.fn((url) => url + '?return_url=https%3A%2F%2Fcurrent-page.com%2Fpath'),
  validateAuthProviderLogoutUrl: vi.fn(),
  validateAuthProviderSessionUrl: vi.fn(),
  validateAuthProviderTokenUrl: vi.fn(),
}));

// Create mock for window.location
const mockWindowLocation = () => {
  const originalLocation = window.location;

  // Mock implementation
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { href: 'https://current-page.com/path', assign: vi.fn() },
  });

  // Return cleanup function
  return () => {
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation });
  };
};

// Test consumer component to access context values
const TestConsumer = () => {
  const context = useContext(WristbandAuthContext);
  return (
    <div>
      <div data-testid="auth-status">{context?.authStatus}</div>
      <div data-testid="is-authenticated">{String(context?.isAuthenticated)}</div>
      <div data-testid="is-loading">{String(context?.isLoading)}</div>
      <div data-testid="user-id">{context?.userId || 'no-user-id'}</div>
      <div data-testid="tenant-id">{context?.tenantId || 'no-tenant-id'}</div>
      <div data-testid="metadata">{JSON.stringify(context?.metadata)}</div>
      <button data-testid="update-metadata" onClick={() => context?.updateMetadata?.({ newProp: 'updated value' })}>
        Update Metadata
      </button>
    </div>
  );
};

describe('WristbandAuthProvider', () => {
  const defaultProps = { loginUrl: '/api/auth/login', logoutUrl: '/api/auth/logout', sessionUrl: '/api/auth/session' };

  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  let restoreLocation;

  beforeEach(() => {
    // Mock window.location
    restoreLocation = mockWindowLocation();

    // Reset the mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();

    // Restore window.location
    restoreLocation();

    // Restore console methods after each test
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('validates and resolves URLs during initialization', () => {
    // Mock a pending API call that never resolves
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));

    render(
      <WristbandAuthProvider {...defaultProps}>
        <div>Test</div>
      </WristbandAuthProvider>
    );

    // Verify that auth provider utility functions were called with correct args
    expect(authProviderUtils.resolveAuthProviderLoginUrl).toHaveBeenCalledWith(defaultProps.loginUrl);
    expect(authProviderUtils.validateAuthProviderLogoutUrl).toHaveBeenCalledWith(defaultProps.logoutUrl);
    expect(authProviderUtils.validateAuthProviderSessionUrl).toHaveBeenCalledWith(defaultProps.sessionUrl);
  });

  it('validates tokenUrl when provided during initialization', () => {
    // Mock a pending API call that never resolves
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));

    render(
      <WristbandAuthProvider {...defaultProps} tokenUrl="/api/auth/token">
        <div>Test</div>
      </WristbandAuthProvider>
    );

    // Verify that validateAuthProviderTokenUrl was called
    expect(authProviderUtils.validateAuthProviderTokenUrl).toHaveBeenCalledWith('/api/auth/token');
  });

  it('initializes with loading state', () => {
    // Mock a pending API call that never resolves
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));

    render(
      <WristbandAuthProvider {...defaultProps}>
        <TestConsumer />
      </WristbandAuthProvider>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe(AuthStatus.LOADING.toString());
    expect(screen.getByTestId('is-loading').textContent).toBe('true');
    expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
  });

  it('fetches and sets session data successfully', async () => {
    const mockSessionData = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { name: 'Test User', role: 'admin' },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockSessionData, status: 200, headers: new Headers() });

    render(
      <WristbandAuthProvider {...defaultProps}>
        <TestConsumer />
      </WristbandAuthProvider>
    );

    // Initially in loading state
    expect(screen.getByTestId('is-loading').textContent).toBe('true');

    // Wait for session to be fetched
    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe(AuthStatus.AUTHENTICATED.toString());
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
      expect(screen.getByTestId('user-id').textContent).toBe('user-123');
      expect(screen.getByTestId('tenant-id').textContent).toBe('tenant-456');
      expect(JSON.parse(screen.getByTestId('metadata').textContent || '{}')).toEqual(mockSessionData.metadata);
    });

    // Verify the API was called with correct parameters
    expect(apiClient.get).toHaveBeenCalledWith(defaultProps.sessionUrl, requestOptions);
  });

  it('applies the metadata transform function', async () => {
    const mockSessionData = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { displayName: 'Test User', userRole: 'admin', email: 'test@example.com' },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockSessionData, status: 200, headers: new Headers() });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformFn = vi.fn((rawMetadata: any) => ({
      name: rawMetadata.displayName,
      role: rawMetadata.userRole,
      email: rawMetadata.email,
    }));

    render(
      <WristbandAuthProvider {...defaultProps} transformSessionMetadata={transformFn}>
        <TestConsumer />
      </WristbandAuthProvider>
    );

    await waitFor(() => {
      expect(transformFn).toHaveBeenCalledWith(mockSessionData.metadata);
      const displayedMetadata = JSON.parse(screen.getByTestId('metadata').textContent || '{}');
      expect(displayedMetadata).toEqual({ name: 'Test User', role: 'admin', email: 'test@example.com' });
    });
  });

  it('calls onSessionSuccess callback after successful session fetch', async () => {
    const mockSessionData = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { name: 'Test User' },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockSessionData, status: 200, headers: new Headers() });

    const onSessionSuccessMock = vi.fn();

    render(
      <WristbandAuthProvider {...defaultProps} onSessionSuccess={onSessionSuccessMock}>
        <TestConsumer />
      </WristbandAuthProvider>
    );

    await waitFor(() => {
      expect(onSessionSuccessMock).toHaveBeenCalledWith(mockSessionData);
    });
  });

  it('redirects to login on unauthorized error by default', async () => {
    // Mock console.log to prevent error output in tests
    console.log = vi.fn();

    const error = new ApiError('Unauthorized');
    error.status = 401;
    error.statusText = 'Unauthorized';

    vi.mocked(apiClient.get).mockRejectedValueOnce(error);

    // Mock the resolved login URL
    const resolvedLoginUrl = '/api/auth/login?return_url=https%3A%2F%2Fcurrent-page.com%2Fpath';
    vi.mocked(authProviderUtils.resolveAuthProviderLoginUrl).mockReturnValue(resolvedLoginUrl);

    render(
      <WristbandAuthProvider {...defaultProps}>
        <TestConsumer />
      </WristbandAuthProvider>
    );

    await waitFor(() => {
      // Check that we redirected to the resolved login URL
      expect(window.location.href).toBe(resolvedLoginUrl);
    });
  });

  it('redirects to logout on other errors by default', async () => {
    // Mock console.log to prevent error output in tests
    console.log = vi.fn();

    const error = new ApiError('Server Error');
    error.status = 500;
    error.statusText = 'Server Error';

    vi.mocked(apiClient.get).mockRejectedValueOnce(error);

    render(
      <WristbandAuthProvider {...defaultProps}>
        <TestConsumer />
      </WristbandAuthProvider>
    );

    await waitFor(() => {
      // Check that we redirected to the logout URL
      expect(window.location.href).toBe(defaultProps.logoutUrl);
    });
  });

  it('does not redirect when disableRedirectOnUnauthenticated is true', async () => {
    // Mock console.log to prevent error output in tests
    console.log = vi.fn();

    const error = new ApiError('Unauthorized');
    error.status = 401;
    error.statusText = 'Unauthorized';

    vi.mocked(apiClient.get).mockRejectedValueOnce(error);

    render(
      <WristbandAuthProvider {...defaultProps} disableRedirectOnUnauthenticated={true}>
        <TestConsumer />
      </WristbandAuthProvider>
    );

    await waitFor(() => {
      // Check that we didn't redirect
      expect(window.location.href).toBe('https://current-page.com/path');
      expect(screen.getByTestId('auth-status').textContent).toBe(AuthStatus.UNAUTHENTICATED.toString());
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });
  });

  it('allows updating metadata via updateMetadata method', async () => {
    const mockSessionData = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { name: 'Test User' },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockSessionData, status: 200, headers: new Headers() });

    render(
      <WristbandAuthProvider {...defaultProps}>
        <TestConsumer />
      </WristbandAuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('is-authenticated').textContent).toBe('true'));

    // Initial metadata state
    expect(JSON.parse(screen.getByTestId('metadata').textContent || '{}')).toEqual({ name: 'Test User' });

    // Trigger metadata update - wrapped in act()
    await act(async () => screen.getByTestId('update-metadata').click());

    // Check updated metadata (merges with existing)
    await waitFor(() => {
      const updatedMetadata = JSON.parse(screen.getByTestId('metadata').textContent || '{}');
      expect(updatedMetadata).toEqual({ name: 'Test User', newProp: 'updated value' });
    });
  });

  it('uses custom CSRF cookie and header names when provided', async () => {
    const mockSessionData = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { name: 'Test User' },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockSessionData, status: 200, headers: new Headers() });

    render(
      <WristbandAuthProvider
        {...defaultProps}
        csrfCookieName="CUSTOM-CSRF-COOKIE"
        csrfHeaderName="X-CUSTOM-CSRF-HEADER"
      >
        <TestConsumer />
      </WristbandAuthProvider>
    );

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith(defaultProps.sessionUrl, {
        csrfCookieName: 'CUSTOM-CSRF-COOKIE',
        csrfHeaderName: 'X-CUSTOM-CSRF-HEADER',
      })
    );
  });

  it('clears token state when authentication changes', async () => {
    const mockSessionData = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { name: 'Test User' },
    };

    // Mock successful session fetch first
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockSessionData, status: 200, headers: new Headers() });

    const TestTokenConsumer = () => {
      const context = useContext(WristbandAuthContext);

      const handleClearAuth = () => {
        context?.clearAuthData?.();
      };

      return (
        <div>
          <div data-testid="is-authenticated">{String(context?.isAuthenticated)}</div>
          <button data-testid="clear-auth" onClick={handleClearAuth}>
            Clear Auth
          </button>
        </div>
      );
    };

    render(
      <WristbandAuthProvider {...defaultProps} tokenUrl="/api/auth/token">
        <TestTokenConsumer />
      </WristbandAuthProvider>
    );

    // Wait for authentication
    await waitFor(() => expect(screen.getByTestId('is-authenticated').textContent).toBe('true'));

    // Clear auth data - this should trigger token clearing
    await act(async () => screen.getByTestId('clear-auth').click());

    // Verify authentication was cleared
    await waitFor(() => expect(screen.getByTestId('is-authenticated').textContent).toBe('false'));
  });

  describe('getToken functionality', () => {
    const mockSessionData = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { name: 'Test User' },
    };

    it('throws error when tokenUrl is not configured', async () => {
      // Mock successful session first
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockSessionData, status: 200, headers: new Headers() });

      const TokenTestConsumer = () => {
        const context = useContext(WristbandAuthContext);
        const [error, setError] = React.useState<string>('');

        const handleGetToken = async () => {
          try {
            await context?.getToken?.();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
          }
        };

        return (
          <div>
            <div data-testid="is-authenticated">{String(context?.isAuthenticated)}</div>
            <div data-testid="error">{error}</div>
            <button data-testid="get-token" onClick={handleGetToken}>
              Get Token
            </button>
          </div>
        );
      };

      render(
        <WristbandAuthProvider {...defaultProps}>
          <TokenTestConsumer />
        </WristbandAuthProvider>
      );

      // Wait for authentication
      await waitFor(() => expect(screen.getByTestId('is-authenticated').textContent).toBe('true'));

      // Try to get token without tokenUrl
      await act(async () => screen.getByTestId('get-token').click());

      await waitFor(() => expect(screen.getByTestId('error').textContent).toBe('Token URL not configured'));
    });

    it('throws error when user is not authenticated', async () => {
      // Mock failed session to keep user unauthenticated
      console.log = vi.fn(); // Suppress console output

      const error = new ApiError('Unauthorized');
      error.status = 401;
      vi.mocked(apiClient.get).mockRejectedValueOnce(error);

      const TokenTestConsumer = () => {
        const context = useContext(WristbandAuthContext);
        const [error, setError] = React.useState<string>('');

        const handleGetToken = async () => {
          try {
            await context?.getToken?.();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
          }
        };

        return (
          <div>
            <div data-testid="is-authenticated">{String(context?.isAuthenticated)}</div>
            <div data-testid="error">{error}</div>
            <button data-testid="get-token" onClick={handleGetToken}>
              Get Token
            </button>
          </div>
        );
      };

      render(
        <WristbandAuthProvider {...defaultProps} tokenUrl="/api/auth/token" disableRedirectOnUnauthenticated={true}>
          <TokenTestConsumer />
        </WristbandAuthProvider>
      );

      // Wait for unauthenticated state
      await waitFor(() => expect(screen.getByTestId('is-authenticated').textContent).toBe('false'));

      // Try to get token while unauthenticated
      await act(async () => screen.getByTestId('get-token').click());

      await waitFor(() => expect(screen.getByTestId('error').textContent).toBe('User is not authenticated'));
    });

    it('successfully fetches and returns token', async () => {
      const mockTokenResponse = { accessToken: 'test-token-123', expiresAt: Date.now() + 3600000 };

      // First call for session, second for token
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockSessionData, status: 200, headers: new Headers() })
        .mockResolvedValueOnce({ data: mockTokenResponse, status: 200, headers: new Headers() });

      const TokenTestConsumer = () => {
        const context = useContext(WristbandAuthContext);
        const [token, setToken] = React.useState<string>('');

        const handleGetToken = async () => {
          try {
            const result = await context?.getToken?.();
            setToken(result || '');
          } catch (err) {
            setToken('ERROR: ' + (err instanceof Error ? err.message : 'Unknown error'));
          }
        };

        return (
          <div>
            <div data-testid="is-authenticated">{String(context?.isAuthenticated)}</div>
            <div data-testid="token">{token}</div>
            <button data-testid="get-token" onClick={handleGetToken}>
              Get Token
            </button>
          </div>
        );
      };

      render(
        <WristbandAuthProvider {...defaultProps} tokenUrl="/api/auth/token">
          <TokenTestConsumer />
        </WristbandAuthProvider>
      );

      // Wait for authentication
      await waitFor(() => expect(screen.getByTestId('is-authenticated').textContent).toBe('true'));

      // Get token
      await act(async () => screen.getByTestId('get-token').click());

      await waitFor(() => expect(screen.getByTestId('token').textContent).toBe('test-token-123'));

      // Verify token endpoint was called
      expect(apiClient.get).toHaveBeenCalledWith('/api/auth/token', requestOptions);
    });

    it('clears token state on 401 error from token endpoint', async () => {
      const tokenError = new ApiError('Unauthorized');
      tokenError.status = 401;

      // First call for session (success), second for token (401)
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockSessionData, status: 200, headers: new Headers() })
        .mockRejectedValueOnce(tokenError);

      const TokenTestConsumer = () => {
        const context = useContext(WristbandAuthContext);
        const [error, setError] = React.useState<string>('');

        const handleGetToken = async () => {
          try {
            await context?.getToken?.();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
          }
        };

        return (
          <div>
            <div data-testid="is-authenticated">{String(context?.isAuthenticated)}</div>
            <div data-testid="error">{error}</div>
            <button data-testid="get-token" onClick={handleGetToken}>
              Get Token
            </button>
          </div>
        );
      };

      render(
        <WristbandAuthProvider {...defaultProps} tokenUrl="/api/auth/token">
          <TokenTestConsumer />
        </WristbandAuthProvider>
      );

      // Wait for authentication
      await waitFor(() => expect(screen.getByTestId('is-authenticated').textContent).toBe('true'));

      // Try to get token (will fail with 401)
      await act(async () => screen.getByTestId('get-token').click());

      await waitFor(() => expect(screen.getByTestId('error').textContent).toBe('Token request unauthorized'));
    });

    it('handles general token fetch failures', async () => {
      const tokenError = new ApiError('Server Error');
      tokenError.status = 500;

      // First call for session (success), second for token (500)
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockSessionData, status: 200, headers: new Headers() })
        .mockRejectedValueOnce(tokenError);

      const TokenTestConsumer = () => {
        const context = useContext(WristbandAuthContext);
        const [error, setError] = React.useState<string>('');

        const handleGetToken = async () => {
          try {
            await context?.getToken?.();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
          }
        };

        return (
          <div>
            <div data-testid="is-authenticated">{String(context?.isAuthenticated)}</div>
            <div data-testid="error">{error}</div>
            <button data-testid="get-token" onClick={handleGetToken}>
              Get Token
            </button>
          </div>
        );
      };

      render(
        <WristbandAuthProvider {...defaultProps} tokenUrl="/api/auth/token">
          <TokenTestConsumer />
        </WristbandAuthProvider>
      );

      // Wait for authentication
      await waitFor(() => expect(screen.getByTestId('is-authenticated').textContent).toBe('true'));

      // Try to get token (will fail with 500)
      await act(async () => screen.getByTestId('get-token').click());

      await waitFor(() => expect(screen.getByTestId('error').textContent).toBe('Failed to fetch token'));
    });

    it('returns cached token when available and not expired', async () => {
      const mockTokenResponse = { accessToken: 'cached-token-123', expiresAt: Date.now() + 3600000 };

      // Session call, then token call
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockSessionData, status: 200, headers: new Headers() })
        .mockResolvedValueOnce({ data: mockTokenResponse, status: 200, headers: new Headers() });

      const TokenTestConsumer = () => {
        const context = useContext(WristbandAuthContext);
        const [tokens, setTokens] = React.useState<string[]>([]);
        const [callCount, setCallCount] = React.useState(0);

        const handleGetToken = async () => {
          try {
            const result = await context?.getToken?.();
            setTokens((prev) => [...prev, result || '']);
            setCallCount((prev) => prev + 1);
          } catch (err) {
            setTokens((prev) => [...prev, 'ERROR: ' + (err instanceof Error ? err.message : 'Unknown error')]);
          }
        };

        return (
          <div>
            <div data-testid="is-authenticated">{String(context?.isAuthenticated)}</div>
            <div data-testid="tokens">{tokens.join(',')}</div>
            <div data-testid="call-count">{callCount}</div>
            <button data-testid="get-token" onClick={handleGetToken}>
              Get Token
            </button>
          </div>
        );
      };

      render(
        <WristbandAuthProvider {...defaultProps} tokenUrl="/api/auth/token">
          <TokenTestConsumer />
        </WristbandAuthProvider>
      );

      // Wait for authentication
      await waitFor(() => expect(screen.getByTestId('is-authenticated').textContent).toBe('true'));

      // Get token first time
      await act(async () => screen.getByTestId('get-token').click());

      await waitFor(() => expect(screen.getByTestId('call-count').textContent).toBe('1'));

      // Get token second time (should use cache)
      await act(async () => screen.getByTestId('get-token').click());

      await waitFor(() => {
        expect(screen.getByTestId('call-count').textContent).toBe('2');
        expect(screen.getByTestId('tokens').textContent).toBe('cached-token-123,cached-token-123');
      });

      // Verify API was only called twice (once for session, once for token)
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });

    it('deduplicates concurrent token requests', async () => {
      const mockTokenResponse = { accessToken: 'deduped-token-123', expiresAt: Date.now() + 3600000 };

      // Session call, then token call
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockSessionData, status: 200, headers: new Headers() })
        .mockResolvedValueOnce({ data: mockTokenResponse, status: 200, headers: new Headers() });

      const TokenTestConsumer = () => {
        const context = useContext(WristbandAuthContext);
        const [tokens, setTokens] = React.useState<string[]>([]);
        const [isAuthenticated, setIsAuthenticated] = React.useState(false);

        // Track authentication state
        React.useEffect(() => setIsAuthenticated(context?.isAuthenticated || false), [context?.isAuthenticated]);

        const handleConcurrentGetToken = async () => {
          try {
            // Make 3 concurrent calls BEFORE any token is cached
            const results = await Promise.all([context?.getToken?.(), context?.getToken?.(), context?.getToken?.()]);
            setTokens(results.map((r) => r || ''));
          } catch (err) {
            setTokens(['ERROR: ' + (err instanceof Error ? err.message : 'Unknown error')]);
          }
        };

        return (
          <div>
            <div data-testid="is-authenticated">{String(isAuthenticated)}</div>
            <div data-testid="tokens">{tokens.join(',')}</div>
            <button data-testid="get-token" onClick={handleConcurrentGetToken}>
              Get Token
            </button>
          </div>
        );
      };

      render(
        <WristbandAuthProvider {...defaultProps} tokenUrl="/api/auth/token">
          <TokenTestConsumer />
        </WristbandAuthProvider>
      );

      // Wait for authentication but DON'T call getToken yet
      await waitFor(() => expect(screen.getByTestId('is-authenticated').textContent).toBe('true'));

      // Now make the concurrent token requests for the FIRST time
      await act(async () => screen.getByTestId('get-token').click());
      await waitFor(() => {
        expect(screen.getByTestId('tokens').textContent).toBe('deduped-token-123,deduped-token-123,deduped-token-123');
      });

      // API should only be called twice total (once for session, once for token despite 3 concurrent requests)
      expect(apiClient.get).toHaveBeenCalledTimes(2);
      expect(apiClient.get).toHaveBeenNthCalledWith(1, '/api/auth/session', requestOptions);
      expect(apiClient.get).toHaveBeenNthCalledWith(2, '/api/auth/token', requestOptions);
    });
  });
});
