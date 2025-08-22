import { describe, it, expect } from 'vitest';

import { LoginRedirectConfig, LogoutRedirectConfig } from '../../src/types/util-types';

describe('Utility Types', () => {
  it('should allow creating LoginRedirectConfig objects with various properties', () => {
    // Empty config
    const emptyConfig: LoginRedirectConfig = {};
    expect(emptyConfig).toBeDefined();

    // Partial config with some properties
    const partialConfig: LoginRedirectConfig = {
      loginHint: 'user@example.com',
      returnUrl: '/dashboard',
    };
    expect(partialConfig.loginHint).toBe('user@example.com');
    expect(partialConfig.returnUrl).toBe('/dashboard');

    // Complete config with all properties
    const fullConfig: LoginRedirectConfig = {
      loginHint: 'admin@example.com',
      returnUrl: '/admin-dashboard',
      tenantDomain: 'acme-corp',
      tenantCustomDomain: 'auth.acme.com',
    };

    expect(fullConfig.loginHint).toBe('admin@example.com');
    expect(fullConfig.returnUrl).toBe('/admin-dashboard');
    expect(fullConfig.tenantDomain).toBe('acme-corp');
    expect(fullConfig.tenantCustomDomain).toBe('auth.acme.com');
  });

  it('should allow creating LogoutRedirectConfig objects with various properties', () => {
    // Empty config
    const emptyConfig: LogoutRedirectConfig = {};
    expect(emptyConfig).toBeDefined();

    // Partial config with tenantDomain only
    const domainOnlyConfig: LogoutRedirectConfig = {
      tenantDomain: 'acme-corp',
    };
    expect(domainOnlyConfig.tenantDomain).toBe('acme-corp');
    expect(domainOnlyConfig.tenantCustomDomain).toBeUndefined();

    // Partial config with tenantCustomDomain only
    const customDomainOnlyConfig: LogoutRedirectConfig = {
      tenantCustomDomain: 'auth.acme.com',
    };
    expect(customDomainOnlyConfig.tenantCustomDomain).toBe('auth.acme.com');
    expect(customDomainOnlyConfig.tenantDomain).toBeUndefined();

    // Complete config with all properties
    const fullConfig: LogoutRedirectConfig = {
      tenantDomain: 'acme-corp',
      tenantCustomDomain: 'auth.acme.com',
    };

    expect(fullConfig.tenantDomain).toBe('acme-corp');
    expect(fullConfig.tenantCustomDomain).toBe('auth.acme.com');
  });

  it('should enforce property types for LoginRedirectConfig', () => {
    const config: LoginRedirectConfig = {
      loginHint: 'user@example.com',
      returnUrl: '/dashboard',
      tenantDomain: 'acme-corp',
      tenantCustomDomain: 'auth.acme.com',
    };

    expect(typeof config.loginHint).toBe('string');
    expect(typeof config.returnUrl).toBe('string');
    expect(typeof config.tenantDomain).toBe('string');
    expect(typeof config.tenantCustomDomain).toBe('string');
  });

  it('should enforce property types for LogoutRedirectConfig', () => {
    const config: LogoutRedirectConfig = {
      tenantDomain: 'acme-corp',
      tenantCustomDomain: 'auth.acme.com',
    };

    expect(typeof config.tenantDomain).toBe('string');
    expect(typeof config.tenantCustomDomain).toBe('string');
  });
});
