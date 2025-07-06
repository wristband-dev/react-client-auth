import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  resolveAuthProviderLoginUrl,
  validateAuthProviderLogoutUrl,
  validateAuthProviderSessionUrl,
  validateAuthProviderTokenUrl,
} from '../../src/utils/auth-provider-utils';

describe('Auth Provider Utils', () => {
  // Store the original window.location
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

  describe('resolveAuthProviderLoginUrl', () => {
    it('should throw if loginUrl is not provided', () => {
      expect(() => resolveAuthProviderLoginUrl('')).toThrow('WristbandAuthProvider: [loginUrl] is required');
      expect(() => resolveAuthProviderLoginUrl(null as unknown as string)).toThrow(
        'WristbandAuthProvider: [loginUrl] is required'
      );
      expect(() => resolveAuthProviderLoginUrl(undefined as unknown as string)).toThrow(
        'WristbandAuthProvider: [loginUrl] is required'
      );
    });

    it('should throw for invalid URLs', () => {
      expect(() => resolveAuthProviderLoginUrl('http://')).toThrow(
        'WristbandAuthProvider: [http://] is not a valid loginUrl'
      );
      expect(() => resolveAuthProviderLoginUrl('//')).toThrow('WristbandAuthProvider: [//] is not a valid loginUrl');
    });

    it('should add return_url if not present', () => {
      const result = resolveAuthProviderLoginUrl('/api/auth/login');
      expect(result).toContain('/api/auth/login');
      expect(result).toContain('return_url=https%3A%2F%2Fcurrent-page.com%2Fpath');
    });

    it('should preserve return_url if already present', () => {
      const originalReturnUrl = 'https://other-page.com/dashboard';
      const result = resolveAuthProviderLoginUrl(`/api/auth/login?return_url=${encodeURIComponent(originalReturnUrl)}`);
      expect(result).toContain('/api/auth/login');
      expect(result).toContain(`return_url=${encodeURIComponent(originalReturnUrl)}`);
      expect(result).not.toContain('return_url=https%3A%2F%2Fcurrent-page.com%2Fpath');
    });

    it('should preserve other query parameters', () => {
      const result = resolveAuthProviderLoginUrl('/api/auth/login?theme=dark&lang=en');
      expect(result).toContain('/api/auth/login');
      expect(result).toContain('theme=dark');
      expect(result).toContain('lang=en');
      expect(result).toContain('return_url=https%3A%2F%2Fcurrent-page.com%2Fpath');
    });

    it('should handle absolute URLs correctly', () => {
      const result = resolveAuthProviderLoginUrl('https://auth.example.com/login');
      expect(result).toContain('https://auth.example.com/login');
      expect(result).toContain('return_url=https%3A%2F%2Fcurrent-page.com%2Fpath');
    });
  });

  describe('validateAuthProviderLogoutUrl', () => {
    it('should throw if logoutUrl is not provided', () => {
      expect(() => validateAuthProviderLogoutUrl('')).toThrow('WristbandAuthProvider: [logoutUrl] is required');
      expect(() => validateAuthProviderLogoutUrl(null as unknown as string)).toThrow(
        'WristbandAuthProvider: [logoutUrl] is required'
      );
      expect(() => validateAuthProviderLogoutUrl(undefined as unknown as string)).toThrow(
        'WristbandAuthProvider: [logoutUrl] is required'
      );
    });

    it('should throw for invalid URLs', () => {
      expect(() => validateAuthProviderLogoutUrl('http://')).toThrow(
        'WristbandAuthProvider: [http://] is not a valid logoutUrl'
      );
      expect(() => validateAuthProviderLogoutUrl('//')).toThrow('WristbandAuthProvider: [//] is not a valid logoutUrl');
    });

    it('should not throw for valid URLs', () => {
      expect(() => validateAuthProviderLogoutUrl('/api/auth/logout')).not.toThrow();
      expect(() => validateAuthProviderLogoutUrl('https://auth.example.com/logout')).not.toThrow();
      expect(() => validateAuthProviderLogoutUrl('/api/auth/logout?tenant=example')).not.toThrow();
    });
  });

  describe('validateAuthProviderSessionUrl', () => {
    it('should throw if sessionUrl is not provided', () => {
      expect(() => validateAuthProviderSessionUrl('')).toThrow('WristbandAuthProvider: [sessionUrl] is required');
      expect(() => validateAuthProviderSessionUrl(null as unknown as string)).toThrow(
        'WristbandAuthProvider: [sessionUrl] is required'
      );
      expect(() => validateAuthProviderSessionUrl(undefined as unknown as string)).toThrow(
        'WristbandAuthProvider: [sessionUrl] is required'
      );
    });

    it('should throw for invalid URLs', () => {
      expect(() => validateAuthProviderSessionUrl('http://')).toThrow(
        'WristbandAuthProvider: [http://] is not a valid sessionUrl'
      );
      expect(() => validateAuthProviderSessionUrl('//')).toThrow(
        'WristbandAuthProvider: [//] is not a valid sessionUrl'
      );
    });

    it('should not throw for valid URLs', () => {
      expect(() => validateAuthProviderSessionUrl('/api/auth/session')).not.toThrow();
      expect(() => validateAuthProviderSessionUrl('https://auth.example.com/session')).not.toThrow();
      expect(() => validateAuthProviderSessionUrl('/api/auth/session?format=json')).not.toThrow();
    });
  });

  describe('validateAuthProviderTokenUrl', () => {
    it('should not throw if tokenUrl is undefined (optional parameter)', () => {
      expect(() => validateAuthProviderTokenUrl(undefined)).not.toThrow();
      expect(() => validateAuthProviderTokenUrl()).not.toThrow();
    });

    it('should not throw if tokenUrl is empty string', () => {
      expect(() => validateAuthProviderTokenUrl('')).not.toThrow();
    });

    it('should not throw if tokenUrl is null', () => {
      expect(() => validateAuthProviderTokenUrl(null as unknown as string)).not.toThrow();
    });

    it('should throw for invalid URLs when tokenUrl is provided', () => {
      expect(() => validateAuthProviderTokenUrl('http://')).toThrow(
        'WristbandAuthProvider: [http://] is not a valid tokenUrl'
      );
      expect(() => validateAuthProviderTokenUrl('//')).toThrow('WristbandAuthProvider: [//] is not a valid tokenUrl');
    });

    it('should not throw for valid URLs when tokenUrl is provided', () => {
      expect(() => validateAuthProviderTokenUrl('/api/auth/token')).not.toThrow();
      expect(() => validateAuthProviderTokenUrl('https://auth.example.com/token')).not.toThrow();
      expect(() => validateAuthProviderTokenUrl('/api/auth/token?format=json')).not.toThrow();
    });

    it('should handle relative URLs correctly', () => {
      expect(() => validateAuthProviderTokenUrl('/api/auth/token')).not.toThrow();
      expect(() => validateAuthProviderTokenUrl('api/auth/token')).not.toThrow();
    });

    it('should handle absolute URLs correctly', () => {
      expect(() => validateAuthProviderTokenUrl('https://auth.example.com/token')).not.toThrow();
      expect(() => validateAuthProviderTokenUrl('http://localhost:3000/api/auth/token')).not.toThrow();
    });

    it('should handle URLs with query parameters', () => {
      expect(() => validateAuthProviderTokenUrl('/api/auth/token?tenant=example&format=json')).not.toThrow();
      expect(() => validateAuthProviderTokenUrl('https://auth.example.com/token?scope=read')).not.toThrow();
    });
  });
});
