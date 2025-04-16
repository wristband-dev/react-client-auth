import { AxiosError } from 'axios';

import { LoginRedirectConfig, LogoutRedirectConfig } from '../types/types';

/**
 * Redirects the user to your backend server's Login Endpoint with optional configuration parameters.
 *
 * This function initiates a redirect to the specified login URL and appends relevant query parameters
 * based on the provided configuration. The redirect will preserve the current page URL as the return
 * destination by default, allowing users to resume where they left off after authentication.
 *
 * @param {string} loginUrl - The login endpoint URL that handles authentication
 * @param {LoginRedirectConfig} config - Optional configuration for customizing the login experience
 * @returns {Promise<void>} A promise that resolves when the redirect is triggered
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
export async function redirectToLogin(loginUrl: string, config: LoginRedirectConfig = {}) {
  const searchParamsString = new URLSearchParams({
    ...(config.loginHint ? { login_hint: config.loginHint } : {}),
    ...(config.returnUrl
      ? { return_url: encodeURI(config.returnUrl) }
      : { return_url: encodeURI(window.location.href) }),
    ...(config.tenantDomain ? { tenant_domain: config.tenantDomain } : {}),
    ...(config.tenantCustomDomain ? { tenant_custom_domain: config.tenantCustomDomain } : {}),
  }).toString();
  const query = searchParamsString ? `?${searchParamsString}` : '';

  window.location.href = `${loginUrl}${query}`;
}

/**
 * Redirects the user to your backend server's Logout Endpoint with optional configuration.
 *
 * This function navigates the user to the specified logout URL and can append additional parameters as needed.
 *
 * @param {string} logoutUrl - The URL of your server's Logout Endpoint
 * @param {LogoutRedirectConfig} config - Optional configuration for the logout redirect
 * @returns {Promise<void>} A promise that resolves when the redirect is triggered
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
export async function redirectToLogout(logoutUrl: string, config: LogoutRedirectConfig = {}) {
  const searchParamsString = new URLSearchParams({
    ...(config.tenantDomain ? { tenant_domain: config.tenantDomain } : {}),
    ...(config.tenantCustomDomain ? { tenant_custom_domain: config.tenantCustomDomain } : {}),
  }).toString();
  const query = searchParamsString ? `?${searchParamsString}` : '';

  window.location.href = `${logoutUrl}${query}`;
}

/**
 * Checks if an error represents a specific HTTP status code error.
 *
 * @param {unknown} error - The error to check. Must be either an AxiosError or a Response object.
 * @param {number} statusCode - The HTTP status code to check for.
 * @returns {boolean} True if the error has the specified status code, false otherwise.
 * @throws {TypeError} If the error is null, undefined, or not an AxiosError or Response object.
 *
 * @example
 * // With Axios
 * try {
 *   await axios.get('/api/resource');
 * } catch (error) {
 *   if (isHttpStatusError(error, 404)) {
 *     console.log('Resource not found');
 *   }
 * }
 *
 * @example
 * // With Fetch
 * const response = await fetch('/api/resource');
 * if (isHttpStatusError(response, 401)) {
 *   console.log('Authentication required');
 * }
 */
export function isHttpStatusError(error: unknown, statusCode: number): boolean {
  // Handle null/undefined case with an exception
  if (error === null || error === undefined) {
    throw new TypeError('Argument [error] cannot be null or undefined');
  }

  // Handle Axios error format
  if (error instanceof AxiosError) {
    return error.response?.status === statusCode;
  }

  // Handle fetch Response objects
  if (error instanceof Response) {
    return error.status === statusCode;
  }

  // If it's neither of the expected types, throw an error.
  throw new TypeError(
    `Invalid error type: Expected either an AxiosError or a Response object, but received type: [${typeof error}] `
  );
}

/**
 * Checks if an error represents an HTTP 401 Unauthorized error.
 *
 * @param {unknown} error - The error to check. Must be either an AxiosError or a Response object.
 * @returns {boolean} True if the error has a 401 status code, false otherwise.
 * @throws {TypeError} If the error is null, undefined, or not an AxiosError or Response object.
 *
 * @example
 * // With Axios
 * try {
 *   await axios.get('/api/resource');
 * } catch (error) {
 *   if (isUnauthorizedError(error)) {
 *     console.log('Authentication required');
 *   }
 * }
 *
 * @example
 * // With Fetch
 * const response = await fetch('/api/resource');
 * if (isUnauthorizedError(response)) {
 *   console.log('Authentication required');
 * }
 */
export const isUnauthorizedError = (error: unknown) => isHttpStatusError(error, 401);

/**
 * Checks if an error represents an HTTP 403 Forbidden error.
 *
 * @param {unknown} error - The error to check. Must be either an AxiosError or a Response object.
 * @returns {boolean} True if the error has a 403 status code, false otherwise.
 * @throws {TypeError} If the error is null, undefined, or not an AxiosError or Response object.
 *
 * @example
 * // With Axios
 * try {
 *   await axios.get('/api/resource');
 * } catch (error) {
 *   if (isForbiddenError(error)) {
 *     console.log('Forbidden');
 *   }
 * }
 *
 * @example
 * // With Fetch
 * const response = await fetch('/api/resource');
 * if (isForbiddenError(response)) {
 *   console.log('Forbidden');
 * }
 */
export const isForbiddenError = (error: unknown) => isHttpStatusError(error, 403);
