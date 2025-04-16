import { describe, it, expect } from 'vitest';
import { 
  AuthStatus, 
  IWristbandAuthContext, 
  IWristbandAuthProviderProps,
  SessionResponse,
  LoginRedirectConfig,
  LogoutRedirectConfig
} from './types';

describe('Types', () => {
  // Test AuthStatus enum values
  it('should have the correct AuthStatus enum values', () => {
    expect(AuthStatus.LOADING).toBe('loading');
    expect(AuthStatus.AUTHENTICATED).toBe('authenticated');
    expect(AuthStatus.UNAUTHENTICATED).toBe('unauthenticated');
  });

  // Test that interfaces exist and can be used (this is really just checking if they compile)
  it('should allow creating objects that match the interfaces', () => {
    // Create a valid context object
    const contextValue: IWristbandAuthContext = {
      authStatus: AuthStatus.AUTHENTICATED,
      isAuthenticated: true,
      isLoading: false,
      metadata: {},
      tenantId: 'tenant-123',
      userId: 'user-456',
      updateMetadata: (newMetadata) => {}
    };

    // Create a valid props object
    const propsValue: IWristbandAuthProviderProps = {
      loginUrl: '/login',
      logoutUrl: '/logout',
      sessionUrl: '/session'
    };

    // Create other interface objects
    const sessionResponse: SessionResponse = {
      metadata: {},
      userId: 'user-123',
      tenantId: 'tenant-456'
    };

    const loginConfig: LoginRedirectConfig = {
      loginHint: 'user@example.com',
      returnUrl: '/dashboard',
      tenantDomain: 'acme-corp',
      tenantCustomDomain: 'auth.acme.com'
    };

    const logoutConfig: LogoutRedirectConfig = {
      tenantDomain: 'acme-corp',
      tenantCustomDomain: 'auth.acme.com'
    };

    // Just check that these values exist and have the expected type of their interfaces
    // This is primarily a compile-time check
    expect(contextValue).toBeDefined();
    expect(propsValue).toBeDefined();
    expect(sessionResponse).toBeDefined();
    expect(loginConfig).toBeDefined();
    expect(logoutConfig).toBeDefined();
  });

  // Test generic type parameter for IWristbandAuthContext
  it('should support generic metadata type in IWristbandAuthContext', () => {
    interface UserMetadata {
      name: string;
      role: string;
    }

    const typedContext: IWristbandAuthContext<UserMetadata> = {
      authStatus: AuthStatus.AUTHENTICATED,
      isAuthenticated: true,
      isLoading: false,
      metadata: { name: 'Test User', role: 'admin' },
      tenantId: 'tenant-123',
      userId: 'user-456',
      updateMetadata: (newMetadata) => {}
    };

    // Check that the metadata has the expected properties
    expect(typedContext.metadata.name).toBe('Test User');
    expect(typedContext.metadata.role).toBe('admin');
  });
});
