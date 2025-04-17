/**
 * Helper function to retrieve a CSRF token from browser cookies.
 *
 * Searches through all cookies in the document to find the one matching the provided name and extracts its value.
 * Handles cookie parsing and decoding.
 *
 * @param {string} cookieName - The name of the cookie containing the CSRF token.
 *                              @required
 * @returns {string | null} The CSRF token value if found; null otherwise.
 *
 * @example
 * const token = getCsrfToken('XSRF-TOKEN');
 *
 * @private - This is an internal helper function not intended for external use
 */
export function getCsrfToken(cookieName: string): string | null {
  const name = cookieName + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');

  for (let i = 0; i < cookieArray.length; i++) {
    const cookie = cookieArray[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return null;
}
