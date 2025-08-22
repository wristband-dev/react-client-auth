import { ApiError, WristbandError } from '../error';
import { WristbandErrorCode } from '../types/auth-provider-types';

/**
 * Resolves and properly formats a login URL for the Wristband Auth Provider.
 *
 * This function ensures that the login URL includes a "return_url" parameter, allowing users to be redirected back to
 * their original location after authentication. If the login URL already contains a return_url parameter, it will be
 * preserved.
 *
 * @param {string} loginUrl - The base login URL to process
 * @returns {string} The fully resolved login URL with appropriate query parameters
 * @throws {WristbandError} If loginUrl is undefined, null, empty, or not a valid URL.
 *
 * @example
 * // Basic usage with a relative URL
 * const url = resolveAuthProviderLoginUrl('/api/auth/login');
 * // Returns "/api/auth/login?return_url=https%3A%2F%2Fcurrent-page.com%2Fpath"
 *
 * @example
 * // With a login URL that already has a return_url parameter
 * const url = resolveAuthProviderLoginUrl('/api/auth/login?return_url=https%3A%2F%2Fspecific-page.com');
 * // Preserves existing return_url parameter
 */
export function resolveAuthProviderLoginUrl(loginUrl: string): string {
  if (!loginUrl || !loginUrl.trim()) {
    throw new WristbandError(WristbandErrorCode.INVALID_LOGIN_URL, 'WristbandAuthProvider: [loginUrl] is required');
  }

  // For frameworks like NextJS, need to ensure this doesn't break in server-side environments.
  if (typeof window === 'undefined') {
    return loginUrl;
  }

  let resolvedUrl: URL;
  try {
    resolvedUrl = new URL(loginUrl, window.location.origin);
  } catch {
    throw new WristbandError(
      WristbandErrorCode.INVALID_LOGIN_URL,
      `WristbandAuthProvider: [${loginUrl}] is not a valid loginUrl`
    );
  }

  // If return_url is not present, add it.
  if (!resolvedUrl.searchParams.has('return_url')) {
    resolvedUrl.searchParams.append('return_url', encodeURI(window.location.href));
  }

  return resolvedUrl.toString();
}

/**
 * Validates a session URL for the Wristband Auth Provider.
 *
 * This function checks that the provided session URL is properly formatted and can be resolved to a valid URL. It
 * does not modify the URL in any way but simply validates it.
 *
 * @param {string} sessionUrl - The session URL to validate
 * @throws {WristbandError} If sessionUrl is undefined, null, empty, or not a valid URL.
 *
 * @example
 * // Basic validation
 * validateAuthProviderSessionUrl('/api/auth/session');
 * // No error thrown, URL is valid
 *
 * @example
 * // With an absolute URL
 * validateAuthProviderSessionUrl('https://auth.example.com/session');
 * // No error thrown, URL is valid
 */
export function validateAuthProviderSessionUrl(sessionUrl: string): void {
  if (!sessionUrl || !sessionUrl.trim()) {
    throw new WristbandError(WristbandErrorCode.INVALID_SESSION_URL, 'WristbandAuthProvider: [sessionUrl] is required');
  }

  // For frameworks like NextJS, need to ensure this doesn't break in server-side environments.
  if (typeof window !== 'undefined') {
    try {
      new URL(sessionUrl, window.location.origin);
    } catch {
      throw new WristbandError(
        WristbandErrorCode.INVALID_SESSION_URL,
        `WristbandAuthProvider: [${sessionUrl}] is not a valid sessionUrl`
      );
    }
  }
}

/**
 * Validates a token URL for the Wristband Auth Provider.
 *
 * This function checks that the provided token URL is properly formatted and can be resolved to a valid URL. It
 * does not modify the URL in any way but simply validates it.
 *
 * @param {string} tokenUrl - The token URL to validate
 * @throws {WristbandError} If tokenUrl is undefined, null, empty, or not a valid URL.
 *
 * @example
 * // Basic validation
 * validateAuthProviderTokenUrl('/api/auth/token');
 * // No error thrown, URL is valid
 *
 * @example
 * // With an absolute URL
 * validateAuthProviderTokenUrl('https://auth.example.com/token');
 * // No error thrown, URL is valid
 */
export function validateAuthProviderTokenUrl(tokenUrl?: string): void {
  // For frameworks like NextJS, need to ensure this doesn't break in server-side environments.
  if (typeof window !== 'undefined' && tokenUrl && tokenUrl.trim()) {
    try {
      new URL(tokenUrl, window.location.origin);
    } catch {
      throw new WristbandError(
        WristbandErrorCode.INVALID_TOKEN_URL,
        `WristbandAuthProvider: [${tokenUrl}] is not a valid tokenUrl`
      );
    }
  }
}

/**
 * Checks if an error represents an HTTP error with a specific error status code.
 *
 * @param {unknown} error - The error to check.
 * @param {number} statusCode - The HTTP status code to check for.
 * @returns {boolean} True if the error is an ApiError with the specified status code; false otherwise.
 * @throws {TypeError} If the error is null or undefined.
 *
 * @example
 * try {
 *   const response = await fetch('/api/resource');
 * } catch (error) {
 *   if (isHttpStatusError(error, 401)) {
 *     console.log('Unauthorized');
 *   }
 * }
 */
export function isHttpStatusError(error: unknown, statusCode: number): boolean {
  if (error === null || error === undefined) {
    throw new TypeError('Argument [error] cannot be null or undefined');
  }

  if (!(error instanceof ApiError)) {
    return false;
  }

  return error.status === statusCode;
}

/**
 * Checks if an error represents an HTTP 401 Unauthorized error.
 *
 * @param {unknown} error - The error to check.
 * @returns {boolean} True if the error is an ApiError with a 401 status code; false otherwise.
 * @throws {TypeError} If the error is null or undefined.
 *
 * @example
 * try {
 *   const response = await fetch('/api/resource');
 * } catch (error) {
 *   if (isUnauthorizedError(error)) {
 *     console.log('Unauthorized');
 *   }
 * }
 */
export const isUnauthorizedError = (error: unknown) => isHttpStatusError(error, 401);

// Helper function to check if error is 4xx
export const is4xxError = (error: unknown): boolean => {
  if (error === null || error === undefined) {
    throw new TypeError('Argument [error] cannot be null or undefined');
  }

  if (!(error instanceof ApiError) || !error.status) {
    return false;
  }

  return error?.status >= 400 && error?.status < 500;
};

// Helper function to delay execution
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
