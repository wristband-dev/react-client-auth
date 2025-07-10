import { describe, it, expect } from 'vitest';

import { RequestOptions, ApiResponse } from '../../src/types/api-client-types';
import { ApiError } from '../../src/error';

describe('API Client Types', () => {
  it('should allow creating RequestOptions objects with CSRF properties', () => {
    // Empty options
    const emptyOptions: RequestOptions = {};
    expect(emptyOptions).toBeDefined();

    // Options with CSRF properties
    const csrfOptions: RequestOptions = {
      csrfCookieName: 'CSRF-TOKEN',
      csrfHeaderName: 'X-CSRF-HEADER',
    };
    expect(csrfOptions.csrfCookieName).toBe('CSRF-TOKEN');
    expect(csrfOptions.csrfHeaderName).toBe('X-CSRF-HEADER');

    // Options with both CSRF and standard fetch properties
    const fullOptions: RequestOptions = {
      csrfCookieName: 'CSRF-TOKEN',
      csrfHeaderName: 'X-CSRF-HEADER',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foo: 'bar' }),
      credentials: 'include',
    };

    expect(fullOptions.csrfCookieName).toBe('CSRF-TOKEN');
    expect(fullOptions.csrfHeaderName).toBe('X-CSRF-HEADER');
    expect(fullOptions.method).toBe('POST');
    expect(fullOptions.credentials).toBe('include');
    expect(fullOptions.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(fullOptions.body).toBe(JSON.stringify({ foo: 'bar' }));
  });

  it('should support the ApiResponse interface with generic type parameter', () => {
    // Define a simple data type
    interface UserData {
      id: string;
      name: string;
    }

    // Create a mock Headers object
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    // Create a response with string data
    const stringResponse: ApiResponse<string> = {
      data: 'Success',
      status: 200,
      headers,
    };

    expect(stringResponse.data).toBe('Success');
    expect(stringResponse.status).toBe(200);
    expect(stringResponse.headers).toBe(headers);

    // Create a response with complex data type
    const userResponse: ApiResponse<UserData> = {
      data: { id: '123', name: 'Test User' },
      status: 200,
      headers,
    };

    expect(userResponse.data.id).toBe('123');
    expect(userResponse.data.name).toBe('Test User');
    expect(userResponse.status).toBe(200);
    expect(userResponse.headers).toBe(headers);
  });

  it('should create and extend ApiError correctly', () => {
    // Create a basic error
    const basicError = new ApiError('Something went wrong');
    expect(basicError).toBeInstanceOf(Error);
    expect(basicError).toBeInstanceOf(ApiError);
    expect(basicError.message).toBe('Something went wrong');
    expect(basicError.name).toBe('ApiError');

    // Create an error with HTTP details
    const httpError = new ApiError('Not Found');
    httpError.status = 404;
    httpError.statusText = 'Not Found';

    expect(httpError.status).toBe(404);
    expect(httpError.statusText).toBe('Not Found');

    // Create an error with a response object
    const responseError = new ApiError('Server Error');
    responseError.status = 500;
    responseError.statusText = 'Internal Server Error';
    responseError.response = new Response(null, { status: 500 });

    expect(responseError.status).toBe(500);
    expect(responseError.statusText).toBe('Internal Server Error');
    expect(responseError.response).toBeInstanceOf(Response);
    expect(responseError.response?.status).toBe(500);
  });

  it('should verify error instanceof for error handling', () => {
    // Test that it works with instanceof for proper error handling
    const error = new ApiError('Unauthorized');

    if (error instanceof ApiError) {
      error.status = 401;
      expect(error.status).toBe(401);
    } else {
      // This should never execute
      expect(false).toBe(true);
    }

    // Also ensure standard Error methods are available
    expect(error.toString()).toContain('Unauthorized');
  });
});
