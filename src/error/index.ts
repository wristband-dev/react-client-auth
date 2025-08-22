import { WristbandErrorCode } from '../types/auth-provider-types';

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
 * Represents an error encountered in the Wristband SDK. This error is thrown by various SDK operations
 * including session retrieval, token acquisition, and other authentication-related failures. It provides
 * a specific error code for easier handling and debugging, along with the original error if available.
 *
 * @example Session error handling
 * ```typescript
 * const { authError } = useWristbandAuth();
 *
 * if (authError) {
 *   switch (authError.code) {
 *     case WristbandErrorCode.INVALID_SESSION_RESPONSE:
 *       console.error('Session configuration error:', authError.message);
 *       break;
 *     case WristbandErrorCode.SESSION_FETCH_FAILED:
 *       console.error('Session network error:', authError.message);
 *       break;
 *     default:
 *       console.error('Unexpected error')
 *   }
 * }
 * ```
 *
 * @example Token error handling
 * ```typescript
 * try {
 *   const token = await getToken();
 * } catch (error) {
 *   if (error instanceof WristbandError) {
 *     switch (error.code) {
 *       case WristbandErrorCode.UNAUTHENTICATED:
 *         console.error('User not authenticated');
 *         break;
 *       case WristbandErrorCode.INVALID_TOKEN_RESPONSE:
 *         console.error('Token endpoint configuration error:', error.message);
 *         break;
 *       case WristbandErrorCode.TOKEN_FETCH_FAILED:
 *         console.error('Token network error:', error.message);
 *         break;
 *     }
 *   }
 * }
 * ```
 */
export class WristbandError extends Error {
  /**
   * @param code - The specific {@link WristbandErrorCode} indicating the failure reason.
   * @param message - A human-readable error message.
   * @param originalError - (Optional) The original error thrown during the request, if available.
   */
  constructor(public readonly code: WristbandErrorCode, message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'WristbandError';
  }
}
