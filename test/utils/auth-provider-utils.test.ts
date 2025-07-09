import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  delay,
  is4xxError,
  isHttpStatusError,
  isUnauthorizedError,
  resolveAuthProviderLoginUrl,
  validateAuthProviderLogoutUrl,
  validateAuthProviderSessionUrl,
  validateAuthProviderTokenUrl,
} from '../../src/utils/auth-provider-utils';
import { ApiError } from '../../src/error';

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

  describe('isHttpStatusError', () => {
    it('should return true for ApiError with matching status code', () => {
      const error = new ApiError('Request failed with status code 404');
      error.status = 404;
      expect(isHttpStatusError(error, 404)).toBe(true);
    });

    it('should return false for ApiError with non-matching status code', () => {
      const error = new ApiError('Request failed with status code 404');
      error.status = 404;
      expect(isHttpStatusError(error, 500)).toBe(false);
    });

    it('should return false for non-ApiError instances', () => {
      const error = new Error('Generic error');
      expect(isHttpStatusError(error, 404)).toBe(false);
    });

    it('should throw TypeError for null error', () => {
      expect(() => isHttpStatusError(null, 404)).toThrow(TypeError);
      expect(() => isHttpStatusError(null, 404)).toThrow('Argument [error] cannot be null or undefined');
    });

    it('should throw TypeError for undefined error', () => {
      expect(() => isHttpStatusError(undefined, 404)).toThrow(TypeError);
      expect(() => isHttpStatusError(undefined, 404)).toThrow('Argument [error] cannot be null or undefined');
    });
  });

  describe('isUnauthorizedError', () => {
    it('should return true for 401 Unauthorized ApiError', () => {
      const error = new ApiError('Request failed with status code 401');
      error.status = 401;
      expect(isUnauthorizedError(error)).toBe(true);
    });

    it('should return false for non-401 ApiError', () => {
      const error = new ApiError('Request failed with status code 404');
      error.status = 404;
      expect(isUnauthorizedError(error)).toBe(false);
    });

    it('should return false for non-ApiError instances', () => {
      const error = new Error('Generic error');
      expect(isUnauthorizedError(error)).toBe(false);
    });

    it('should throw TypeError for null or undefined errors', () => {
      expect(() => isUnauthorizedError(null)).toThrow('Argument [error] cannot be null or undefined');
      expect(() => isUnauthorizedError(undefined)).toThrow('Argument [error] cannot be null or undefined');
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

  // Add these test cases to your existing auth-provider-utils test file:

  // Add these test cases to your existing auth-provider-utils test file:

  describe('is4xxError', () => {
    it('should return true for 4xx status codes', () => {
      const testCases = [400, 401, 403, 404, 422, 429, 499];

      testCases.forEach((status) => {
        const error = new ApiError(`Request failed with status code ${status}`);
        error.status = status;
        expect(is4xxError(error)).toBe(true);
      });
    });

    it('should return false for non-4xx status codes', () => {
      const testCases = [200, 201, 300, 301, 500, 502, 503];

      testCases.forEach((status) => {
        const error = new ApiError(`Request failed with status code ${status}`);
        error.status = status;
        expect(is4xxError(error)).toBe(false);
      });
    });

    it('should return false for ApiError without status property', () => {
      const error = new ApiError('Generic error');
      // Don't set error.status
      expect(is4xxError(error)).toBe(false);
    });

    it('should return false for ApiError with undefined status', () => {
      const error = new ApiError('Generic error');
      error.status = undefined;
      expect(is4xxError(error)).toBe(false);
    });

    it('should return false for non-ApiError instances', () => {
      const error = new Error('Generic error');
      expect(is4xxError(error)).toBe(false);
    });

    it('should throw TypeError for null error', () => {
      expect(() => is4xxError(null)).toThrow(TypeError);
      expect(() => is4xxError(null)).toThrow('Argument [error] cannot be null or undefined');
    });

    it('should throw TypeError for undefined error', () => {
      expect(() => is4xxError(undefined)).toThrow(TypeError);
      expect(() => is4xxError(undefined)).toThrow('Argument [error] cannot be null or undefined');
    });
  });

  describe('delay', () => {
    it('should resolve after the specified delay', async () => {
      const start = Date.now();
      await delay(100);
      const end = Date.now();

      // Allow some tolerance for timing (should be at least 100ms, but not more than 200ms)
      expect(end - start).toBeGreaterThanOrEqual(90); // Account for timer precision
      expect(end - start).toBeLessThan(200); // Reasonable upper bound
    });

    it('should resolve immediately for 0ms delay', async () => {
      const start = Date.now();
      await delay(0);
      const end = Date.now();

      // Should resolve very quickly
      expect(end - start).toBeLessThan(50);
    });

    it('should return a Promise', () => {
      const result = delay(10);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve to undefined', async () => {
      const result = await delay(10);
      expect(result).toBeUndefined();
    });
  });

  // Add test for server-side rendering scenarios
  describe('Server-side rendering compatibility', () => {
    let originalWindow: typeof window;

    beforeEach(() => {
      originalWindow = global.window;
    });

    afterEach(() => {
      global.window = originalWindow;
    });

    it('resolveAuthProviderLoginUrl should return original URL when window is undefined', () => {
      // Simulate server-side environment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window;

      const loginUrl = '/api/auth/login';
      const result = resolveAuthProviderLoginUrl(loginUrl);

      expect(result).toBe(loginUrl);
    });

    it('validateAuthProviderLogoutUrl should not throw when window is undefined', () => {
      // Simulate server-side environment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window;
      expect(() => validateAuthProviderLogoutUrl('/api/auth/logout')).not.toThrow();
    });

    it('validateAuthProviderSessionUrl should not throw when window is undefined', () => {
      // Simulate server-side environment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window;
      expect(() => validateAuthProviderSessionUrl('/api/auth/session')).not.toThrow();
    });

    it('validateAuthProviderTokenUrl should not throw when window is undefined', () => {
      // Simulate server-side environment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window;
      expect(() => validateAuthProviderTokenUrl('/api/auth/token')).not.toThrow();
    });
  });

  // Add edge cases for resolveAuthProviderLoginUrl
  describe('resolveAuthProviderLoginUrl - additional edge cases', () => {
    it('should handle URLs with existing query parameters and add return_url', () => {
      const result = resolveAuthProviderLoginUrl('/api/auth/login?existing=param');
      expect(result).toContain('existing=param');
      expect(result).toContain('return_url=https%3A%2F%2Fcurrent-page.com%2Fpath');
    });

    it('should handle URLs with fragments', () => {
      const result = resolveAuthProviderLoginUrl('/api/auth/login#section');
      expect(result).toContain('#section');
      expect(result).toContain('return_url=https%3A%2F%2Fcurrent-page.com%2Fpath');
    });

    it('should handle whitespace-only URLs', () => {
      expect(() => resolveAuthProviderLoginUrl('   ')).toThrow('WristbandAuthProvider: [loginUrl] is required');
    });

    it('should preserve complex return_url if already present', () => {
      const existingReturnUrl = 'https://example.com/callback?param=value&other=test';
      const loginUrl = `/api/auth/login?return_url=${encodeURIComponent(existingReturnUrl)}`;
      const result = resolveAuthProviderLoginUrl(loginUrl);

      expect(result).toContain(`return_url=${encodeURIComponent(existingReturnUrl)}`);
      expect(result).not.toContain('return_url=https%3A%2F%2Fcurrent-page.com%2Fpath');
    });
  });

  // Add edge cases for validation functions
  describe('URL validation - additional edge cases', () => {
    it('validateAuthProviderLogoutUrl should handle whitespace-only URLs', () => {
      expect(() => validateAuthProviderLogoutUrl('   ')).toThrow('WristbandAuthProvider: [logoutUrl] is required');
    });

    it('validateAuthProviderSessionUrl should handle whitespace-only URLs', () => {
      expect(() => validateAuthProviderSessionUrl('   ')).toThrow('WristbandAuthProvider: [sessionUrl] is required');
    });

    it('validateAuthProviderTokenUrl should not throw for whitespace-only URLs (optional param)', () => {
      expect(() => validateAuthProviderTokenUrl('   ')).not.toThrow();
    });
  });
});
