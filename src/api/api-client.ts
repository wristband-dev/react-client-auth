import { ApiError, ApiResponse, RequestOptions } from '../types/api-client-types';
import { getCsrfToken } from '../utils/api-client-utils';

/**
 * API client for authenticated REST API requests.
 *
 * Provides methods for making authenticated HTTP requests to your backend server with built-in CSRF protection and
 * standardized error handling.
 *
 * @namespace apiClient
 */
const apiClient = {
  /**
   * Makes an authenticated GET request to the specified endpoint.
   *
   * Automatically handles:
   * - CSRF token retrieval and inclusion in request headers
   * - Cookie-based authentication via credentials: 'include'
   * - JSON parsing of response body
   * - Error handling for non-2xx responses
   *
   * @template T - The expected type of data in the response
   *
   * @param {string} url - The endpoint URL to request
   *                      @required
   * @param {RequestOptions} options - Additional request options and configuration. Extends the standard fetch RequestInit options.
   * @param {string} [options.csrfCookieName='XSRF-TOKEN'] - Name of the cookie containing the CSRF token
   * @param {string} [options.csrfHeaderName='X-XSRF-TOKEN'] - Name of the header to send the CSRF token in
   * @returns {Promise<ApiResponse<T>>} A promise that resolves to a standardized API response containing the data, status code, and headers.
   * @throws {ApiError} When the server responds with a non-2xx status code. Includes status, statusText, and the original Response object.
   *
   * @example
   * // Basic usage
   * try {
   *   const response = await apiClient.get('/api/users/me');
   *   console.log(response.data);
   * } catch (error) {
   *   if (error instanceof ApiError && error.status === 401) {
   *     // Handle unauthorized error
   *   }
   * }
   *
   * @example
   * // With type safety and custom CSRF configuration
   * interface UserProfile {
   *   id: string;
   *   name: string;
   *   email: string;
   * }
   *
   * const response = await apiClient.get<UserProfile>('/api/users/me', {
   *   csrfCookieName: 'MY-CSRF-COOKIE',
   *   csrfHeaderName: 'X-MY-CSRF-TOKEN'
   * });
   *
   * // TypeScript knows response.data has id, name, and email properties
   * const { id, name, email } = response.data;
   */
  async get<T = unknown>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { csrfCookieName = 'XSRF-TOKEN', csrfHeaderName = 'X-XSRF-TOKEN' } = options;

    const csrfToken = getCsrfToken(csrfCookieName);

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(csrfToken ? { [csrfHeaderName]: csrfToken } : {}),
    };

    const response = await fetch(url, { method: 'GET', credentials: 'include', headers });

    if (response.status < 200 || response.status >= 300) {
      const error = new ApiError(`[HTTP Error] Status: ${response.status}`);
      error.status = response.status;
      error.statusText = response.statusText;
      error.response = response;
      throw error;
    }

    const data = (await response.json()) as T;
    return { data, status: response.status, headers: response.headers };
  },
};

export default apiClient;
