import { PropsWithChildren } from 'react';

/**
 * Authentication status enum representing the possible states of user authentication.
 *
 * This enum is used throughout the authentication flow to represent the current state
 * of the authentication process and helps components determine what UI to display.
 */
export enum AuthStatus {
  /**
   * The authentication state is currently being determined. This is the initial state during session validation.
   */
  LOADING = 'loading',
  /**
   * The user is successfully authenticated with a valid session. Protected resources can be accessed in this state.
   */
  AUTHENTICATED = 'authenticated',
  /**
   * The user is not authenticated or the session is invalid. Access to protected resources should be denied in this
   * state.
   */
  UNAUTHENTICATED = 'unauthenticated',
}

/**
 * Context interface providing authentication state and session data throughout the application.
 *
 * This context is provided by the WristbandAuthProvider and can be accessed using the
 * useWristbandAuth() and useWristbandSession() hooks.
 *
 * @template TSessionMetadata - Type for custom session metadata, defaulting to unknown.
 */
export interface IWristbandAuthContext<TSessionMetadata = unknown> {
  /**
   * Current authentication status representing the state of the authentication process.
   * Use this for showing appropriate UI based on auth state (loading indicators, login forms, etc.)
   */
  authStatus: AuthStatus;
  /**
   * This function clears all client-side auth state including authentication status, user data,
   * session metadata, and cached tokens. Use this when you need to completely reset the
   * SDK state, typically for testing, error recovery, or when implementing custom logout flows.
   *
   * NOTE: This only clears React state and does not invalidate server-side sessions or
   * redirect the user. For standard logout, redirect to your logout URL instead.
   *
   * @example
   * ```typescript
   * const { clearAuthData } = useWristbandAuth();
   *
   * const handleCriticalError = () => {
   *   clearAuthData(); // Reset all state
   *   redirectToLogin('/api/auth/login');
   * };
   * ```
   */
  clearAuthData: () => void;
  /**
   * Clears the cached access token and forces the next getToken() call to fetch a fresh token,
   * assuming that the user still has an authenticated session.
   *
   * NOTE: This only clears the client-side token cache. If the user's session remains
   * active, then the getToken() will continue to work by fetching new tokens from the
   * configured tokenUrl endpoint.
   *
   * @example
   * ```typescript
   * const { getToken, clearToken } = useWristbandToken();
   *
   * const forceTokenFetch = async () => {
   *   clearToken(); // Clear cached token
   *   const freshToken = await getToken(); // Fetches new token
   * };
   * ```
   */
  clearToken: () => void;
  /**
   * Retrieves a valid access token for making authenticated API calls to resource servers. Returns a
   * cached token if available and not expired; otherwise fetches a fresh token from the configured
   * "tokenUrl" endpoint. Your server's Token Endpoint should automatically handle token expiration and
   * refresh using the user's session cookie.
   *
   * If the token endpoint returns a 401 (unauthorized), the cached token state will be
   * automatically cleared and the user may be redirected to login depending on configuration.
   *
   * @returns Promise that resolves to a valid access token string
   * @throws Error if tokenUrl is not configured, user is not authenticated, or token retrieval fails
   *
   * @example
   * ```typescript
   * const { getToken } = useWristbandToken();
   *
   * const callAPI = async () => {
   *   try {
   *     const token = await getToken();
   *     const response = await fetch('/api/protected', {
   *       headers: { 'Authorization': `Bearer ${token}` }
   *     });
   *   } catch (error) {
   *     console.error('Token retrieval failed:', error);
   *   }
   * };
   * ```
   */
  getToken: () => Promise<string>;
  /**
   * Boolean flag indicating if the user is authenticated.
   * Use this for conditional rendering of authenticated content.
   */
  isAuthenticated: boolean;
  /**
   * Boolean flag indicating if the authentication state is still being determined.
   * Use this to show loading indicators during initial session validation.
   */
  isLoading: boolean;
  /**
   * Custom metadata associated with the authenticated session. The type is defined by the TSessionMetadata
   * generic parameter. Available only when authentication is successful.
   */
  metadata: TSessionMetadata;
  /**
   * Identifier for the tenant associated with the authenticated session.
   * Available only when authentication is successful.
   */
  tenantId: string;
  /**
   * Function to update the session metadata. This allows components to modify session data without replacing
   * the entire object.
   *
   * @param newMetadata - Partial metadata object containing properties to update
   */
  updateMetadata: (newMetadata: Partial<TSessionMetadata>) => void;
  /**
   * Unique identifier for the authenticated user.
   * Available only when authentication is successful.
   */
  userId: string;
}

