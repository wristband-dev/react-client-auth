<div align="center">
  <a href="https://wristband.dev">
    <picture>
      <img src="https://assets.wristband.dev/images/email_branding_logo_v1.png" alt="Github" width="297" height="64">
    </picture>
  </a>
  <p align="center">
    Migration instruction from version v1 to version v2
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

# Wristband React Client Auth SDK - Migration instructions from version v1.x to version v2.x

> [!NOTE]
> Important: This release version contains some breaking changes.

<br/>

## 1. Removed logoutUrl Property
The `logoutUrl` configuration property has been removed from the `WristbandAuthProvider` component. When `disableRedirectOnUnauthenticated` is set to false, this property caused the SDK to redirect users to the Logout Endpoint for non-auth errors like network failures or server configuration issues. The SDK now only redirects to the Login Endpoint for all failures. For intentional logout, continue using the `redirectToLogout()` utility function.

**Migration**:
Remove the `logoutUrl` property from your `WristbandAuthProvider`. 

Before (v1):
```typescript
<WristbandAuthProvider
  loginUrl="/api/auth/login"
  sessionUrl="/api/auth/session"
  logoutUrl="/api/auth/logout" // ❌ This property is removed
>
  {children}
</WristbandAuthProvider>
```

After (v2):
```typescript
<WristbandAuthProvider
  loginUrl="/api/auth/login"
  sessionUrl="/api/auth/session"
  // ✅ logoutUrl property removed
>
  {children}
</WristbandAuthProvider>
```

<br/>

## 2. Error Handling Improvements

Version 2.x introduces enhanced error handling through the new `authError` property in the `useWristbandAuth()` hook. The `authError` provides detailed error information with specific error codes whenever an error occurs:

- **`INVALID_LOGIN_URL`:** An invalid login URL value was provided to the SDK.
- **`INVALID_LOGOUT_URL`:** An invalid logout URL value was provided to the SDK (primarily for `redirectToLogout()`).
- **`INVALID_SESSION_RESPONSE`:** The session endpoint response is missing required fields.
- **`INVALID_SESSION_URL`:** An invalid session URL value was provided to the SDK.
- **`INVALID_TOKEN_RESPONSE`:** The token endpoint response is missing required fields.
- **`INVALID_TOKEN_URL`:** An invalid token URL value was provided to the SDK (only occurs if using `getToken()`).
- **`SESSION_FETCH_FAILED`:** The session endpoint returned an error other than 401.
- **`TOKEN_FETCH_FAILED`:** The token endpoint returned an error other than 401.
- **`UNAUTHENTICATED`:** The user is not authenticated and cannot request a session or token (typicaly from a 401 error).

The value changes based on the following:
- **When `disableRedirectOnUnauthenticated={false}` (default):** All authentication errors cause an immediate redirect to your `loginUrl`. The `authError` will be `null` because the user gets redirected before the error can be exposed.
- **When `disableRedirectOnUnauthenticated={true}`:** Authentication errors are exposed through the `authError` property instead of causing redirects. This allows you to take control of error handling directly.

**Migration**:
If desired, you can update your components to handle the new `authError` property explicitly when `disableRedirectOnUnauthenticated={true}`.

New in v2:
```typescript
import { useWristbandAuth } from '@wristband/react-client-auth';

function MyComponent() {
  const { authError, isAuthenticated, isLoading } = useWristbandAuth();

  // ✅ New: Handle authentication errors
  if (authError) {
    return (
      <div>
        <h3>Authentication Error</h3>
        <p>Code: {authError.code}</p>
        <p>Message: {authError.message}</p>
      </div>
    );
  }

  // ... rest of your component
}
```

<br>

## 3. Unified Error System

All SDK errors now use a unified `WristbandError` class. This simplifies error handling across the SDK.

New in v2:
```typescript
import { useWristbandToken, WristbandError } from '@wristband/react-client-auth';

function MyComponent() {
  const { clearToken, getToken } = useWristbandToken();

  const callApi = async () => {
    try {
      const token = await getToken();
      // your API logic...
    } catch (error) {
      // Single unified error type
      if (error instanceof WristbandError) {
        switch (error.code) {
          case 'UNAUTHENTICATED':
            // Handle error...
            break;
          case 'TOKEN_FETCH_FAILED':
            // Handle error...
            break;
          // ... other cases
        }
        clearToken();
      }
    }
  };

  // ... rest of your component
}
```

<br>

## Questions

Reach out to the Wristband team at <support@wristband.dev> for any questions around migration.

<br/>
