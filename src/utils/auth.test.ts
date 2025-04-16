import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { redirectToLogin, redirectToLogout, isHttpStatusError, isUnauthorizedError, isForbiddenError } from './auth';
import { AxiosError } from 'axios';

describe('Auth utilities', () => {
  // Store the original window.location.href
  let originalHref: string;

  beforeEach(() => {
    // Store the original location href
    originalHref = window.location.href;
    
    // Use defineProperty to mock window.location.href
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'https://current-page.com/path' }
    });
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: originalHref }
    });
  });

  describe('redirectToLogin', () => {
    it('should redirect to the login URL with default parameters', async () => {
      // Act
      await redirectToLogin('/api/auth/login');
      
      // Assert
      expect(window.location.href).toBe('/api/auth/login?return_url=https%3A%2F%2Fcurrent-page.com%2Fpath');
    });

    it('should redirect with custom return URL if provided', async () => {
      // Act
      await redirectToLogin('/api/auth/login', {
        returnUrl: 'https://app.example.com/dashboard'
      });
      
      // Assert
      expect(window.location.href).toBe('/api/auth/login?return_url=https%3A%2F%2Fapp.example.com%2Fdashboard');
    });

    it('should include login hint if provided', async () => {
      // Act
      await redirectToLogin('/api/auth/login', {
        loginHint: 'user@example.com'
      });
      
      // Assert
      expect(window.location.href).toBe(
        '/api/auth/login?login_hint=user%40example.com&return_url=https%3A%2F%2Fcurrent-page.com%2Fpath'
      );
    });

    it('should include tenant domain if provided', async () => {
      // Act
      await redirectToLogin('/api/auth/login', {
        tenantDomain: 'acme-corp'
      });
      
      // Assert
      expect(window.location.href).toBe(
        '/api/auth/login?return_url=https%3A%2F%2Fcurrent-page.com%2Fpath&tenant_domain=acme-corp'
      );
    });

    it('should include tenant custom domain if provided', async () => {
      // Act
      await redirectToLogin('/api/auth/login', {
        tenantCustomDomain: 'auth.acme.com'
      });
      
      // Assert
      expect(window.location.href).toBe(
        '/api/auth/login?return_url=https%3A%2F%2Fcurrent-page.com%2Fpath&tenant_custom_domain=auth.acme.com'
      );
    });

    it('should include all parameters if provided', async () => {
      // Act
      await redirectToLogin('/api/auth/login', {
        loginHint: 'user@example.com',
        returnUrl: 'https://app.example.com/dashboard',
        tenantDomain: 'acme-corp',
        tenantCustomDomain: 'auth.acme.com'
      });
      
      // Assert
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
    it('should redirect to the logout URL with no parameters by default', async () => {
      // Act
      await redirectToLogout('/api/auth/logout');
      
      // Assert
      expect(window.location.href).toBe('/api/auth/logout');
    });

    it('should include tenant domain if provided', async () => {
      // Act
      await redirectToLogout('/api/auth/logout', {
        tenantDomain: 'acme-corp'
      });
      
      // Assert
      expect(window.location.href).toBe('/api/auth/logout?tenant_domain=acme-corp');
    });

    it('should include tenant custom domain if provided', async () => {
      // Act
      await redirectToLogout('/api/auth/logout', {
        tenantCustomDomain: 'auth.acme.com'
      });
      
      // Assert
      expect(window.location.href).toBe('/api/auth/logout?tenant_custom_domain=auth.acme.com');
    });

    it('should include all parameters if provided', async () => {
      // Act
      await redirectToLogout('/api/auth/logout', {
        tenantDomain: 'acme-corp',
        tenantCustomDomain: 'auth.acme.com'
      });
      
      // Assert
      const url = window.location.href;
      expect(url).toContain('/api/auth/logout?');
      expect(url).toContain('tenant_domain=acme-corp');
      expect(url).toContain('tenant_custom_domain=auth.acme.com');
    });
  });

  describe('isHttpStatusError', () => {
    it('should return true for Axios error with matching status code', () => {
      // Arrange
      const error = new AxiosError('Request failed with status code 404');
      error.response = { status: 404 } as any;
      
      // Act & Assert
      expect(isHttpStatusError(error, 404)).toBe(true);
    });

    it('should return false for Axios error with non-matching status code', () => {
      // Arrange
      const error = new AxiosError('Request failed with status code 404');
      error.response = { status: 404 } as any;
      
      // Act & Assert
      expect(isHttpStatusError(error, 500)).toBe(false);
    });

    it('should return true for Response object with matching status code', () => {
      // Arrange
      const response = new Response('Not Found', { status: 404 });
      
      // Act & Assert
      expect(isHttpStatusError(response, 404)).toBe(true);
    });

    it('should return false for Response object with non-matching status code', () => {
      // Arrange
      const response = new Response('Not Found', { status: 404 });
      
      // Act & Assert
      expect(isHttpStatusError(response, 500)).toBe(false);
    });

    it('should throw TypeError for null error', () => {
      // Act & Assert
      expect(() => isHttpStatusError(null, 404)).toThrow(TypeError);
      expect(() => isHttpStatusError(null, 404)).toThrow('Argument [error] cannot be null or undefined');
    });

    it('should throw TypeError for undefined error', () => {
      // Act & Assert
      expect(() => isHttpStatusError(undefined, 404)).toThrow(TypeError);
      expect(() => isHttpStatusError(undefined, 404)).toThrow('Argument [error] cannot be null or undefined');
    });

    it('should throw TypeError for invalid error type', () => {
      // Act & Assert
      expect(() => isHttpStatusError('not an error', 404)).toThrow(TypeError);
      expect(() => isHttpStatusError('not an error', 404)).toThrow('Invalid error type');
      
      expect(() => isHttpStatusError(123, 404)).toThrow(TypeError);
      expect(() => isHttpStatusError(123, 404)).toThrow('Invalid error type');
      
      expect(() => isHttpStatusError({}, 404)).toThrow(TypeError);
      expect(() => isHttpStatusError({}, 404)).toThrow('Invalid error type');
    });
  });

  describe('isUnauthorizedError', () => {
    it('should return true for 401 Unauthorized Axios error', () => {
      // Arrange
      const error = new AxiosError('Request failed with status code 401');
      error.response = { status: 401 } as any;
      
      // Act & Assert
      expect(isUnauthorizedError(error)).toBe(true);
    });

    it('should return false for non-401 Axios error', () => {
      // Arrange
      const error = new AxiosError('Request failed with status code 404');
      error.response = { status: 404 } as any;
      
      // Act & Assert
      expect(isUnauthorizedError(error)).toBe(false);
    });

    it('should return true for 401 Response object', () => {
      // Arrange
      const response = new Response('Unauthorized', { status: 401 });
      
      // Act & Assert
      expect(isUnauthorizedError(response)).toBe(true);
    });

    it('should throw TypeError for invalid error type', () => {
      // Act & Assert
      expect(() => isUnauthorizedError('not an error')).toThrow(TypeError);
    });
  });

  describe('isForbiddenError', () => {
    it('should return true for 403 Forbidden Axios error', () => {
      // Arrange
      const error = new AxiosError('Request failed with status code 403');
      error.response = { status: 403 } as any;
      
      // Act & Assert
      expect(isForbiddenError(error)).toBe(true);
    });

    it('should return false for non-403 Axios error', () => {
      // Arrange
      const error = new AxiosError('Request failed with status code 404');
      error.response = { status: 404 } as any;
      
      // Act & Assert
      expect(isForbiddenError(error)).toBe(false);
    });

    it('should return true for 403 Response object', () => {
      // Arrange
      const response = new Response('Forbidden', { status: 403 });
      
      // Act & Assert
      expect(isForbiddenError(response)).toBe(true);
    });

    it('should throw TypeError for invalid error type', () => {
      // Act & Assert
      expect(() => isForbiddenError('not an error')).toThrow(TypeError);
    });
  });
});
