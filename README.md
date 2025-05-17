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

The SDK handles authentication interactions in your app’s React frontend. It’s designed to work in tandem with your backend server that integrates with Wristband using the Backend Server Integration Pattern. The backend exposes a Session Endpoint that the React SDK calls to initialize the app in the browser with an authenticated user session.

---

## Migrating From Older SDK Versions

On an older version of our SDK? Check out our migration guide:

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
> Important: Before using this SDK, you must have already implemented the required backend server endpoints for authentication (Login, Logout, and Session) in your server. This SDK connects to those existing endpoints but does not implement them for you.

### 1) Use the Wristband Auth Provider

The `WristbandAuthProvider` establishes and manages authentication state throughout your application. This component fetches the user's session data from your backend server and makes it available via React Context.

The provider requires three URL endpoints:
- `loginUrl`: The URL of your backend server's Login Endpoint that initiates the authentication process.
- `logoutUrl`: The URL of your backend server's Logout Endpoint that handles session termination.
- `sessionUrl`: The URL of your backend server's Session Endpoint that returns the current user's session data.

Place the `WristbandAuthProvider` at your app's root to ensure the user's authenticated state is available throughout your application and verified on initial load.

```typescript
import { WristbandAuthProvider } from '@wristband/react-client-auth';

function App() {
  return (
    <WristbandAuthProvider
      loginUrl="https://your-server.com/api/auth/login"
      logoutUrl="https://your-server.com/api/auth/logout"
      sessionUrl="https://your-server.com/api/auth/session"
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
      logoutUrl='/api/auth/logout'
      sessionUrl='/api/session'
    >
      <App />
    </WristbandAuthProvider>
  );
}
```

### 2) Use Auth and Session Hooks

The SDK provides two hooks for accessing authentication data:

#### useWristbandAuth()

This hook provides authentication status information:

- `isAuthenticated`: Boolean indicating if the user has an authenticated session.
- `isLoading`: Boolean indicating if the authentication status is still being determined.
- `authStatus`: Enum value for convenience (`LOADING`, `AUTHENTICATED`, or `UNAUTHENTICATED`).

Use this hook when you need to control access to protected content by checking authentication status.  This enables common patterns like conditional rendering of authenticated/unauthenticated views, route protection, or dynamic UI updates based on the user's auth status.

```typescript
import { useWristbandAuth } from '@wristband/react-client-auth';

function AuthStatus() {
  const { isAuthenticated, isLoading, authStatus } = useWristbandAuth();
  
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
    </div>
  );
}
```

#### useWristbandSession()

This hook provides access to the authenticated user's session data:

- `userId`: The authenticated user's ID.
- `tenantId`: The ID of the tenant that the authenticated user belongs to.
- `metadata`: Opional custom session metadata provided by your backend, if applicable (profile info, roles, etc.)
- `updateMetadata`: Function to modify the metadata object stored in the client-side React Context. This enables real-time UI updates with new metadata values, but it is limited to the current browser session only. Any changes made with this function will not persist across page refreshes or be synchronized to your backend server.

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

### 3) Use Auth Utility Functions

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
      logoutUrl="/api/auth/logout"
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
        logoutUrl="/api/auth/logout"
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
      logoutUrl="/api/auth/logout"
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
| logoutUrl | string | Yes | The URL of your backend server's Logout Endpoint that handles terminating the user's session in your application and redirecting to Wristband's Logout Endpoint. |
| onSessionSuccess | `(sessionResponse: SessionResponse) => Promise<void> \| void` | No | Function that executes after a successful session response but before authentication state updates. If this function returns a Promise, the authentication state update will be delayed until the Promise resolves. This is useful for post-authentication tasks including data prefetching, service configuration, global state initialization, and more. |
| sessionUrl | string | Yes | The URL of your server's Session Endpoint, which returns an authenticated user's userId, tenantId, and any optional metadata. |
| transformSessionMetadata | `(rawSessionMetadata: unknown) => TSessionMetadata` | No | Function to transform raw metadata from the session response before storing it in context. Useful for converting data types, adding computed properties, filtering unnecessary properties, and ensuring type safety. |

<br/>

### Hooks

#### `useWristbandAuth()`

```typescript
import { useWristbandAuth } from '@wristband/react-client-auth';

function AuthHook() {
  const { authStatus, isAuthenticated, isLoading } = useWristbandAuth();
  
  return (
    <div>
      <p>authStatus: {authStatus}</p>
      <p>isAuthenticated: {isAuthenticated}</p>
      <p>isLoading: {isLoading}</p>
    </div>
  );
}
```

| Field | Type | Description |
| ----- | ---- | ----------- |
| authStatus | `AuthStatus` (enum) | Represents the current authentication status.<br><br> Possible values: `LOADING`, `AUTHENTICATED`, or `UNAUTHENTICATED`. |
| isAuthenticated | boolean | A boolean indicator that is `true` when the user is authenticated and `false` otherwise.
| isLoading | boolean | A boolean indicator that is `true` when the authentication status is still being determined (e.g., during the initial session check) and `false` once the status is determined. |

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
