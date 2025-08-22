import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { WristbandAuthContext } from './wristband-auth-context';
import {
  AuthStatus,
  IWristbandAuthProviderProps,
  SessionResponse,
  TokenResponse,
  WristbandErrorCode,
} from '../types/auth-provider-types';
import apiClient from '../api/api-client';
import {
  delay,
  is4xxError,
  isUnauthorizedError,
  resolveAuthProviderLoginUrl,
  validateAuthProviderSessionUrl,
  validateAuthProviderTokenUrl,
} from '../utils/auth-provider-utils';
import { WristbandError } from '../error';

const TOKEN_EXPIRATION_BUFFER_TIME_MS = 30000;
const MAX_API_ATTEMPTS = 3;
const API_RETRY_DELAY_MS = 100;

/**
 * WristbandAuthProvider establishes an authenticated session with your backend server
 * by making a request to your session endpoint. It manages authentication state and
 * provides session data to all child components through React Context.
 *
 * This component should be placed near the root of your application to make authentication
 * state and session data available throughout your component tree.
 *
 * @example Basic usage
 * ```jsx
 * function App() {
 *   return (
 *     <WristbandAuthProvider
 *       loginUrl="/api/auth/login"
 *       sessionUrl="/api/auth/session"
 *     >
 *       <YourAppComponents />
 *     </WristbandAuthProvider>
 *   );
 * }
 * ```
 *
 *  * @example Using access tokens directly in React
 * ```jsx
 * function App() {
 *   return (
 *     <WristbandAuthProvider
 *       loginUrl="/api/auth/login"
 *       sessionUrl="/api/auth/session"
 *       tokenUrl="/api/auth/token"
 *     >
 *       <YourAppComponents />
 *     </WristbandAuthProvider>
 *   );
 * }
 * ```
 *
 * @example With custom session metadata handling
 * ```jsx
 * function App() {
 *   const queryClient = useQueryClient();
 *
 *   return (
 *     <WristbandAuthProvider
 *       loginUrl="/api/auth/login"
 *       sessionUrl="/api/auth/session"
 *       transformSessionMetadata={(rawMetadata) => ({
 *         name: rawMetadata.displayName,
 *         email: rawMetadata.email,
 *         role: rawMetadata.userRole
 *       })}
 *       onSessionSuccess={(sessionData) => {
 *         // Cache additional data in React Query
 *         queryClient.setQueryData(['user-permissions'], sessionData.permissions);
 *       }}
 *     >
 *       <YourAppComponents />
 *     </WristbandAuthProvider>
 *   );
 * }
 * ```
 *
 * Once rendered, child components can access authentication state using the hooks:
 * - useWristbandAuth() - For authentication status (isAuthenticated, isLoading, authStatus, clearAuthData)
 * - useWristbandSession() - For session data (userId, tenantId, metadata)
 * - useWristbandToken() - For client-side token management, if applicable (getToken, clearToken)
 *
 * @template TSessionMetaData - Type for the transformed session metadata, if applicable.
 */
