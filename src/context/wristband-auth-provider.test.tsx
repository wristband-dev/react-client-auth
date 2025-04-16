import React, { act, useContext } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WristbandAuthProvider } from './wristband-auth-provider';
import { WristbandAuthContext } from './wristband-auth-context';
import { AuthStatus } from '../types/types';
import wristbandApiClient from '../api/wristband-api-client';

// Mock the API client
vi.mock('../api/wristband-api-client', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock the auth utility functions
vi.mock('../utils/auth', () => ({
  isUnauthorizedError: vi.fn((error) => error.status === 401),
  redirectToLogin: vi.fn(),
  redirectToLogout: vi.fn(),
}));

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
      <button
        data-testid="update-metadata"
        onClick={() => context?.updateMetadata?.({ newProp: 'updated value' })}
      >
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

  beforeEach(() => {
    // Reset the mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
    // Restore console methods after each test
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('throws error when required props are missing', () => {
    // Suppress React error logs for this test
    console.error = vi.fn();
    
    expect(() => render(
      <WristbandAuthProvider logoutUrl="/logout" sessionUrl="/session">
        <div>Test</div>
      </WristbandAuthProvider>
    )).toThrow('WristbandAuthProvider: [loginUrl] is required');
    
    expect(() => render(
      <WristbandAuthProvider loginUrl="/login" sessionUrl="/session">
        <div>Test</div>
      </WristbandAuthProvider>
    )).toThrow('WristbandAuthProvider: [logoutUrl] is required');
    
    expect(() => render(
      <WristbandAuthProvider loginUrl="/login" logoutUrl="/logout">
        <div>Test</div>
      </WristbandAuthProvider>
    )).toThrow('WristbandAuthProvider: [sessionUrl] is required');
  });

  it('initializes with loading state', () => {
    // Mock a pending API call that never resolves
    vi.mocked(wristbandApiClient.get).mockImplementation(() => new Promise(() => {}));
    
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
        role: 'admin'
      }
    };
    
    vi.mocked(wristbandApiClient.get).mockResolvedValueOnce({
      data: mockSessionData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
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
    expect(wristbandApiClient.get).toHaveBeenCalledWith(defaultProps.sessionUrl, {
      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',
    });
  });

  it('applies the metadata transform function', async () => {
    const mockSessionData = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: {
        displayName: 'Test User',
        userRole: 'admin',
        email: 'test@example.com'
      }
    };
    
    vi.mocked(wristbandApiClient.get).mockResolvedValueOnce({
      data: mockSessionData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    });
    
    const transformFn = vi.fn((rawMetadata: any) => ({
      name: rawMetadata.displayName,
      role: rawMetadata.userRole,
      email: rawMetadata.email
    }));
    
    render(
      <WristbandAuthProvider 
        {...defaultProps} 
        transformSessionMetadata={transformFn}
      >
        <TestConsumer />
      </WristbandAuthProvider>
    );
    
    await waitFor(() => {
      expect(transformFn).toHaveBeenCalledWith(mockSessionData.metadata);
      const displayedMetadata = JSON.parse(screen.getByTestId('metadata').textContent || '{}');
      expect(displayedMetadata).toEqual({
        name: 'Test User',
        role: 'admin',
        email: 'test@example.com'
      });
    });
  });

  it('calls onSessionSuccess callback after successful session fetch', async () => {
    const mockSessionData = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { name: 'Test User' }
    };
    
    vi.mocked(wristbandApiClient.get).mockResolvedValueOnce({
      data: mockSessionData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    });
    
    const onSessionSuccessMock = vi.fn();
    
    render(
      <WristbandAuthProvider 
        {...defaultProps} 
        onSessionSuccess={onSessionSuccessMock}
      >
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
    
    const { redirectToLogin } = await import('../utils/auth');
    
    vi.mocked(wristbandApiClient.get).mockRejectedValueOnce({
      status: 401,
      message: 'Unauthorized'
    });
    
    render(
      <WristbandAuthProvider {...defaultProps}>
        <TestConsumer />
      </WristbandAuthProvider>
    );
    
    await waitFor(() => {
      expect(redirectToLogin).toHaveBeenCalledWith(
        defaultProps.loginUrl,
        { returnUrl: expect.any(String) }
      );
    });
  });

  it('redirects to logout on other errors by default', async () => {
    // Mock console.log to prevent error output in tests
    console.log = vi.fn();
    
    const { redirectToLogout } = await import('../utils/auth');
    
    vi.mocked(wristbandApiClient.get).mockRejectedValueOnce({
      status: 500,
      message: 'Server Error'
    });
    
    render(
      <WristbandAuthProvider {...defaultProps}>
        <TestConsumer />
      </WristbandAuthProvider>
    );
    
    await waitFor(() => {
      expect(redirectToLogout).toHaveBeenCalledWith(defaultProps.logoutUrl);
    });
  });

  it('does not redirect when disableRedirectOnUnauthenticated is true', async () => {
    // Mock console.log to prevent error output in tests
    console.log = vi.fn();
    
    const { redirectToLogin, redirectToLogout } = await import('../utils/auth');
    
    vi.mocked(wristbandApiClient.get).mockRejectedValueOnce({
      status: 401,
      message: 'Unauthorized'
    });
    
    render(
      <WristbandAuthProvider {...defaultProps} disableRedirectOnUnauthenticated={true}>
        <TestConsumer />
      </WristbandAuthProvider>
    );
    
    await waitFor(() => {
      expect(redirectToLogin).not.toHaveBeenCalled();
      expect(redirectToLogout).not.toHaveBeenCalled();
      expect(screen.getByTestId('auth-status').textContent).toBe(AuthStatus.UNAUTHENTICATED.toString());
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });
  });

  it('allows updating metadata via updateMetadata method', async () => {
    const mockSessionData = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: { name: 'Test User' }
    };
    
    vi.mocked(wristbandApiClient.get).mockResolvedValueOnce({
      data: mockSessionData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
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
    expect(JSON.parse(screen.getByTestId('metadata').textContent || '{}')).toEqual(
      { name: 'Test User' }
    );
    
    // Trigger metadata update - wrapped in act()
    await act(async () => {
      screen.getByTestId('update-metadata').click();
    });
    
    // Check updated metadata (merges with existing)
    await waitFor(() => {
      const updatedMetadata = JSON.parse(screen.getByTestId('metadata').textContent || '{}');
      expect(updatedMetadata).toEqual({
        name: 'Test User',
        newProp: 'updated value'
      });
    });
  });
});
