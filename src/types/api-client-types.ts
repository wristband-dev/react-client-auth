/**
 * Extended request options for API calls that support CSRF protection.
 * Extends the standard RequestInit interface from the Fetch API with
 * additional properties for CSRF handling.
 *
 * @interface RequestOptions
 * @extends {RequestInit}
 * @property {string} [csrfCookieName] - The name of the cookie containing the CSRF token. Defaults to 'XSRF-TOKEN' if not specified.
 * @property {string} [csrfHeaderName] - The name of the header that will carry the CSRF token. Defaults to 'X-XSRF-TOKEN' if not specified.
 */
export interface RequestOptions extends RequestInit {
  csrfCookieName?: string;
  csrfHeaderName?: string;
}

/**
 * Standardized API response structure returned by API client methods.
 * Wraps the parsed response data with additional metadata from the HTTP response.
 *
 * @interface ApiResponse
 * @template T - The type of data contained in the response.
 *
 * @property {T} data - The parsed response body, typically JSON data converted to a TypeScript type.
 * @property {number} status - The HTTP status code of the response (e.g., 200, 201, 404, 500).
 * @property {Headers} headers - The HTTP headers from the response, accessible via the Headers interface.
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

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
