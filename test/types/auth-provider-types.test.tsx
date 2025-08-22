import { describe, it, expect } from 'vitest';

import {
  AuthStatus,
  IWristbandAuthContext,
  IWristbandAuthProviderProps,
  SessionResponse,
} from '../../src/types/auth-provider-types';

describe('Auth Provider Types', () => {
  // Test AuthStatus enum values
  it('should have the correct AuthStatus enum values', () => {
    expect(AuthStatus.LOADING).toBe('LOADING');
    expect(AuthStatus.AUTHENTICATED).toBe('AUTHENTICATED');
    expect(AuthStatus.UNAUTHENTICATED).toBe('UNAUTHENTICATED');
  });

  // Test that interfaces exist and can be used
  it('should allow creating objects that match the auth context interface', () => {
    // Create a valid context object
    const contextValue: IWristbandAuthContext = {
      authError: null,
      authStatus: AuthStatus.AUTHENTICATED,
      isAuthenticated: true,
      isLoading: false,
      metadata: {},
      tenantId: 'tenant-123',
      userId: 'user-456',
      updateMetadata: () => {},
      clearAuthData: () => {},
      clearToken: () => {},
      getToken: () => Promise.resolve(''),
    };

    expect(contextValue).toBeDefined();
    expect(contextValue.authError).toBeNull();
    expect(contextValue.authStatus).toBe(AuthStatus.AUTHENTICATED);
    expect(contextValue.isAuthenticated).toBe(true);
    expect(contextValue.isLoading).toBe(false);
    expect(contextValue.tenantId).toBe('tenant-123');
    expect(contextValue.userId).toBe('user-456');
    expect(typeof contextValue.updateMetadata).toBe('function');
  });

  it('should allow creating objects that match the auth provider props interface', () => {
    // Create a valid props object with required fields
    const minimalProps: IWristbandAuthProviderProps = {
      loginUrl: '/login',
      sessionUrl: '/session',
    };

    // Create a valid props object with all fields
    const fullProps: IWristbandAuthProviderProps = {
      loginUrl: '/login',
      sessionUrl: '/session',
      csrfCookieName: 'CSRF-TOKEN',
      csrfHeaderName: 'X-CSRF-TOKEN',
      disableRedirectOnUnauthenticated: true,
      onSessionSuccess: () => {},
      transformSessionMetadata: () => ({ transformed: true }),
      children: <div>Test Children</div>,
    };

    expect(minimalProps).toBeDefined();
    expect(minimalProps.loginUrl).toBe('/login');
    expect(minimalProps.sessionUrl).toBe('/session');

    expect(fullProps).toBeDefined();
    expect(fullProps.csrfCookieName).toBe('CSRF-TOKEN');
    expect(fullProps.csrfHeaderName).toBe('X-CSRF-TOKEN');
    expect(fullProps.disableRedirectOnUnauthenticated).toBe(true);
    expect(typeof fullProps.onSessionSuccess).toBe('function');
    expect(typeof fullProps.transformSessionMetadata).toBe('function');
    expect(fullProps.children).toBeDefined();
  });

  it('should allow creating objects that match the session response interface', () => {
    const sessionResponse: SessionResponse = {
      metadata: { role: 'admin' },
      userId: 'user-123',
      tenantId: 'tenant-456',
    };

    expect(sessionResponse).toBeDefined();
    expect(sessionResponse.userId).toBe('user-123');
    expect(sessionResponse.tenantId).toBe('tenant-456');
    expect(sessionResponse.metadata).toEqual({ role: 'admin' });
  });

  // Test generic type parameter for IWristbandAuthContext
  it('should support generic metadata type in IWristbandAuthContext', () => {
    interface UserMetadata {
      name: string;
      role: string;
    }

    const typedContext: IWristbandAuthContext<UserMetadata> = {
      authError: null,
      authStatus: AuthStatus.AUTHENTICATED,
      isAuthenticated: true,
      isLoading: false,
      metadata: { name: 'Test User', role: 'admin' },
      tenantId: 'tenant-123',
      userId: 'user-456',
      updateMetadata: () => {},
      clearAuthData: () => {},
      clearToken: () => {},
      getToken: () => Promise.resolve(''),
    };

    // Check that the metadata has the expected properties
    expect(typedContext.metadata.name).toBe('Test User');
    expect(typedContext.metadata.role).toBe('admin');
  });

  // Test generic type parameter for IWristbandAuthProviderProps
  it('should support generic metadata type in IWristbandAuthProviderProps', () => {
    interface UserMetadata {
      name: string;
      role: string;
    }

    // Create a transform function with proper typing
    const transformFn = (rawData: unknown): UserMetadata => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = rawData as any;
      return {
        name: data.displayName || '',
        role: data.userRole || '',
      };
    };

    const typedProps: IWristbandAuthProviderProps<UserMetadata> = {
      loginUrl: '/login',
      sessionUrl: '/session',
      transformSessionMetadata: transformFn,
    };

    expect(typedProps).toBeDefined();
    expect(typeof typedProps.transformSessionMetadata).toBe('function');

    // Test the transform function works as expected
    const result = typedProps.transformSessionMetadata?.({ displayName: 'Jane Doe', userRole: 'admin' });

    expect(result).toEqual({ name: 'Jane Doe', role: 'admin' });
  });
});
