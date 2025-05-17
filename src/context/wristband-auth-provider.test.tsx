import React, { act, useContext } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { WristbandAuthProvider } from './wristband-auth-provider';
import { WristbandAuthContext } from './wristband-auth-context';
import apiClient from '../api/api-client';
import { AuthStatus } from '../types/auth-provider-types';
import { ApiError } from '../types/api-client-types';
import * as authProviderUtils from '../utils/auth-provider-utils';

// Mock the API client
vi.mock('../api/api-client', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock the auth utility functions
vi.mock('../utils/auth-utils', () => ({
  isUnauthorizedError: vi.fn((error) => error.status === 401),
}));

// Mock the auth provider utility functions
vi.mock('../utils/auth-provider-utils', () => ({
  resolveAuthProviderLoginUrl: vi.fn((url) => url + '?return_url=https%3A%2F%2Fcurrent-page.com%2Fpath'),
  validateAuthProviderLogoutUrl: vi.fn(),
  validateAuthProviderSessionUrl: vi.fn(),
}));

// Create mock for window.location
const mockWindowLocation = () => {
  const originalLocation = window.location;

  // Mock implementation
  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      href: 'https://current-page.com/path',
      assign: vi.fn(),
    },
  });

  // Return cleanup function
  return () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
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
  const defaultProps = {
    loginUrl: '/api/auth/login',
    logoutUrl: '/api/auth/logout',
    sessionUrl: '/api/auth/session',
  };

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
      metadata: {
        name: 'Test User',
        role: 'admin',
      },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: mockSessionData,
      status: 200,
      headers: new Headers(),
    });

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
    expect(apiClient.get).toHaveBeenCalledWith(defaultProps.sessionUrl, {
      csrfCookieName: 'CSRF-TOKEN',
      csrfHeaderName: 'X-CSRF-TOKEN',
    });
  });

  it('applies the metadata transform function', async () => {
    const mockSessionData = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: {
        displayName: 'Test User',
        userRole: 'admin',
        email: 'test@example.com',
      },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: mockSessionData,
      status: 200,
      headers: new Headers(),
    });

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
      expect(displayedMetadata).toEqual({
        name: 'Test User',
        role: 'admin',
        email: 'test@example.com',
      });
    });
  });

  it('calls onSessionSuccess callback after successful session fetch', async () => {
    const mockSessionData = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { name: 'Test User' },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: mockSessionData,
      status: 200,
      headers: new Headers(),
    });

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

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: mockSessionData,
      status: 200,
      headers: new Headers(),
    });

    render(
      <WristbandAuthProvider {...defaultProps}>
        <TestConsumer />
      </WristbandAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
    });

    // Initial metadata state
    expect(JSON.parse(screen.getByTestId('metadata').textContent || '{}')).toEqual({ name: 'Test User' });

    // Trigger metadata update - wrapped in act()
    await act(async () => {
      screen.getByTestId('update-metadata').click();
    });

    // Check updated metadata (merges with existing)
    await waitFor(() => {
      const updatedMetadata = JSON.parse(screen.getByTestId('metadata').textContent || '{}');
      expect(updatedMetadata).toEqual({
        name: 'Test User',
        newProp: 'updated value',
      });
    });
  });

  it('uses custom CSRF cookie and header names when provided', async () => {
    const mockSessionData = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { name: 'Test User' },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: mockSessionData,
      status: 200,
      headers: new Headers(),
    });

    render(
      <WristbandAuthProvider
        {...defaultProps}
        csrfCookieName="CUSTOM-CSRF-COOKIE"
        csrfHeaderName="X-CUSTOM-CSRF-HEADER"
      >
        <TestConsumer />
      </WristbandAuthProvider>
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(defaultProps.sessionUrl, {
        csrfCookieName: 'CUSTOM-CSRF-COOKIE',
        csrfHeaderName: 'X-CUSTOM-CSRF-HEADER',
      });
    });
  });
});
