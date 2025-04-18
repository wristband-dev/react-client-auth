/**
 * Resolves and properly formats a login URL for the Wristband Auth Provider.
 *
 * This function ensures that the login URL includes a "return_url" parameter, allowing users to be redirected back to
 * their original location after authentication. If the login URL already contains a return_url parameter, it will be
 * preserved.
 *
 * @param {string} loginUrl - The base login URL to process
 * @returns {string} The fully resolved login URL with appropriate query parameters
 * @throws {TypeError} If loginUrl is undefined, null, empty, or not a valid URL.
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
  if (!loginUrl) {
    throw new TypeError('WristbandAuthProvider: [loginUrl] is required');
  }

  let resolvedUrl: URL;
  try {
    resolvedUrl = new URL(loginUrl, window.location.origin);
  } catch {
    throw new TypeError(`WristbandAuthProvider: [${loginUrl}] is not a valid loginUrl`);
  }

  // If return_url is not present, add it.
  if (!resolvedUrl.searchParams.has('return_url')) {
    resolvedUrl.searchParams.append('return_url', encodeURI(window.location.href));
  }

  return resolvedUrl.toString();
}

/**
 * Validates a logout URL for the Wristband Auth Provider.
 *
 * This function checks that the provided logout URL is properly formatted and can be resolved to a valid URL. It does
 * not modify the URL in any way but simply validates it.
 *
 * @param {string} logoutUrl - The logout URL to validate
 * @throws {TypeError} If loginUrl is undefined, null, empty, or not a valid URL.
 *
 * @example
 * // Basic validation
 * validateAuthProviderLogoutUrl('/api/auth/logout');
 * // No error thrown, URL is valid
 *
 * @example
 * // With an invalid URL
 * validateAuthProviderLogoutUrl('http://');
 * // Throws TypeError: "WristbandAuthProvider: [http://] is not a valid logoutUrl"
 */
export function validateAuthProviderLogoutUrl(logoutUrl: string): void {
  if (!logoutUrl) {
    throw new TypeError('WristbandAuthProvider: [logoutUrl] is required');
  }

  try {
    new URL(logoutUrl, window.location.origin);
  } catch {
    throw new TypeError(`WristbandAuthProvider: [${logoutUrl}] is not a valid logoutUrl`);
  }
}

/**
 * Validates a session URL for the Wristband Auth Provider.
 *
 * This function checks that the provided session URL is properly formatted and can be resolved to a valid URL. It
 * does not modify the URL in any way but simply validates it.
 *
 * @param {string} sessionUrl - The session URL to validate
 * @throws {TypeError} If loginUrl is undefined, null, empty, or not a valid URL.
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
  if (!sessionUrl) {
    throw new TypeError('WristbandAuthProvider: [sessionUrl] is required');
  }

  try {
    new URL(sessionUrl, window.location.origin);
  } catch {
    throw new TypeError(`WristbandAuthProvider: [${sessionUrl}] is not a valid sessionUrl`);
  }
}
