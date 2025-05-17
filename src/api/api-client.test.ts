import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import apiClient from './api-client';
import { ApiError } from '../types/api-client-types';

// Mock the fetch function
global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();

    // Mock document.cookie for CSRF token tests
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'CSRF-TOKEN=test-csrf-token; path=/;',
    });
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  describe('get method', () => {
    it('should make a GET request with default options', async () => {
      // Mock successful response
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue({ userId: '123', tenantId: '456' }),
        headers: new Headers(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await apiClient.get('/api/session');

      // Check that fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith('/api/session', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': 'test-csrf-token',
        },
      });

      // Check the result structure
      expect(result).toEqual({
        data: { userId: '123', tenantId: '456' },
        status: 200,
        headers: expect.any(Headers),
      });
    });

    it('should handle non-2xx responses by throwing ApiError', async () => {
      // Mock error response
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: vi.fn().mockResolvedValue({ error: 'Unauthorized access' }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValue(mockResponse);

      // The request should throw an ApiError
      await expect(apiClient.get('/api/protected')).rejects.toThrow('[HTTP Error] Status: 401');

      // Get the thrown error to check its properties
      try {
        await apiClient.get('/api/protected');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
        expect((error as ApiError).statusText).toBe('Unauthorized');
        expect((error as ApiError).response).toBe(mockResponse);
      }
    });

    it('should use custom CSRF cookie and header names when provided', async () => {
      // Set a custom CSRF cookie
      document.cookie = 'MY-CSRF-COOKIE=custom-token; path=/;';

      // Mock successful response
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue({ success: true }),
        headers: new Headers(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValue(mockResponse);

      await apiClient.get('/api/endpoint', {
        csrfCookieName: 'MY-CSRF-COOKIE',
        csrfHeaderName: 'X-CUSTOM-CSRF',
      });

      // Check that fetch was called with the custom CSRF header
      expect(global.fetch).toHaveBeenCalledWith('/api/endpoint', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CUSTOM-CSRF': 'custom-token',
        },
      });
    });

    it('should not include CSRF header when no token is found', async () => {
      // Clear the cookie
      document.cookie = '';

      // Mock successful response
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue({ success: true }),
        headers: new Headers(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValue(mockResponse);

      await apiClient.get('/api/endpoint');

      // Check that fetch was called without a CSRF header
      expect(global.fetch).toHaveBeenCalledWith('/api/endpoint', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    });

    it('should handle network errors properly', async () => {
      // Mock a network failure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockRejectedValue(new Error('Network failed'));

      // The request should throw the network error
      await expect(apiClient.get('/api/endpoint')).rejects.toThrow('Network failed');
    });

    it('should handle JSON parsing errors', async () => {
      // Mock a response with invalid JSON
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        headers: new Headers(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValue(mockResponse);

      // The request should throw the JSON parsing error
      await expect(apiClient.get('/api/endpoint')).rejects.toThrow('Invalid JSON');

      // Reset the mock between tests to prevent unhandled rejections
      vi.resetAllMocks();
    });

    it('should check for any non-2xx responses', async () => {
      // Test various error status codes
      const errorStatuses = [
        { status: 199, text: 'Info' },
        { status: 300, text: 'Redirect' },
        { status: 400, text: 'Bad Request' },
        { status: 401, text: 'Unauthorized' },
        { status: 403, text: 'Forbidden' },
        { status: 404, text: 'Not Found' },
        { status: 500, text: 'Server Error' },
      ];

      for (const { status, text } of errorStatuses) {
        // Mock response with this status
        const mockResponse = {
          ok: status >= 200 && status < 300, // This is what Response.ok checks
          status,
          statusText: text,
          json: vi.fn().mockResolvedValue({ error: `Error with status ${status}` }),
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global.fetch as any).mockResolvedValue(mockResponse);

        // The request should throw an ApiError if status is not 2xx
        if (status < 200 || status >= 300) {
          await expect(apiClient.get('/api/endpoint')).rejects.toThrow(`[HTTP Error] Status: ${status}`);

          // Reset the mock between tests
          vi.resetAllMocks();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (global.fetch as any).mockResolvedValue(mockResponse);

          try {
            await apiClient.get('/api/endpoint');
          } catch (error) {
            expect(error).toBeInstanceOf(ApiError);
            expect((error as ApiError).status).toBe(status);
          }
        } else {
          // Should not throw for 2xx responses
          await expect(apiClient.get('/api/endpoint')).resolves.toBeDefined();
        }
      }
    });
  });

  // Test the CSRF token extraction function
  describe('getCsrfToken', () => {
    it('should extract token from single cookie', () => {
      // Set test cookie
      document.cookie = 'CSRF-TOKEN=single-token; path=/;';

      // Mock successful response to test extraction
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
        headers: new Headers(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValue(mockResponse);

      // Call get method which will use the getCsrfToken function
      apiClient.get('/api/test');

      // Verify correct header was sent
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRF-TOKEN': 'single-token',
          }),
        })
      );
    });

    it('should extract token from multiple cookies', () => {
      // Set multiple cookies
      document.cookie = 'first=value1; CSRF-TOKEN=multi-token; third=value3;';

      // Mock successful response
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
        headers: new Headers(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValue(mockResponse);

      // Call get method
      apiClient.get('/api/test');

      // Verify correct header was sent
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRF-TOKEN': 'multi-token',
          }),
        })
      );
    });

    it('should handle URL-encoded token values', () => {
      // Set cookie with encoded value
      document.cookie = 'CSRF-TOKEN=token%20with%20spaces%26special%3Dchars; path=/;';

      // Mock successful response
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
        headers: new Headers(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValue(mockResponse);

      // Call get method
      apiClient.get('/api/test');

      // Verify correct decoded header was sent
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRF-TOKEN': 'token with spaces&special=chars',
          }),
        })
      );
    });

    it('should return null when cookie is not found', () => {
      // Clear cookies
      document.cookie = '';

      // Mock successful response
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
        headers: new Headers(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValue(mockResponse);

      // Call get method
      apiClient.get('/api/test');

      // Verify CSRF header was not included
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'X-CSRF-TOKEN': expect.anything(),
          }),
        })
      );
    });
  });
});
