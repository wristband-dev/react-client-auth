/**
 * Custom error class for API-related errors with additional HTTP context. Extends the standard Error class with
 * properties that provide more information about the HTTP error that occurred.
 *
 * @class ApiError
 * @extends {Error}
 * @property {number} [status] - The HTTP status code associated with the error.
 * @property {string} [statusText] - The status text from the HTTP response (e.g., "Not Found", "Internal Server Error").
 * @property {Response} [response] - The original Response object from the fetch call, which may contain additional information about the error.
 *
 * @example
 * try {
 *   await apiClient.get('/some-endpoint');
 * } catch (error) {
 *   if (error instanceof ApiError && error.status === 401) {
 *     console.log(`Authentication error: ${error.statusText}`);
 *   }
 * }
 */
export class ApiError extends Error {
  status?: number;
  statusText?: string;
  response?: Response;

  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Represents an error encountered during token retrieval in the Wristband SDK. This error is thrown by
 * the `getToken()` function in the `useWristbandToken` hook when token acquisition fails. It provides a
 * specific error code for easier handling and debugging, along with the original error if available.
 *
 * @example
 * try {
 *   const token = await getToken();
 * } catch (error) {
 *   if (error instanceof WristbandTokenError) {
 *     console.error(error.code); // e.g., 'UNAUTHENTICATED'
 *     console.error(error.message);
 *     console.error(error.originalError);
 *   }
 * }
 */
export class WristbandTokenError extends Error {
  /**
   * @param code - A specific error code indicating the failure reason:
   *   - `'UNAUTHENTICATED'`: The user is not authenticated and cannot request a token.
   *   - `'TOKEN_FETCH_FAILED'`: The token endpoint returned an error other than 401.
   *   - `'TOKEN_URL_NOT_CONFIGURED'`: The token URL was not set in the SDK config.
   * @param message - A human-readable error message.
   * @param originalError - (Optional) The original error thrown during the token request, if available.
   */
  constructor(
    public readonly code: 'UNAUTHENTICATED' | 'TOKEN_FETCH_FAILED' | 'TOKEN_URL_NOT_CONFIGURED',
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'WristbandTokenError';
  }
}
