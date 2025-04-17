import { useCallback, useEffect, useState } from 'react';

import { WristbandAuthContext } from './wristband-auth-context';
import { AuthStatus, IWristbandAuthProviderProps, SessionResponse } from '../types/auth-provider-types';
import { isUnauthorizedError } from '../utils/auth-utils';
import apiClient from '../api/api-client';
import {
  resolveAuthProviderLoginUrl,
  validateAuthProviderLogoutUrl,
  validateAuthProviderSessionUrl,
} from '../utils/auth-provider-utils';

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
 *       logoutUrl="/api/auth/logout"
 *       sessionUrl="/api/auth/session"
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
 *       logoutUrl="/api/auth/logout"
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
 * - useWristbandAuth() - For authentication status (isAuthenticated, isLoading, authStatus)
 * - useWristbandSession() - For session data (userId, tenantId, metadata)
 *
 * @template TSessionMetaData - Type for the transformed session metadata, if applicable.
 */
export function WristbandAuthProvider<TSessionMetaData = unknown>({
  children,
  csrfCookieName = 'XSRF-TOKEN',
  csrfHeaderName = 'X-XSRF-TOKEN',
  disableRedirectOnUnauthenticated = false,
  loginUrl,
  logoutUrl,
  onSessionSuccess,
  sessionUrl,
  transformSessionMetadata,
}: IWristbandAuthProviderProps<TSessionMetaData>) {
  const resolvedLoginUrl = resolveAuthProviderLoginUrl(loginUrl);
  validateAuthProviderLogoutUrl(logoutUrl);
  validateAuthProviderSessionUrl(sessionUrl);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string>('');
  const [tenantId, setTenantId] = useState<string>('');
  const [metadata, setMetadata] = useState<TSessionMetaData>({} as TSessionMetaData);

  const authStatus: AuthStatus = isLoading
    ? AuthStatus.LOADING
    : isAuthenticated
    ? AuthStatus.AUTHENTICATED
    : AuthStatus.UNAUTHENTICATED;

  const updateMetadata = useCallback((newMetadata: Partial<TSessionMetaData>) => {
    setMetadata((prevData) => ({ ...prevData, ...newMetadata }));
  }, []);

  // Bootstrap the application with the authenticated user's session data.
  useEffect(() => {
    const fetchSession = async () => {
      try {
        // The session API will let React know if the user has a previously authenticated session.
        // If so, it will initialize session data.
        const response = await apiClient.get<SessionResponse>(sessionUrl, { csrfCookieName, csrfHeaderName });
        const { userId, tenantId, metadata: rawMetadata } = response.data;

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
      } catch (error: unknown) {
        console.log(error);
        if (disableRedirectOnUnauthenticated) {
          setIsAuthenticated(false);
          setIsLoading(false);
        } else {
          // Don't call logout on 401 to preserve the current page for when the user returns after re-authentication.
          window.location.href = isUnauthorizedError(error) ? resolvedLoginUrl : logoutUrl;
        }
      }
    };

    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WristbandAuthContext.Provider
      value={{
        authStatus,
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