export interface IWristbandAuthProviderProps<TSessionMetadata = unknown>
  extends PropsWithChildren<{
    /**
     * Name of the CSRF cookie that the server sets. This enables CSRF protection for requests made to your
     * backend server.
     * @default 'CSRF-TOKEN'
     */
    csrfCookieName?: string;
    /**
     * Name of the CSRF header that will be sent with authenticated requests. This should match the header name
     * your server expects for CSRF validation.
     * @default 'X-CSRF-TOKEN'
     */
    csrfHeaderName?: string;
    /**
     * When true, unauthenticated users will remain on the current page instead of being redirected to your backend
     * server's Login or Logout Endpoints. This is useful for public pages that have both authenticated and
     * unauthenticated states.
     * @default false
     */
    disableRedirectOnUnauthenticated?: boolean;
    /**
     * This URL should point to your backend server's Login Endpoint that handles the authentication flow with Wristband.
     * @required
     */
    loginUrl: string;
    /**
     * This URL should point to your backend server's Logout Endpoint that handles terminating the user's session in your
     * application session as well as redirecting to Wristband's Logout Endpoint.
     * @required
     */
    logoutUrl: string;
    /**
     * Callback that executes after a successful session response but before authentication state updates.
     *
     * This hook is designed for operations that must complete before the component tree re-renders
     * due to authentication state changes. Common use cases include:
     *
     * - Caching user data with state management solutions (React Query, Redux, etc.)
     * - Preloading critical resources needed immediately after authentication
     * - Initializing analytics or monitoring services with user identity
     * - Setting up user-specific configurations
     *
     * If this callback returns a Promise, the authentication state update will be
     * delayed until the Promise resolves, ensuring all async operations complete first.
     *
     * NOTE: For simply transforming the metadata stored in context, use transformSessionMetadata() instead.
     *
     * @example
     * onSessionSuccess={async (sessionResponse) => {
     *   // Cache user data in React Query
     *   queryClient.setQueryData(['user-profile'], sessionResponse.metadata.profile);
     *
     *   // Prefetch critical user permissions
     *   await queryClient.prefetchQuery(
     *     ['user-permissions'],
     *     () => fetchPermissions(sessionResponse.userId)
     *   );
     * }}
     *
     * @param sessionResponse The complete session data returned from the session endpoint
     * @returns void or a Promise that resolves when all operations are complete
     */
    onSessionSuccess?: (sessionResponse: SessionResponse) => Promise<void> | void;
    /**
     * This URL should point to your backend server's Session Endpoint, which returns an authenticated user's userId,
     * tenantId, and any optional metadata.
     * @required
     */
    sessionUrl: string;
    /**
     * Optional URL endpoint for retrieving access tokens from your application's backend server.
     * When provided, enables getToken() functionality in the useWristbandAuth() hook for making
     * direct API calls to resource servers with Bearer tokens. If not provided, applications should
     * use session-based authentication for all API calls.
     *
     * The token endpoint should:
     * - Ensure the user has a valid session cookie
     * - Handle token refresh automatically using the session state, if necessary.
     * - Return a JSON response with { accessToken: string, expiresAt: number }
     *
     * @example "/api/auth/token"
     */
    tokenUrl?: string;
    /**
     * Function to transform raw metadata from the session response before storing it in context.
     *
     * Use this to format, type, or filter the metadata that your components will access
     * via the useWristbandSession() hook. This is particularly useful for:
     *
     * - Converting data types (e.g., string dates to Date objects)
     * - Adding computed properties
     * - Filtering out unnecessary properties
     * - Ensuring type safety for the metadata
     *
     * @example
     * transformSessionMetadata={(rawMetadata: unknown): MySessionData => ({
     *   name: rawMetadata.displayName,
     *   email: rawMetadata.email,
     *   hasOwnerRole: rawMetadata.roles.some(role => isAdminRole(role.name)
     * })}
     *
     * @param rawSessionMetadata The unprocessed metadata object from the session response
     * @returns A transformed metadata object of type TSessionMetadata
     */
    transformSessionMetadata?: (rawSessionMetadata: unknown) => TSessionMetadata;
  }> {}

/**
 * Response structure returned by the session endpoint.
 *
 * This interface represents the expected data structure your backend server should return from its Session Endpoint.
 * It contains the essential user information needed to establish an authenticated session in your application.
 *
 * @interface SessionResponse
 * @property {unknown} metadata - Additional user data or session information. The type is 'unknown' to allow flexible schema that can be transformed by your application as needed.
 * @property {string} tenantId - The identifier for the tenant the user belongs to.
 *                               @required
 * @property {string} userId - The unique identifier for the authenticated user.
 *                             @required
 *
 * @example
 * {
 *   "userId": "user123456",
 *   "tenantId": "tenant123456",
 *   "metadata": {
 *     "displayName": "Jane Doe",
 *     "email": "jane@example.com",
 *     "roles": ["admin", "user"]
 *   }
 * }
 */
export interface SessionResponse {
  metadata: unknown;
  tenantId: string;
  userId: string;
}

/**
 * Response structure returned by the token endpoint when fetching access tokens. The token endpoint
 * should return this JSON structure when successfully issuing or refreshing an access token for the
 * authenticated user's session.
 *
 * @interface TokenResponse
 */
export interface TokenResponse {
  /**
   * The access token string to be used in Authorization headers for API calls.
   */
  accessToken: string;
  /**
   * Unix timestamp in milliseconds indicating when the token expires.
   * Used by the SDK to determine when to fetch a fresh token.
   *
   * @example Date.now() + (60 * 60 * 1000) // Expires in 1 hour
   */
  expiresAt: number; // Unix timestamp in milliseconds
}
