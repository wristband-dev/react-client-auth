import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { getCsrfToken } from './api-client-utils';

describe('getCsrfToken', () => {
  // Store the original document.cookie
  let originalCookie: string;

  beforeEach(() => {
    // Store the original cookie
    originalCookie = document.cookie;

    // Clear cookies before each test
    document.cookie = '';
  });

  afterEach(() => {
    // Restore original cookie
    document.cookie = originalCookie;
  });

  it('should return null when no cookies exist', () => {
    // Ensure cookies are empty
    document.cookie = '';

    const result = getCsrfToken('CSRF-TOKEN');
    expect(result).toBeNull();
  });

  it('should return null when the specified cookie does not exist', () => {
    // Set a different cookie
    document.cookie = 'OTHER-COOKIE=some-value; path=/;';

    const result = getCsrfToken('CSRF-TOKEN');
    expect(result).toBeNull();
  });

  it('should extract the token from a single cookie', () => {
    // Set a single cookie with the CSRF token
    document.cookie = 'CSRF-TOKEN=test-token-value; path=/;';

    const result = getCsrfToken('CSRF-TOKEN');
    expect(result).toBe('test-token-value');
  });

  it('should extract the token when multiple cookies exist', () => {
    // Set multiple cookies
    document.cookie = 'first-cookie=first-value; path=/;';
    document.cookie = 'CSRF-TOKEN=multi-cookie-token; path=/;';
    document.cookie = 'last-cookie=last-value; path=/;';

    const result = getCsrfToken('CSRF-TOKEN');
    expect(result).toBe('multi-cookie-token');
  });

  it('should handle cookies with special characters', () => {
    // Set a cookie with special characters that need decoding
    document.cookie = 'CSRF-TOKEN=complex%20token%26with%3Dspecial%20chars; path=/;';

    const result = getCsrfToken('CSRF-TOKEN');
    expect(result).toBe('complex token&with=special chars');
  });

  it('should extract the token when the cookie is at the start of the string', () => {
    // Set multiple cookies with target cookie at the start
    document.cookie = 'CSRF-TOKEN=first-position; path=/;';
    document.cookie = 'other-cookie=other-value; path=/;';

    const result = getCsrfToken('CSRF-TOKEN');
    expect(result).toBe('first-position');
  });

  it('should extract the token when the cookie is in the middle of the string', () => {
    // Set multiple cookies with target cookie in the middle
    document.cookie = 'first-cookie=first-value; path=/;';
    document.cookie = 'CSRF-TOKEN=middle-position; path=/;';
    document.cookie = 'last-cookie=last-value; path=/;';

    const result = getCsrfToken('CSRF-TOKEN');
    expect(result).toBe('middle-position');
  });

  it('should extract the token when the cookie is at the end of the string', () => {
    // Set multiple cookies with target cookie at the end
    document.cookie = 'first-cookie=first-value; path=/;';
    document.cookie = 'CSRF-TOKEN=last-position; path=/;';

    const result = getCsrfToken('CSRF-TOKEN');
    expect(result).toBe('last-position');
  });

  it('should handle cookies with spaces in the cookie string', () => {
    // Set cookies with extra spaces in the string
    document.cookie = 'first-cookie=first-value;';
    document.cookie = 'CSRF-TOKEN=space-token;';
    document.cookie = 'last-cookie=last-value;';

    const result = getCsrfToken('CSRF-TOKEN');
    expect(result).toBe('space-token');
  });

  it('should handle empty cookie values', () => {
    // Set a cookie with an empty value
    document.cookie = 'CSRF-TOKEN=; path=/;';

    const result = getCsrfToken('CSRF-TOKEN');
    expect(result).toBe('');
  });

  it('should return the correct value for different cookie names', () => {
    // Set multiple cookies with different names
    document.cookie = 'CSRF-TOKEN=csrf-value; path=/;';
    document.cookie = 'CUSTOM-TOKEN=custom-value; path=/;';

    expect(getCsrfToken('CSRF-TOKEN')).toBe('csrf-value');
    expect(getCsrfToken('CUSTOM-TOKEN')).toBe('custom-value');
  });

  it('should be case-sensitive for cookie names', () => {
    // Set cookies with different case
    document.cookie = 'CSRF-TOKEN=uppercase-value; path=/;';
    document.cookie = 'csrf-token=lowercase-value; path=/;';

    expect(getCsrfToken('CSRF-TOKEN')).toBe('uppercase-value');
    expect(getCsrfToken('csrf-token')).toBe('lowercase-value');
    // Should not find mixed case that doesn't exist
    expect(getCsrfToken('Csrf-Token')).toBeNull();
  });
});
