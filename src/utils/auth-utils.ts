import { ApiError } from '../types/api-client-types';
import { LoginRedirectConfig, LogoutRedirectConfig } from '../types/util-types';

const reservedLoginQueryKeys = ['login_hint', 'return_url', 'tenant_domain', 'tenant_custom_domain'];
const reservedLogoutQueryKeys = ['tenant_domain', 'tenant_custom_domain'];

/**
 * Redirects the user to your backend server's Login Endpoint with optional configuration parameters (browser only).
 *
 * This function initiates a redirect to the specified login URL and appends relevant query parameters
 * based on the provided configuration. The redirect will preserve the current page URL as the return
 * destination by default, allowing users to resume where they left off after authentication.
 *
 * @param {string} loginUrl - The login endpoint URL that handles authentication
 * @param {LoginRedirectConfig} config - Optional configuration for customizing the login experience
 * @returns {Promise<void>} A promise that resolves when the redirect is triggered
 * @throws {TypeError} If loginUrl is undefined, null, or empty.
 *
 * @example
 * // Basic redirect to login endpoint
 * await redirectToLogin('/api/auth/login');
 *
 * @example
 * // Redirect with pre-filled email address
 * await redirectToLogin('/api/auth/login', {
 *   loginHint: 'user@example.com'
 * });
 *
 * @example
 * // Redirect with custom return destination and tenant domain
 * await redirectToLogin('/api/auth/login', {
 *   returnUrl: 'https://app.example.com/dashboard',
 *   tenantDomain: 'acme-corp'
 * });
 *
 * @example
 * // Redirect with custom return destination and tenant domain
 * await redirectToLogin('/api/auth/login', {
 *   returnUrl: 'https://app.example.com/dashboard',
 *   tenantCustomDomain: 'auth.acme.com'
 * });
 */
export function redirectToLogin(loginUrl: string, config: LoginRedirectConfig = {}) {
  if (!loginUrl) {
    throw new TypeError('Redirect To Login: [loginUrl] is required');
  }

  // For frameworks like NextJS, need to ensure this can only be attempted in the browser.
  if (typeof window !== 'undefined') {
    let resolvedUrl: URL;
    try {
      resolvedUrl = new URL(loginUrl, window.location.origin);
    } catch {
      throw new TypeError(`Invalid loginUrl: "${loginUrl}" is not a valid URL`);
    }

    for (const key of reservedLoginQueryKeys) {
      if (resolvedUrl.searchParams.has(key)) {
        throw new Error(`loginUrl must not include reserved query param: "${key}"`);
      }
    }

    const queryParams: URLSearchParams = new URLSearchParams({
      ...(config.loginHint ? { login_hint: config.loginHint } : {}),
      ...(config.returnUrl ? { return_url: encodeURI(config.returnUrl) } : {}),
      ...(config.tenantDomain ? { tenant_domain: config.tenantDomain } : {}),
      ...(config.tenantCustomDomain ? { tenant_custom_domain: config.tenantCustomDomain } : {}),
    });

    resolvedUrl.searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });

    resolvedUrl.search = queryParams.toString();
    window.location.href = resolvedUrl.toString();
  }
}

/**
 * Redirects the user to your backend server's Logout Endpoint with optional configuration (browser only).
 *
 * This function navigates the user to the specified logout URL and can append additional parameters as needed.
 *
 * @param {string} logoutUrl - The URL of your server's Logout Endpoint
 * @param {LogoutRedirectConfig} config - Optional configuration for the logout redirect
 * @returns {Promise<void>} A promise that resolves when the redirect is triggered
 * @throws {TypeError} If logoutUrl is undefined, null, or empty.
 *
 * @example
 * // Basic redirect to logout endpoint
 * await redirectToLogout('/api/auth/logout');
 *
 * @example
 * // Redirect with tenant domain parameter
 * await redirectToLogout('/api/auth/logout', {
 *   tenantDomain: 'acme-corp'
 * });
 *
 * @example
 * // Redirect with tenant domain parameter
 * await redirectToLogout('/api/auth/logout', {
 *   tenantCustomDomain: 'auth.acme.com'
 * });
 */
export function redirectToLogout(logoutUrl: string, config: LogoutRedirectConfig = {}) {
  if (!logoutUrl) {
    throw new TypeError('Redirect To Logout: [logoutUrl] is required');
  }

  // For frameworks like NextJS, need to ensure this can only be attempted in the browser.
  if (typeof window !== 'undefined') {
    let resolvedUrl: URL;
    try {
      resolvedUrl = new URL(logoutUrl, window.location.origin);
    } catch {
      throw new TypeError(`Invalid logoutUrl: "${logoutUrl}" is not a valid URL`);
    }

    for (const key of reservedLogoutQueryKeys) {
      if (resolvedUrl.searchParams.has(key)) {
        throw new Error(`logoutUrl must not include reserved query param: "${key}"`);
      }
    }

    const queryParams: URLSearchParams = new URLSearchParams({
      ...(config.tenantDomain ? { tenant_domain: config.tenantDomain } : {}),
      ...(config.tenantCustomDomain ? { tenant_custom_domain: config.tenantCustomDomain } : {}),
    });

    resolvedUrl.searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });

    resolvedUrl.search = queryParams.toString();
    window.location.href = resolvedUrl.toString();
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

/**
 * Checks if an error represents an HTTP 403 Forbidden error.
 *
 * @param {unknown} error - The error to check.
 * @returns {boolean} True if the error is an ApiError with a 403 status code; false otherwise.
 * @throws {TypeError} If the error is null or undefined.
 *
 * @example
 * try {
 *   const response = await fetch('/api/resource');
 * } catch (error) {
 *   if (isForbiddenError(error)) {
 *     console.log('Forbidden access');
 *   }
 * }
 */
export const isForbiddenError = (error: unknown) => isHttpStatusError(error, 403);
