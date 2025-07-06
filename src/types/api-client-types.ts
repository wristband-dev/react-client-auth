/**
 * Extended request options for API calls that support CSRF protection.
 * Extends the standard RequestInit interface from the Fetch API with
 * additional properties for CSRF handling.
 *
 * @interface RequestOptions
 * @extends {RequestInit}
 * @property {string} [csrfCookieName] - The name of the cookie containing the CSRF token. Defaults to 'CSRF-TOKEN' if not specified.
 * @property {string} [csrfHeaderName] - The name of the header that will carry the CSRF token. Defaults to 'X-CSRF-TOKEN' if not specified.
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
