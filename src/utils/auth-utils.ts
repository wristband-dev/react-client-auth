import { WristbandError } from '../error';
import { LoginRedirectConfig, LogoutRedirectConfig } from '../types/util-types';

const defaultCsrfCookieName = 'CSRF-TOKEN';
const reservedLoginQueryKeys = ['login_hint', 'return_url', 'tenant_name', 'tenant_custom_domain'];
const reservedLogoutQueryKeys = ['tenant_name', 'tenant_custom_domain'];

/**
 * Redirects the user to your backend server's Login Endpoint with optional configuration parameters (browser only).
 *
 * This function initiates a redirect to the specified login URL and appends relevant query parameters
 * based on the provided configuration. The redirect will preserve the current page URL as the return
 * destination by default, allowing users to resume where they left off after authentication.
 *
 * @param {string} loginUrl - The login endpoint URL that handles authentication
 * @param {LoginRedirectConfig} config - Optional configuration for customizing the login experience
 * @returns {void}
 * @throws {WristbandError} If loginUrl is undefined, null, or empty.
 *
 * @example
 * // Basic redirect to login endpoint
 * redirectToLogin('/api/auth/login');
 *
 * @example
 * // Redirect with pre-filled email address
 * redirectToLogin('/api/auth/login', {
 *   loginHint: 'user@example.com'
 * });
 *
 * @example
 * // Redirect with custom return destination and tenant name
 * redirectToLogin('/api/auth/login', {
 *   returnUrl: 'https://app.example.com/dashboard',
 *   tenantName: 'acme-corp'
 * });
 *
 * @example
 * // Redirect with custom return destination and tenant custom domain
 * redirectToLogin('/api/auth/login', {
 *   returnUrl: 'https://app.example.com/dashboard',
 *   tenantCustomDomain: 'auth.acme.com'
 * });
 */
export function redirectToLogin(loginUrl: string, config: LoginRedirectConfig = {}): void {
  if (!loginUrl || !loginUrl.trim()) {
    throw new WristbandError('INVALID_LOGIN_URL', 'Redirect To Login: "loginUrl" is required');
  }

  // For frameworks like NextJS, need to ensure this can only be attempted in the browser.
  if (typeof window === 'undefined') {
    return;
  }

  let resolvedUrl: URL;
  try {
    resolvedUrl = new URL(loginUrl, window.location.origin);
  } catch {
    throw new WristbandError('INVALID_LOGIN_URL', `Redirect To Login: "${loginUrl}" is not a valid login URL`);
  }

  reservedLoginQueryKeys.forEach((key) => {
    if (resolvedUrl.searchParams.has(key)) {
      throw new WristbandError(
        'INVALID_LOGIN_URL',
        `Redirect To Login: loginUrl must not include reserved query param: "${key}"`
      );
    }
  });

  const queryParams: URLSearchParams = new URLSearchParams({
    ...(config.loginHint ? { login_hint: config.loginHint } : {}),
    ...(config.returnUrl ? { return_url: encodeURI(config.returnUrl) } : {}),
    ...(config.tenantName ? { tenant_name: config.tenantName } : {}),
    ...(config.tenantCustomDomain ? { tenant_custom_domain: config.tenantCustomDomain } : {}),
  });

  resolvedUrl.searchParams.forEach((value, key) => {
    queryParams.append(key, value);
  });

  resolvedUrl.search = queryParams.toString();
  window.location.href = resolvedUrl.toString();
}

/**
 * Redirects the user to your backend server's Logout Endpoint with optional configuration (browser only).
 *
 * This function navigates the user to the specified logout URL and can append additional parameters as needed.
 *
 * @param {string} logoutUrl - The URL of your server's Logout Endpoint
 * @param {LogoutRedirectConfig} config - Optional configuration for the logout redirect
 * @throws {WristbandError} If logoutUrl is undefined, null, or empty.
 *
 * @example
 * // Basic redirect to logout endpoint
 * redirectToLogout('/api/auth/logout');
 *
 * @example
 * // Redirect with tenant name parameter
 * redirectToLogout('/api/auth/logout', {
 *   tenantName: 'acme-corp'
 * });
 *
 * @example
 * // Redirect with tenant custom domain parameter
 * redirectToLogout('/api/auth/logout', {
 *   tenantCustomDomain: 'auth.acme.com'
 * });
 */
export function redirectToLogout(logoutUrl: string, config: LogoutRedirectConfig = {}) {
  if (!logoutUrl || !logoutUrl.trim()) {
    throw new WristbandError('INVALID_LOGOUT_URL', 'Redirect To Logout: "logoutUrl" is required');
  }

  // For frameworks like NextJS, need to ensure this can only be attempted in the browser.
  if (typeof window === 'undefined') {
    return;
  }

  let resolvedUrl: URL;
  try {
    resolvedUrl = new URL(logoutUrl, window.location.origin);
  } catch {
    throw new WristbandError('INVALID_LOGOUT_URL', `Redirect To Logout: "${logoutUrl}" is not a valid logout URL`);
  }

  reservedLogoutQueryKeys.forEach((key) => {
    if (resolvedUrl.searchParams.has(key)) {
      throw new WristbandError(
        'INVALID_LOGOUT_URL',
        `Redirect To Logout: logoutUrl must not include reserved query param: "${key}"`
      );
    }
  });

  const queryParams: URLSearchParams = new URLSearchParams({
    ...(config.tenantName ? { tenant_name: config.tenantName } : {}),
    ...(config.tenantCustomDomain ? { tenant_custom_domain: config.tenantCustomDomain } : {}),
  });

  resolvedUrl.searchParams.forEach((value, key) => {
    queryParams.append(key, value);
  });

  resolvedUrl.search = queryParams.toString();
  window.location.href = resolvedUrl.toString();
}

/**
 * Retrieves the CSRF token from the specified cookie.
 *
 * This utility is helpful when using the Fetch API or other HTTP clients
 * that don't automatically handle CSRF tokens. Use this to extract the token
 * and include it in your request headers.
 *
 * @param {string} cookieName - The name of the CSRF cookie (default: 'CSRF-TOKEN')
 * @returns {string | undefined} The CSRF token value, or undefined if the cookie is not found
 *
 * @example
 * ```typescript
 * import { getCsrfToken } from '@wristband/react-client-auth';
 *
 * async function makeApiCall() {
 *   const csrfToken = getCsrfToken();
 *
 *   const response = await fetch('/api/endpoint', {
 *     method: 'POST',
 *     credentials: 'include',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'X-CSRF-TOKEN': csrfToken ?? ''
 *     },
 *     body: JSON.stringify({ data: 'example' })
 *   });
 *
 *   if (!response.ok) {
 *     if ([401, 403].includes(response.status)) {
 *       window.location.href = '/api/auth/login';
 *       return;
 *     }
 *     throw new Error(`HTTP error! status: ${response.status}`);
 *   }
 *
 *   return await response.json();
 * }
 * ```
 */
export function getCsrfToken(cookieName?: string): string | undefined {
  // For frameworks like NextJS, need to ensure this can only be attempted in the browser.
  if (typeof window === 'undefined') {
    return undefined;
  }

  const match = document.cookie.match(new RegExp('(^|;\\s*)' + (cookieName ?? defaultCsrfCookieName) + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}
