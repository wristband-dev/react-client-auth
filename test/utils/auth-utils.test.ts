import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { redirectToLogin, redirectToLogout } from '../../src/utils/auth-utils';

describe('Auth utilities', () => {
  // Store the original window.location.href
  let originalHref: string;
  let originalOrigin: string;

  beforeEach(() => {
    // Store the original location href and origin
    originalHref = window.location.href;
    originalOrigin = window.location.origin;

    // Create a more complete mock of window.location
    const locationMock = {
      href: 'https://current-page.com/path',
      origin: 'https://current-page.com',
      pathname: '/path',
      search: '',
      hash: '',
      protocol: 'https:',
      host: 'current-page.com',
      hostname: 'current-page.com',
    };

    // Use defineProperty to mock window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: locationMock,
    });
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        href: originalHref,
        origin: originalOrigin,
      },
    });
  });

  describe('redirectToLogin', () => {
    it('should throw if loginUrl is not provided', () => {
      expect(() => redirectToLogin('')).toThrow('Redirect To Login: [loginUrl] is required');
      expect(() => redirectToLogin(null as unknown as string)).toThrow('Redirect To Login: [loginUrl] is required');
      expect(() => redirectToLogin(undefined as unknown as string)).toThrow(
        'Redirect To Login: [loginUrl] is required'
      );
    });

    it('should throw for invalid URLs', () => {
      // Based on URL constructor behavior, these should definitely throw
      expect(() => redirectToLogin('http://')).toThrow();
      expect(() => redirectToLogin('//')).toThrow();
    });

    it('should throw if loginUrl contains reserved query parameters', () => {
      expect(() => redirectToLogin('/api/auth/login?login_hint=user@example.com')).toThrow();
      expect(() => redirectToLogin('/api/auth/login?login_hint=user@example.com')).toThrow(
        'loginUrl must not include reserved query param: "login_hint"'
      );

      expect(() => redirectToLogin('/api/auth/login?return_url=https://example.com')).toThrow();
      expect(() => redirectToLogin('/api/auth/login?return_url=https://example.com')).toThrow(
        'loginUrl must not include reserved query param: "return_url"'
      );

      expect(() => redirectToLogin('/api/auth/login?tenant_domain=example')).toThrow();
      expect(() => redirectToLogin('/api/auth/login?tenant_domain=example')).toThrow(
        'loginUrl must not include reserved query param: "tenant_domain"'
      );

      expect(() => redirectToLogin('/api/auth/login?tenant_custom_domain=example.com')).toThrow();
      expect(() => redirectToLogin('/api/auth/login?tenant_custom_domain=example.com')).toThrow(
        'loginUrl must not include reserved query param: "tenant_custom_domain"'
      );
    });

    it('should handle absolute URLs correctly', async () => {
      redirectToLogin('https://auth.example.com/login');
      const url = window.location.href;
      expect(url).toContain('https://auth.example.com/login');
      expect(url).not.toContain('return_url=');
      expect(url).not.toContain('login_hint=');
      expect(url).not.toContain('tenant_domain=');
      expect(url).not.toContain('tenant_custom_domain=');
    });

    it('should preserve existing query parameters in the loginUrl', async () => {
      redirectToLogin('/api/auth/login?theme=dark');
      const url = window.location.href;
      expect(url).toContain('theme=dark');
      expect(url).not.toContain('return_url=');
      expect(url).not.toContain('login_hint=');
      expect(url).not.toContain('tenant_domain=');
      expect(url).not.toContain('tenant_custom_domain=');
    });

    it('should redirect with custom return URL if provided', async () => {
      redirectToLogin('/api/auth/login', { returnUrl: 'https://app.example.com/dashboard' });
      const url = window.location.href;
      expect(url).toContain('/api/auth/login');
      expect(url).toContain('return_url=https%3A%2F%2Fapp.example.com%2Fdashboard');
      expect(url).not.toContain('login_hint=');
      expect(url).not.toContain('tenant_domain=');
      expect(url).not.toContain('tenant_custom_domain=');
    });

    it('should include login hint if provided', async () => {
      redirectToLogin('/api/auth/login', { loginHint: 'user@example.com' });
      const url = window.location.href;
      expect(url).toContain('/api/auth/login');
      expect(url).toContain('login_hint=user%40example.com');
      expect(url).not.toContain('return_url=');
      expect(url).not.toContain('tenant_domain=');
      expect(url).not.toContain('tenant_custom_domain=');
    });

    it('should include tenant domain if provided', async () => {
      redirectToLogin('/api/auth/login', { tenantDomain: 'acme-corp' });
      const url = window.location.href;
      expect(url).toContain('/api/auth/login');
      expect(url).toContain('tenant_domain=acme-corp');
      expect(url).not.toContain('return_url=');
      expect(url).not.toContain('login_hint=');
      expect(url).not.toContain('tenant_custom_domain=');
    });

    it('should include tenant custom domain if provided', async () => {
      redirectToLogin('/api/auth/login', { tenantCustomDomain: 'auth.acme.com' });
      const url = window.location.href;
      expect(url).toContain('/api/auth/login');
      expect(url).toContain('tenant_custom_domain=auth.acme.com');
      expect(url).not.toContain('return_url=');
      expect(url).not.toContain('login_hint=');
      expect(url).not.toContain('tenant_domain=');
    });

    it('should include all parameters if provided', async () => {
      redirectToLogin('/api/auth/login', {
        loginHint: 'user@example.com',
        returnUrl: 'https://app.example.com/dashboard',
        tenantDomain: 'acme-corp',
        tenantCustomDomain: 'auth.acme.com',
      });

      // Since URLSearchParams doesn't guarantee order, we need to check for the presence of each parameter
      const url = window.location.href;
      expect(url).toContain('/api/auth/login?');
      expect(url).toContain('login_hint=user%40example.com');
      expect(url).toContain('return_url=https%3A%2F%2Fapp.example.com%2Fdashboard');
      expect(url).toContain('tenant_domain=acme-corp');
      expect(url).toContain('tenant_custom_domain=auth.acme.com');
    });
  });

  describe('redirectToLogout', () => {
    it('should throw if logoutUrl is not provided', () => {
      expect(() => redirectToLogout('')).toThrow('Redirect To Logout: [logoutUrl] is required');
      expect(() => redirectToLogout(null as unknown as string)).toThrow('Redirect To Logout: [logoutUrl] is required');
      expect(() => redirectToLogout(undefined as unknown as string)).toThrow(
        'Redirect To Logout: [logoutUrl] is required'
      );
    });

    it('should throw for invalid URLs', () => {
      // Based on URL constructor behavior, these should definitely throw
      expect(() => redirectToLogout('http://')).toThrow();
      expect(() => redirectToLogout('//')).toThrow();
    });

    it('should throw if logoutUrl contains reserved query parameters', () => {
      expect(() => redirectToLogout('/api/auth/logout?tenant_domain=example')).toThrow();
      expect(() => redirectToLogout('/api/auth/logout?tenant_domain=example')).toThrow(
        'logoutUrl must not include reserved query param: "tenant_domain"'
      );

      expect(() => redirectToLogout('/api/auth/logout?tenant_custom_domain=example.com')).toThrow();
      expect(() => redirectToLogout('/api/auth/logout?tenant_custom_domain=example.com')).toThrow(
        'logoutUrl must not include reserved query param: "tenant_custom_domain"'
      );
    });

    it('should handle absolute URLs correctly', async () => {
      redirectToLogout('https://auth.example.com/logout');
      expect(window.location.href).toContain('https://auth.example.com/logout');
    });

    it('should preserve existing query parameters in the logoutUrl', async () => {
      redirectToLogout('/api/auth/logout?theme=dark');
      const url = window.location.href;
      expect(url).toContain('/api/auth/logout');
      expect(url).toContain('theme=dark');
    });

    it('should redirect to the logout URL with no parameters by default', async () => {
      redirectToLogout('/api/auth/logout');
      const url = window.location.href;
      expect(url).toContain('/api/auth/logout');
      // Check if there are no parameters or empty parameters
      const urlParts = url.split('?');
      if (urlParts.length > 1) {
        // If there's a '?', ensure what follows is empty or just contains '='
        expect(urlParts[1].replace(/=/g, '')).toBe('');
      }
    });

    it('should include tenant domain if provided', async () => {
      redirectToLogout('/api/auth/logout', { tenantDomain: 'acme-corp' });
      const url = window.location.href;
      expect(url).toContain('/api/auth/logout');
      expect(url).toContain('tenant_domain=acme-corp');
    });

    it('should include tenant custom domain if provided', async () => {
      redirectToLogout('/api/auth/logout', { tenantCustomDomain: 'auth.acme.com' });
      const url = window.location.href;
      expect(url).toContain('/api/auth/logout');
      expect(url).toContain('tenant_custom_domain=auth.acme.com');
    });

    it('should include all parameters if provided', async () => {
      redirectToLogout('/api/auth/logout', {
        tenantDomain: 'acme-corp',
        tenantCustomDomain: 'auth.acme.com',
      });

      const url = window.location.href;
      expect(url).toContain('/api/auth/logout?');
      expect(url).toContain('tenant_domain=acme-corp');
      expect(url).toContain('tenant_custom_domain=auth.acme.com');
    });
  });
});
