import { describe, it, expect } from 'vitest';

import { ApiError, WristbandTokenError } from '../../src/error';

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

describe('WristbandTokenError', () => {
  it('should create an error with UNAUTHENTICATED code', () => {
    const error = new WristbandTokenError('UNAUTHENTICATED', 'User not authenticated');
    expect(error).toBeInstanceOf(WristbandTokenError);
    expect(error.name).toBe('WristbandTokenError');
    expect(error.code).toBe('UNAUTHENTICATED');
    expect(error.message).toBe('User not authenticated');
    expect(error.originalError).toBeUndefined();
  });

  it('should create an error with TOKEN_FETCH_FAILED code and original error', () => {
    const original = new Error('Something bad happened');
    const error = new WristbandTokenError('TOKEN_FETCH_FAILED', 'Token fetch failed', original);
    expect(error.code).toBe('TOKEN_FETCH_FAILED');
    expect(error.message).toBe('Token fetch failed');
    expect(error.originalError).toBe(original);
  });

  it('should create an error with TOKEN_URL_NOT_CONFIGURED code', () => {
    const error = new WristbandTokenError('TOKEN_URL_NOT_CONFIGURED', 'Token URL missing');
    expect(error.code).toBe('TOKEN_URL_NOT_CONFIGURED');
    expect(error.message).toBe('Token URL missing');
  });
});
