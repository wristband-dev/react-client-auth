import { describe, it, expect } from 'vitest';

import { ApiError, WristbandError } from '../../src/error';
import { WristbandErrorCode } from '../../src/types/auth-provider-types';

describe('ApiError', () => {
  it('should create an ApiError with correct name and message', () => {
    const error = new ApiError('Something went wrong');
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe('ApiError');
    expect(error.message).toBe('Something went wrong');
  });

  it('should allow setting optional HTTP-related properties', () => {
    const error = new ApiError('Fetch failed');
    error.status = 404;
    error.statusText = 'Not Found';

    expect(error.status).toBe(404);
    expect(error.statusText).toBe('Not Found');
  });
});

describe('WristbandError', () => {
  it('should create an error with UNAUTHENTICATED code', () => {
    const error = new WristbandError(WristbandErrorCode.UNAUTHENTICATED, 'User not authenticated');
    expect(error).toBeInstanceOf(WristbandError);
    expect(error.name).toBe('WristbandError');
    expect(error.code).toBe('UNAUTHENTICATED');
    expect(error.message).toBe('User not authenticated');
    expect(error.originalError).toBeUndefined();
  });

  it('should create an error with TOKEN_FETCH_FAILED code and original error', () => {
    const original = new Error('Something bad happened');
    const error = new WristbandError(WristbandErrorCode.TOKEN_FETCH_FAILED, 'Token fetch failed', original);
    expect(error.code).toBe('TOKEN_FETCH_FAILED');
    expect(error.message).toBe('Token fetch failed');
    expect(error.originalError).toBe(original);
  });

  it('should create an error with INVALID_TOKEN_URL code', () => {
    const error = new WristbandError(WristbandErrorCode.INVALID_TOKEN_URL, 'Token URL missing');
    expect(error.code).toBe('INVALID_TOKEN_URL');
    expect(error.message).toBe('Token URL missing');
  });

  it('should create an error with INVALID_TOKEN_RESPONSE code', () => {
    const error = new WristbandError(
      WristbandErrorCode.INVALID_TOKEN_RESPONSE,
      'Token Endpoint response is missing required field: "accessToken"'
    );
    expect(error.code).toBe('INVALID_TOKEN_RESPONSE');
    expect(error.message).toBe('Token Endpoint response is missing required field: "accessToken"');
  });

  it('should create an error with INVALID_LOGIN_URL code', () => {
    const error = new WristbandError(WristbandErrorCode.INVALID_LOGIN_URL, 'Login URL missing');
    expect(error.code).toBe('INVALID_LOGIN_URL');
    expect(error.message).toBe('Login URL missing');
  });

  it('should create an error with INVALID_LOGOUT_URL code', () => {
    const error = new WristbandError(WristbandErrorCode.INVALID_LOGOUT_URL, 'Logout URL missing');
    expect(error.code).toBe('INVALID_LOGOUT_URL');
    expect(error.message).toBe('Logout URL missing');
  });

  it('should create an error with INVALID_SESSION_URL code', () => {
    const error = new WristbandError(WristbandErrorCode.INVALID_SESSION_URL, 'Session URL missing');
    expect(error.code).toBe('INVALID_SESSION_URL');
    expect(error.message).toBe('Session URL missing');
  });

  it('should create an error with SESSION_FETCH_FAILED code', () => {
    const error = new WristbandError(WristbandErrorCode.SESSION_FETCH_FAILED, 'Session fetch failed');
    expect(error.code).toBe('SESSION_FETCH_FAILED');
    expect(error.message).toBe('Session fetch failed');
  });

  it('should create an error with INVALID_SESSION_RESPONSE code', () => {
    const error = new WristbandError(
      WristbandErrorCode.INVALID_SESSION_RESPONSE,
      'Session Endpoint response is missing required field: "userId"'
    );
    expect(error.code).toBe('INVALID_SESSION_RESPONSE');
    expect(error.message).toBe('Session Endpoint response is missing required field: "userId"');
  });

  it('should create an error with SESSION_FETCH_FAILED code and original error', () => {
    const original = new ApiError('Server Error');
    original.status = 500;
    const error = new WristbandError(WristbandErrorCode.SESSION_FETCH_FAILED, 'Session fetch failed', original);
    expect(error.code).toBe('SESSION_FETCH_FAILED');
    expect(error.message).toBe('Session fetch failed');
    expect(error.originalError).toBe(original);
  });

  it('should create an error with INVALID_SESSION_RESPONSE code and original error', () => {
    const original = { missingField: 'userId' };
    const error = new WristbandError(WristbandErrorCode.INVALID_SESSION_RESPONSE, 'Invalid session response', original);
    expect(error.code).toBe('INVALID_SESSION_RESPONSE');
    expect(error.message).toBe('Invalid session response');
    expect(error.originalError).toBe(original);
  });
});
