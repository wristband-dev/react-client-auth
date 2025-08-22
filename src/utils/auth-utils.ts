import { WristbandError } from '../error';
import { LoginRedirectConfig, LogoutRedirectConfig } from '../types/util-types';
import { WristbandErrorCode } from '../types/auth-provider-types';

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
 * @throws {WristbandError} If loginUrl is undefined, null, or empty.
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
    throw new WristbandError(WristbandErrorCode.INVALID_LOGIN_URL, 'Redirect To Login: "loginUrl" is required');
  }

  // For frameworks like NextJS, need to ensure this can only be attempted in the browser.
  if (typeof window !== 'undefined') {
    let resolvedUrl: URL;
    try {
      resolvedUrl = new URL(loginUrl, window.location.origin);
    } catch {
      throw new WristbandError(
        WristbandErrorCode.INVALID_LOGIN_URL,
        `Redirect To Login: "${loginUrl}" is not a valid login URL`
      );
    }

    for (const key of reservedLoginQueryKeys) {
      if (resolvedUrl.searchParams.has(key)) {
        throw new WristbandError(
          WristbandErrorCode.INVALID_LOGIN_URL,
          `Redirect To Login: loginUrl must not include reserved query param: "${key}"`
        );
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
 * @throws {WristbandError} If logoutUrl is undefined, null, or empty.
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
    throw new WristbandError(WristbandErrorCode.INVALID_LOGOUT_URL, 'Redirect To Logout: "logoutUrl" is required');
  }

  // For frameworks like NextJS, need to ensure this can only be attempted in the browser.
  if (typeof window !== 'undefined') {
    let resolvedUrl: URL;
    try {
      resolvedUrl = new URL(logoutUrl, window.location.origin);
    } catch {
      throw new WristbandError(
        WristbandErrorCode.INVALID_LOGOUT_URL,
        `Redirect To Logout: "${logoutUrl}" is not a valid logout URL`
      );
    }

    for (const key of reservedLogoutQueryKeys) {
      if (resolvedUrl.searchParams.has(key)) {
        throw new WristbandError(
          WristbandErrorCode.INVALID_LOGOUT_URL,
          `Redirect To Logout: logoutUrl must not include reserved query param: "${key}"`
        );
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