export function WristbandAuthProvider<TSessionMetaData = unknown>({
  children,
  csrfCookieName = 'CSRF-TOKEN',
  csrfHeaderName = 'X-CSRF-TOKEN',
  disableRedirectOnUnauthenticated = false,
  loginUrl,
  onSessionSuccess,
  sessionUrl,
  tokenUrl = '',
  transformSessionMetadata,
}: IWristbandAuthProviderProps<TSessionMetaData>) {
  // Internal State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<WristbandError | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [tenantId, setTenantId] = useState<string>('');
  const [metadata, setMetadata] = useState<TSessionMetaData>({} as TSessionMetaData);
  const [accessToken, setAccessToken] = useState<string>('');
  const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState<number>(0);

  // Tracks in-flight token requests to prevent duplicate API calls.
  const tokenRequestRef = useRef<Promise<string> | null>(null);

  // Convenience enum for users who don't want to check both isAuthenticated and isLoading
  const authStatus: AuthStatus = isLoading
    ? AuthStatus.LOADING
    : isAuthenticated
    ? AuthStatus.AUTHENTICATED
    : AuthStatus.UNAUTHENTICATED;

  const { resolvedLoginUrl, validatedSessionUrl, validatedTokenUrl } = useMemo(() => {
    // All validations happen first before any useEffect
    validateAuthProviderSessionUrl(sessionUrl);
    if (tokenUrl) {
      validateAuthProviderTokenUrl(tokenUrl);
    }
    return {
      resolvedLoginUrl: resolveAuthProviderLoginUrl(loginUrl),
      validatedSessionUrl: sessionUrl,
      validatedTokenUrl: tokenUrl,
    };
  }, [loginUrl, sessionUrl, tokenUrl]);

  /**
   * Destroys all auth, session, and token data.
   */
  const clearAuthData = useCallback(() => {
    clearToken();
    setIsAuthenticated(false);
    setIsLoading(false);
    setAuthError(null);
    setTenantId('');
    setUserId('');
    setMetadata({} as TSessionMetaData);
  }, []);

  /**
   * Allows setting of session metadata even after initial fetchSession() occurs.
   */
  const updateMetadata = useCallback((newMetadata: Partial<TSessionMetaData>) => {
    setMetadata((prevData) => ({ ...prevData, ...newMetadata }));
  }, []);

  /**
   * Clear token cache and any in-flight token request.
   */
  const clearToken = useCallback(() => {
    setAccessToken('');
    setAccessTokenExpiresAt(0);
    tokenRequestRef.current = null;
  }, []);

  /**
   * Token management with deduplication and caching. Server handles token refresh using session
   * cookie, so client only needs to cache and deduplicate.
   */
  const getToken = useCallback(async (): Promise<string> => {
    if (!validatedTokenUrl || !validatedTokenUrl.trim()) {
      throw new WristbandError(WristbandErrorCode.INVALID_TOKEN_URL, 'Token URL not configured');
    }

    if (!isAuthenticated) {
      throw new WristbandError(WristbandErrorCode.UNAUTHENTICATED, 'User is not authenticated');
    }

    // Check if we have a valid cached token (with 30 second buffer)
    if (accessToken && accessTokenExpiresAt > Date.now() + TOKEN_EXPIRATION_BUFFER_TIME_MS) {
      return accessToken;
    }

    // If there's already a token request in flight, return that promise
    if (tokenRequestRef.current) {
      return tokenRequestRef.current;
    }

    // Create new token request; server will handle refresh using session cookie
    const tokenRequest = (async () => {
      let lastError: unknown;

      try {
        for (let attempt = 1; attempt <= MAX_API_ATTEMPTS; attempt++) {
          try {
            const response = await apiClient.get<TokenResponse>(validatedTokenUrl, { csrfCookieName, csrfHeaderName });
            const { accessToken: newToken, expiresAt } = response.data;

            if (!newToken || !newToken.trim()) {
              throw new WristbandError(
                WristbandErrorCode.INVALID_TOKEN_RESPONSE,
                'Token Endpoint response is missing required field: "accessToken"'
              );
            }

            if (expiresAt === undefined || expiresAt === null || expiresAt < 0) {
              throw new WristbandError(
                WristbandErrorCode.INVALID_TOKEN_RESPONSE,
                'Token Endpoint response is missing required field: "expiresAt"'
              );
            }

            setAccessToken(newToken);
            setAccessTokenExpiresAt(expiresAt);
            return newToken;
          } catch (error) {
            lastError = error;

            // Just bubble up invalid response errors
            if (error instanceof WristbandError) {
              throw error;
            }

            // If token fetch fails due to auth error, clear token state.
            if (isUnauthorizedError(error)) {
              setAccessToken('');
              setAccessTokenExpiresAt(0);
              throw new WristbandError(WristbandErrorCode.UNAUTHENTICATED, 'Token request unauthorized', error);
            }

            // If it's any other 4xx error, bail early (don't retry client errors).
            if (is4xxError(error)) {
              throw new WristbandError(WristbandErrorCode.TOKEN_FETCH_FAILED, 'Failed to fetch token', error);
            }

            // If this is the last attempt, throw the last error
            if (attempt === MAX_API_ATTEMPTS) {
              break;
            }

            // Wait before retrying (only for 5xx errors and network issues)
            await delay(API_RETRY_DELAY_MS);
          }
        }

        // All attempts failed, so throw an error
        throw new WristbandError(WristbandErrorCode.TOKEN_FETCH_FAILED, 'Failed to fetch token', lastError);
      } finally {
        // Clear the in-flight request
        tokenRequestRef.current = null;
      }
    })();

    // Store the promise to prevent duplicate requests
    tokenRequestRef.current = tokenRequest;
    return tokenRequest;
  }, [isAuthenticated, accessToken, accessTokenExpiresAt]);

  /**
   * Bootstrap the application with the authenticated user's session data via session cookie.
   */
  useEffect(() => {
    const fetchSession = async () => {
      let lastError: WristbandError | null = null;

      for (let attempt = 1; attempt <= MAX_API_ATTEMPTS; attempt++) {
        try {
          // The session API will let React know if the user has a previously authenticated session.
          // If so, it will initialize session data.
          const response = await apiClient.get<SessionResponse>(validatedSessionUrl, {
            csrfCookieName,
            csrfHeaderName,
          });
          const { userId, tenantId, metadata: rawMetadata } = response.data;

          if (!userId || !userId.trim()) {
            throw new WristbandError(
              WristbandErrorCode.INVALID_SESSION_RESPONSE,
              'Session Endpoint response is missing required field: "userId"'
            );
          }

          if (!tenantId || !tenantId.trim()) {
            throw new WristbandError(
              WristbandErrorCode.INVALID_SESSION_RESPONSE,
              'Session Endpoint response is missing required field: "tenantId"'
            );
          }

          // Execute side effects callback before updating state if provided
          if (onSessionSuccess) {
            await Promise.resolve(onSessionSuccess(response.data));
          }

          // Apply transformation if provided
          if (rawMetadata) {
            setMetadata(
              transformSessionMetadata ? transformSessionMetadata(rawMetadata) : (rawMetadata as TSessionMetaData)
            );
          }

          // Update remaining context state last
          setTenantId(tenantId);
          setUserId(userId);
          setIsAuthenticated(true);
          setIsLoading(false);
          setAuthError(null);
          return;
        } catch (error) {
          // Always bubble up invalid response errors (represents a dev configuration error)
          if (error instanceof WristbandError) {
            throw error;
          }

          if (isUnauthorizedError(error)) {
            lastError = new WristbandError(WristbandErrorCode.UNAUTHENTICATED, 'User is not authenticated', error);
            break;
          }

          // If it's a non-401 4xx error, bail early (don't retry client errors)
          if (is4xxError(error)) {
            lastError = new WristbandError(WristbandErrorCode.SESSION_FETCH_FAILED, 'Failed to fetch session', error);
            break;
          }

          // If this is the last attempt, don't delay
          if (attempt === MAX_API_ATTEMPTS) {
            lastError = new WristbandError(WristbandErrorCode.SESSION_FETCH_FAILED, 'Failed to fetch session', error);
            break;
          }

          // Wait before retrying (only for 5xx errors and network issues)
          await delay(API_RETRY_DELAY_MS);
        }
      }

      if (disableRedirectOnUnauthenticated) {
        setAuthError(lastError);
        setIsAuthenticated(false);
        setIsLoading(false);
      } else {
        // Preserve the current page for when the user returns after re-authentication.
        window.location.href = resolvedLoginUrl;
      }
    };

    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WristbandAuthContext.Provider
      value={{
        authError,
        authStatus,
        clearAuthData,
        clearToken,
        getToken,
        isAuthenticated,
        isLoading,
        metadata,
        tenantId,
        updateMetadata,
        userId,
      }}
    >
      {children}
    </WristbandAuthContext.Provider>
  );
}
