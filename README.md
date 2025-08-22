<div align="center">
  <a href="https://wristband.dev">
    <picture>
      <img src="https://assets.wristband.dev/images/email_branding_logo_v1.png" alt="Github" width="297" height="64">
    </picture>
  </a>
  <p align="center">
    Enterprise-ready auth that is secure by default, truly multi-tenant, and ungated for small businesses.
  </p>
  <p align="center">
    <b>
      <a href="https://wristband.dev">Website</a> • 
      <a href="https://docs.wristband.dev/">Documentation</a>
    </b>
  </p>
</div>

<br/>

---

<br/>

# Wristband Client-Side Authentication SDK for React

[![npm package](https://img.shields.io/badge/npm%20i-react--client--auth-brightgreen)](https://www.npmjs.com/package/@wristband/react-client-auth)
[![version number](https://img.shields.io/github/v/release/wristband-dev/react-client-auth?color=green&label=version)](https://github.com/wristband-dev/react-client-auth/releases)
[![Actions Status](https://github.com/wristband-dev/react-client-auth/workflows/Test/badge.svg)](https://github.com/wristband-dev/react-client-auth/actions)
[![License](https://img.shields.io/github/license/wristband-dev/react-client-auth)](https://github.com/wristband-dev/react-client-auth/blob/main/LICENSE.md)

The SDK handles authentication interactions in your app’s React frontend. It’s designed to work in tandem with your backend server that integrates with Wristband using the Backend Server Integration Pattern. The backend exposes a required Session Endpoint that the React SDK calls to initialize the app in the browser with an authenticated user session. The backend can also optionally expose a Token Endpoint, allowing the React SDK to retrieve access tokens and store them in its client-side cache for direct use in browser-based requests.

---

## Migrating From Older SDK Versions

On an older version of our SDK? Check out our migration guide:

- [Instructions for migrating to Version 2.x (latest)](migration/v2/README.md)
- [Instructions for migrating to Version 1.x](migration/v1/README.md)

<br>

## Installation

```sh
npm install @wristband/react-client-auth
```

or 

```sh
yarn add @wristband/react-client-auth
```

## Usage

> [!NOTE]
> Important: Before using this SDK, you must have already implemented the required backend server endpoints for authentication in your server: Login, Logout, and Session. This SDK connects to those existing endpoints but does not implement them for you. Optionally, if you plan to use access tokens directly from the browser, then your backend server will also need to implement the Token Endpoint.

### 1) Use the Wristband Auth Provider

The `WristbandAuthProvider` establishes and manages authentication state throughout your application. This component fetches the user's session data from your backend server and makes it available via React Context.

The provider requires two URL endpoints:
- `loginUrl`: The URL of your backend server's Login Endpoint that initiates the authentication process.
- `sessionUrl`: The URL of your backend server's Session Endpoint that returns the current user's session data.

Place the `WristbandAuthProvider` at your app's root to ensure the user's authenticated state is available throughout your application and verified on initial load.

```typescript
import { WristbandAuthProvider } from '@wristband/react-client-auth';

function App() {
  return (
    <WristbandAuthProvider
      loginUrl="https://your-server.com/api/auth/login"
      sessionUrl="https://your-server.com/api/v1/session"
    >
      <YourAppComponents />
    </WristbandAuthProvider>
  );
}
```

When working with TypeScript, you can provide type definitions for your session metadata to ensure proper type safety when working with that data in your application.

```typescript
import { WristbandAuthProvider } from '@wristband/react-client-auth';

interface MySessionMetadata {
  displayName: string;
  email: string;
  roles: string[];
}

function AppRoot() {
  return (
    <WristbandAuthProvider<MySessionMetadata>
      loginUrl='/api/auth/login'
      sessionUrl='/api/v1/session'
    >
      <App />
    </WristbandAuthProvider>
  );
}
```

### 2) Use Auth and Session Hooks

The SDK provides two hooks for accessing authentication data:

#### useWristbandAuth()

This hook provides authentication status information and functionality:

- `isAuthenticated`: Boolean indicating if the user has an authenticated session.
- `isLoading`: Boolean indicating if the authentication status is still being determined.
- `authError`: WristbandError object containing error details when authentication fails, or `null` when no error has occurred.
- `authStatus`: Enum value for convenience (`LOADING`, `AUTHENTICATED`, or `UNAUTHENTICATED`).
- `clearAuthData()`: Function that destroys all auth, session, and token data (auth status becomes `UNAUTHENTICATED`).

Use this hook when you need to control access to protected content by checking authentication status.  This enables common patterns like conditional rendering of authenticated/unauthenticated views, route protection, or dynamic UI updates based on the user's auth status.

```typescript
import { useWristbandAuth } from '@wristband/react-client-auth';

function AuthStatus() {
  const { authError, isAuthenticated, isLoading, authStatus, clearAuthData } = useWristbandAuth();
  
  if (isLoading) {
    return <div>Checking authentication status...</div>;
  }
  
  return (
    <div>
      <h2>Authentication Status: {authStatus}</h2>
      {isAuthenticated && (
        <button onClick={() => alert(`I'm authenticated!!`)}>
          Show Auth
        </button>
      )}
      {authError && (
        <>
          <p>Error code: {authError.code}</p>
          <p>Error message: {authError.message}</p>
        </>
      )}
    </div>
  );
}
```

The `clearAuthData()` function permanently clears all client-side auth state, session data, and token data. You can optionally use this when you need to completely reset the SDK state, typically for testing, error recovery, or when implementing custom logout flows. Note that this only clears React state and does not invalidate session cookies nor redirect the user. For standard logout, redirect to your server's Logout Endpoint instead.

```typescript
import { redirectToLogin, useWristbandAuth } from '@wristband/react-client-auth';

function ClearAuth() {
  const { clearAuthData } = useWristbandAuth();
  
  const reauthenticate = () => {
    clearAuthData();
    redirectToLogin('https://your-server.com/api/auth/login');
  };
  
  return (
    <div>
      <h2>Clear Authentication Data</h2>
      <button onClick={() => reauthenticate()}>
        Re-Authenticate
      </button>
    </div>
  );
}
```

#### useWristbandSession()

This hook provides access to the authenticated user's session data:

- `userId`: The authenticated user's ID.
- `tenantId`: The ID of the tenant that the authenticated user belongs to.
- `metadata`: Opional custom session metadata provided by your backend, if applicable (profile info, roles, etc.)
- `updateMetadata()`: Function to modify the metadata object stored in the client-side React Context. This enables real-time UI updates with new metadata values, but it is limited to the current browser session only. Any changes made with this function will not persist across page refreshes or be synchronized to your backend server.

Use this hook when you need access to the user data provided by your backend's Session Endpoint. It helps you build personalized experiences based on the specific user information your server makes available.

```typescript
import { useWristbandSession } from '@wristband/react-client-auth';

function UserProfile() {
  const { userId, tenantId, metadata, updateMetadata } = useWristbandSession();
  
  const handleNameUpdate = (newName) => {
    updateMetadata({ name: newName });
  };
  
  return (
    <div>
      <h2>User Profile</h2>
      <p>User ID: {userId}</p>
      <p>Tenant: {tenantId}</p>
      
      <h3>User Details</h3>
      <p>Name: {metadata.name}</p>
      <p>Email: {metadata.email}</p>
      <p>Role: {metadata.role}</p>
      
      <button onClick={() => handleNameUpdate("New Name")}>
        Update Name
      </button>
    </div>
  );
}
```

For TypeScript applications, you can leverage type safety when working with session metadata. By providing a type parameter to the `useWristbandSession` hook, you can ensure that your metadata object and update functions are properly typed. This approach ensures proper IDE autocomplete suggestions for metadata properties as well as compile-time type checking for the values you pass to `updateMetadata`.

```typescript
import { useWristbandSession } from '@wristband/react-client-auth';

interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

function PreferencesPanel() {
  const { metadata, updateMetadata } = useWristbandSession<UserPreferences>();
  
  const toggleTheme = () => {
    const newTheme = metadata.theme === 'light' ? 'dark' : 'light';
    updateMetadata({ theme: newTheme });
  };
  
  return (
    <div>
      <h2>Your Preferences</h2>
      <button onClick={toggleTheme}>
        Switch to {metadata.theme === 'light' ? 'Dark' : 'Light'} Mode
      </button>
      
      <label>
        <input 
          type="checkbox"
          checked={metadata.notifications}
          onChange={(e) => updateMetadata({ notifications: e.target.checked })}
        />
        Enable Notifications
      </label>
    </div>
  );
}
```

### 3) Use Token Hook (Optional)

When following Wristband’s backend server integration pattern, the recommended approach is to protect your backend APIs by relying solely on the session cookie, which the browser automatically includes with each request. Your backend should use middleware to validate the session, verify the CSRF token, and refresh expired tokens if necessary. This is the most secure way to protect your backend.

Alternatively, the React SDK can extract the access token from the authenticated session and cache it client-side. This enables developers to send access tokens manually in the Authorization header for outgoing API requests. In this model, your backend should use middleware that checks for a Bearer token in the Authorization header and validates the JWT. While this approach is slightly less secure than relying entirely on session cookies, it is still more secure than storing tokens in local storage. The benefit is greater flexibility to make API calls directly from the browser without having to route every request through a backend-for-frontend (BFF) layer.

#### useWristbandToken()

The useWristbandToken() hook exposes functionality for maanging client-side access tokens:

- `getToken()`: Retrieves a valid access token for making authenticated API calls to resource servers. Returns a cached token if available and not expired, otherwise fetches a fresh token from the configured `tokenUrl` endpoint. The access token does not persist across page navigations or refreshes. Your server's Token Endpoint is responsible for refreshing expired tokens by using the user's session state.
- `clearToken()`: Function to modify the metadata object stored in the client-side React Context. This enables real-time UI updates with new metadata values, but it is limited to the current browser session only. Any changes made with this function will not persist across page refreshes or be synchronized to your backend server.

In order to use this hook, you must first configure the `tokenUrl` property on the `WristbandAuthProvider` to point to your server's Token Endpoint:

```typescript
import { WristbandAuthProvider } from '@wristband/react-client-auth';

function App() {
  return (
    <WristbandAuthProvider
      loginUrl="https://your-server.com/api/auth/login"
      sessionUrl="https://your-server.com/api/v1/session"
      tokenUrl="https://your-server.com/api/v1/token" // Your server's Token Endpoint
    >
      <YourAppComponents />
    </WristbandAuthProvider>
  );
}
```

From there, you can now leverage the useWristbandToken() hook within your React app:

```typescript
import axios from 'axios';
import { useWristbandToken } from '@wristband/react-client-auth';

function HelloWorld() {
  const { getToken, clearToken } = useWristbandToken();
  
  const handleHelloWorld = async () => {
    try {
      const token = await getToken();
      const response = await axios.get('https://your-server.com/api/v1/hello-world');
      console.log(`Hello World! ${response.data}`);
    } catch (error) {
      console.error(error);
      clearToken();
    }
  };
  
  return (
    <div>
      <h2>Hello World</h2>
      <button onClick={() => handleHelloWorld()}>
        Say Hello
      </button>
    </div>
  );
}
```

### 4) Use Auth Utility Functions

The SDK provides utility functions for handling login and logout redirects, making it easy to implement navigation and error handling. These utility functions handle the details of proper URL formatting and query parameter management, ensuring a consistent and reliable authentication flow throughout your application.

#### redirectToLogin()

The `redirectToLogin` function redirects the user to your backend server's Login Endpoint:

```typescript
import { redirectToLogin } from '@wristband/react-client-auth';

function LoginButton() {
  return (
    <button onClick={() => redirectToLogin('https://your-server.com/api/auth/login')}>
      Sign In
    </button>
  );
}
```

#### redirectToLogout()

The `redirectToLogout` function redirects the user to your backend server's Logout Endpoint:

```typescript
import { redirectToLogout } from '@wristband/react-client-auth';

function LogoutButton() {
  return (
    <button onClick={() => redirectToLogout('https://your-server.com/api/auth/logout')}>
      Sign Out
    </button>
  );
}
```

#### Handling 401 Errors

These utilities are particularly useful for handling authentication errors in your API requests:

```typescript
import { redirectToLogin } from '@wristband/react-client-auth';
import axios from 'axios';

export function ExampleApiComponent() {
  const executeServerApiCall = async () => {
    try {
      const response = await axios.get('<your-server-resource-api>');
      alert(response);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        redirectToLogin('https://your-server.com/api/auth/login');
      } else {
        alert(error);
      }
    }
  }

  return (
    <button onClick={executeServerApiCall}>
      Get Resource
    </button>
  );
}
```

## Transforming Session Metadata

The `transformSessionMetadata` prop on the `WristbandAuthProvider` provides a flexible way to reshape the raw session metadata returned from your backend server into a more convenient format for your frontend application.

For example, let's say your backend server's Session Endpoint returns this response format to your React frontend:

```json
{
  "userId": "123",
  "tenantId": "456",
  "metadata": {
    "user_name": "john.doe",
    "email_address": "john.doe@example.com",
    "feature_flags": {
      "beta_features": true,
      "experimental_ui": false
    }
  }
}
```

You can transform it to a more convenient structure:

```typescript
import { WristbandAuthProvider } from '@wristband/react-client-auth';

interface RawMetadata {
  user_name: string;
  email_address: string;
  feature_flags?: {
    beta_features?: boolean;
    experimental_ui?: boolean;
  };
}

interface UserMetadata {
  displayName: string;
  email: string;
  features: {
    hasBetaAccess: boolean;
    useExperimentalUI: boolean;
  };
}

function App() {
  return (
    <WristbandAuthProvider<UserMetadata>
      loginUrl="/api/auth/login"
      sessionUrl="/api/auth/session"
      transformSessionMetadata={(rawMetadata: unknown): UserMetadata => {
        const metadata = rawMetadata as RawMetadata;
        return {
          displayName: metadata.user_name,
          email: metadata.email_address,
          features: {
            hasBetaAccess: metadata.feature_flags?.beta_features || false,
            useExperimentalUI: metadata.feature_flags?.experimental_ui || false
          },
        };
      }}
    >
      <YourAppComponents />
    </WristbandAuthProvider>
  );
}
```

The transformation happens once when the session data is received, making your components cleaner and more focused on presentation rather than data manipulation. Now in your components, you can easily use the transformed data:

```typescript
import { useWristbandSession } from '@wristband/react-client-auth';

function UserDashboard() {
  const { metadata } = useWristbandSession<UserMetadata>();
  
  return (
    <div className="dashboard">
      <header>
        <h1>Welcome, {metadata.displayName}</h1>
      </header>
      
      {metadata.features.hasBetaAccess && (
        <div className="beta-section">
          <h2>Beta Features</h2>
          <p>You have access to our beta features!</p>
        </div>
      )}
      
      {metadata.features.useExperimentalUI ? (
        <ExperimentalDashboard email={metadata.email} />
      ) : (
        <StandardDashboard email={metadata.email} />
      )}
    </div>
  );
}
```

## Executing Custom Logic After Session Initialization

The `onSessionSuccess` property on `WristbandAuthProvider` allows you to execute custom initialization logic when a user's session is successfully retrieved from your server's Session Endpoint. The function is executed after session data is fetched but before the Provider's internal state is updated, making it the perfect place for initialization logic that depends on the user's identity. This is useful for post-authentication tasks including data prefetching, service configuration, global state initialization, and more.

```typescript
import { WristbandAuthProvider, SessionResponse } from '@wristband/react-client-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WristbandAuthProvider
        loginUrl="/api/auth/login"
        sessionUrl="/api/v1/session"
        onSessionSuccess={(sessionResponse: SessionResponse) => {
          const { metadata, tenantId, userId } = sessionResponse;

          const { companyConfigs } = metadata;
          queryClient.setQueryData(['company-configs'], companyConfigs);

          initializeAnalytics({ userId, tenantId });
        }}
      >
        <App />
      </WristbandAuthProvider>
    </QueryClientProvider>
  );
}
```

<br/>

## API Reference

### `<WristbandAuthProvider<TSessionMetadata>>`

```typescript
import React from 'react';
import { SessionResponse, WristbandAuthProvider } from '@wristband/react-client-auth';

interface UserMetadata {
  name: string;
  email: string;
  isAdmin: boolean;
}

const loadTenantConfig = (id: string) => console.log(`Loading config for tenant ${id}`);

export default function App() {
  return (
    <WristbandAuthProvider<UserMetadata>
      loginUrl="/api/auth/login"
      sessionUrl="/api/auth/session"
      csrfCookieName="CSRF_TOKEN"
      csrfHeaderName="X-CSRF-TOKEN"
      disableRedirectOnUnauthenticated={false}
      transformSessionMetadata={(rawMetadata: unknown): UserMetadata => ({
        name: rawMetadata.display_name || 'User',
        email: rawMetadata.email_address,
        isAdmin: rawMetadata.roles?.includes('admin') || false
      })}
      onSessionSuccess={(session: SessionResponse) => {
        console.log(`User ${session.userId} authenticated`);
        loadTenantConfig(session.tenantId);
      }}
    >
      <div>Your application here</div>
    </WristbandAuthProvider>
  );
}
```

| Property | Type | Required? | Description |
| -------- | ---- | --------- | ----------- |
| csrfCookieName | string | No | Name of the CSRF cookie that the server sets. This enables CSRF protection for the request made to your Session Endpoint.<br><br> Default: `CSRF-TOKEN` |
| csrfHeaderName | string | No | Name of the CSRF header that will be sent with authenticated requests to your Session Endpoint. This should match the header name your server expects for CSRF validation.<br><br> Default: `X-CSRF-TOKEN` |
| disableRedirectOnUnauthenticated | boolean | No | When `true`, unauthenticated users will remain on the current page instead of being redirected to your backend server's Login or Logout Endpoints. This is useful for public pages that have both authenticated and unauthenticated states.<br><br> Default: `false` |
| loginUrl | string | Yes | The URL of your backend server's Login Endpoint that handles the authentication flow with Wristband. |
| onSessionSuccess | `(sessionResponse: SessionResponse) => Promise<void> \| void` | No | Function that executes after a successful session response but before authentication state updates. If this function returns a Promise, the authentication state update will be delayed until the Promise resolves. This is useful for post-authentication tasks including data prefetching, service configuration, global state initialization, and more. |
| sessionUrl | string | Yes | The URL of your server's Session Endpoint, which returns an authenticated user's userId, tenantId, and any optional metadata. |
| transformSessionMetadata | `(rawSessionMetadata: unknown) => TSessionMetadata` | No | Function to transform raw metadata from the session response before storing it in context. Useful for converting data types, adding computed properties, filtering unnecessary properties, and ensuring type safety. |

<br/>

### Hooks

#### `useWristbandAuth()`

```typescript
import { useWristbandAuth } from '@wristband/react-client-auth';

function AuthHook() {
  const { authError, authStatus, clearAuthData, isAuthenticated, isLoading } = useWristbandAuth();
  
  return (
    <div>
      <p>authStatus: {authStatus}</p>
      <p>authError: {authError ? authError.message : 'None'}</p>
      <p>isAuthenticated: {isAuthenticated}</p>
      <p>isLoading: {isLoading}</p>
      <button onClick={() => clearAuthData()}>
        Clear Auth Data
      </button>
    </div>
  );
}
```

| Field | Type | Description |
| ----- | ---- | ----------- |
| authError | `WristbandError` or `null` | An error object details when session fetching or authentication fails. Provides error codes and messages for debugging. Only populated when `disableRedirectOnUnauthenticated` is true; otherwise, users are redirected to login on errors. If no error is encountered, then the value is `null`. |
| authStatus | `AuthStatus` (enum) | Represents the current authentication status.<br><br> Possible values: `LOADING`, `AUTHENTICATED`, or `UNAUTHENTICATED`. |
| clearAuthData | `() => void` | This function clears all client-side auth state including authentication status, user data, session metadata, cached tokens, and errors. |
| isAuthenticated | boolean | A boolean indicator that is `true` when the user is authenticated and `false` otherwise. |
| isLoading | boolean | A boolean indicator that is `true` when the authentication status is still being determined (e.g., during the initial session check) and `false` once the status is determined. |

In the event an `authError` occurs, the `WristbandError` can have any of the following error codes:

| Wristband Error Code | Description |
| -------------------- | ----------- |
| `INVALID_LOGIN_URL` | An invalid login URL value was provided to the SDK. |
| `INVALID_LOGOUT_URL` | An invalid logout URL value was provided to the SDK (primarily for `redirectToLogout()`). |
| `INVALID_SESSION_RESPONSE` | The session endpoint response is missing required fields. |
| `INVALID_SESSION_URL` | An invalid session URL value was provided to the SDK. |
| `INVALID_TOKEN_RESPONSE` | The token endpoint response is missing required fields. |
| `INVALID_TOKEN_URL` | An invalid token URL value was provided to the SDK (only occurs if using `getToken()`). |
| `SESSION_FETCH_FAILED` | The session endpoint returned an error other than 401. |
| `TOKEN_FETCH_FAILED` | The token endpoint returned an error other than 401. |
| `UNAUTHENTICATED` | The user is not authenticated and cannot request a session or token (typicaly from a 401 error). |

<br/>

#### `useWristbandSession<TSessionMetadata>()`

```typescript
import { useWristbandSession } from '@wristband/react-client-auth';

type UserMetadata = {
  name: string;
  email: string;
};

function SessionHook() {
  const { userId, tenantId, metadata, updateMetadata } = useWristbandSession<UserMetadata>();
  
  return (
    <div>
      <p>userId: {userId}</p>
      <p>tenantId: {tenantId}</p>
      <p>name: {metadata.name}</p>
      <p>email: {metadata.email}</p>
      <button onClick={() => updateMetadata({ name: 'New Name' })}>
        Update Name
      </button>
    </div>
  );
}
```

| Field | Type | Description |
| ----- | ---- | ----------- |
| metadata | `TSessionMetadata` | Optional custom user metadata with type safety. You can define this type by providing a generic type parameter to both the provider (`<WristbandAuthProvider<YourType>>`) and this hook (`useWristbandSession<YourType>()`). When used with the `transformSessionMetadata()` function, the metadata will conform to the type you've specified.<br><br> Default type: `unknown` |
| tenantId | string | The identifier for the tenant the user belongs to. |
| updateMetadata | `(newMetadata: Partial<TSessionMetadata>) => void` | A function that lets you update the metadata object with type-safe partial updates. The type parameter you provide to the hook ensures that any updates you make are compatible with your defined metadata structure. This only updates the client-side state and does not persist changes to the server. |
| userId | string | The unique identifier for the authenticated user. |

<br/>

#### `useWristbandToken()`

```typescript
import { useWristbandToken } from '@wristband/react-client-auth';

function TokenHook() {
  const { clearToken, getToken } = useWristbandToken();
  
  return (
    <div>
      <button onClick={() => getToken()}>
        Get Token
      </button>
      <button onClick={() => clearToken()}>
        Clear Token
      </button>
    </div>
  );
}
```

| Field | Type | Description |
| ----- | ---- | ----------- |
| clearToken | `() => void` | Clears the cached access token and forces the next getToken() call to fetch a fresh token, assuming that the user still has a valid session cookie. |
| getToken | `() => void` | Retrieves a valid access token for making authenticated API calls to resource servers. Returns a cached token if available and not expired; otherwise fetches a fresh token from the configured "tokenUrl" endpoint. Your server's Token Endpoint should automatically handle token expiration and refresh using the user's session cookie. |

<br/>

### Utility Functions

#### `redirectToLogin(loginUrl: string, config?: LoginRedirectConfig): void`

```typescript
import { redirectToLogin } from '@wristband/react-client-auth';

function handleLogin() {
  redirectToLogin('https://your-server.com/api/auth/login', {
    loginHint: 'user@company.com',
    returnUrl: window.location.href,
    tenantDomain: 'acme-corp',
    tenantCustomDomain: 'auth.acme.com'
  });
}
```

| Login Redirect Config | Type | Required? | Description |
| --------------------- | ---- | --------- | ----------- |
| loginHint | string | No | Pre-fills the Tenant Login Page form with a specific username or email. Sent as the `login_hint` query parameter to your Login Endpoint. |
| returnUrl | string | No | URL to redirect back to after successful authentication. Sent as the `return_url` query parameter to your Login Endpoint. |
| tenantCustomDomain | string | No | Tenant custom domain for routing to the correct Tenant Login Page. Sent as the `tenant_custom_domain` query parameter to your Login Endpoint. |
| tenantDomain | string | No | Tenant domain name for routing to the correct Tenant Login Page. Sent as the `tenant_domain` query parameter to your Login Endpoint. |

<br/>

#### `redirectToLogout(logoutUrl: string, config?: LogoutRedirectConfig): void`

```typescript
import { redirectToLogout } from '@wristband/react-client-auth';

function handleLogout() {
  redirectToLogout('https://your-server.com/api/auth/logout', {
    tenantDomain: 'acme-corp',
    tenantCustomDomain: 'auth.acme.com'
  });
}
```

| Logout Redirect Config | Type | Required? | Description |
| ---------------------- | ---- | --------- | ----------- |
| tenantCustomDomain | string | No | Tenant custom domain for routing to the correct Tenant Login Page after logout. Sent as the `tenant_custom_domain` query parameter to your Logout Endpoint. |
| tenantDomain | string | No | Tenant domain name for routing to the correct Tenant Login Page after logout. Sent as the `tenant_domain` query parameter to your Logout Endpoint. |

<br/>

## Questions

Reach out to the Wristband team at <support@wristband.dev> for any questions regarding this SDK.

<br/>
