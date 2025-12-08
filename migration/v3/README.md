<div align="center">
  <a href="https://wristband.dev">
    <picture>
      <img src="https://assets.wristband.dev/images/email_branding_logo_v1.png" alt="Github" width="297" height="64">
    </picture>
  </a>
  <p align="center">
    Migration instruction from version v2.x to version v3.x
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

# Migration instruction from version v2.x to version v3.x

## Table of Contents

- [Tenant Domain Property Rename](#tenant-domain-property-rename)
- [Type Changes: Enums to String Literal Unions](#type-changes-enums-to-string-literal-unions)

<br>

## Tenant Domain Property Rename

The `tenantDomain` configuration property has been renamed to `tenantName` in the `redirectToLogin()` and `redirectToLogout()` utility functions as part of a broader standardization across the Wristband platform. This change improves clarity by better reflecting what the value actually represents—a tenant's unique name identifier (e.g., `acme-corp`), not a full domain (e.g., `acme.com`).

Additionally, the query parameter sent to your backend server's Login and Logout Endpoints has changed from `tenant_domain` to `tenant_name`.

> **⚠️ Important:**
>
> Before upgrading to v3.x and using these utility functions, ensure your backend SDK supports the `tenantName` property in your Login and Logout Endpoint configurations. If your backend SDK does not yet support this naming convention, you have two options:
> 
> 1. **Upgrade your backend SDK first** to support the new `tenantName` convention (if possible)
> 2. **Use a backwards-compatible approach** by passing `tenant_domain` as a query parameter directly in the URL until your backend is upgraded

**Before (v2.x):**
```typescript
import { redirectToLogin, redirectToLogout } from '@wristband/react-client-auth';

// Login with tenant domain
function handleLogin() {
  redirectToLogin('https://your-server.com/api/auth/login', {
    loginHint: 'user@company.com',
    returnUrl: window.location.href,
    tenantDomain: 'acme-corp',  // Old property name
    tenantCustomDomain: 'auth.acme.com'
  });
}

// Logout with tenant domain
function handleLogout() {
  redirectToLogout('https://your-server.com/api/auth/logout', {
    tenantDomain: 'acme-corp',  // Old property name
    tenantCustomDomain: 'auth.acme.com'
  });
}
```

**After (v3.x):**
```typescript
import { redirectToLogin, redirectToLogout } from '@wristband/react-client-auth';

// Login with tenant name
function handleLogin() {
  redirectToLogin('https://your-server.com/api/auth/login', {
    loginHint: 'user@company.com',
    returnUrl: window.location.href,
    tenantName: 'acme-corp',  // New property name
    tenantCustomDomain: 'auth.acme.com'
  });
}

// Logout with tenant name
function handleLogout() {
  redirectToLogout('https://your-server.com/api/auth/logout', {
    tenantName: 'acme-corp',  // New property name
    tenantCustomDomain: 'auth.acme.com'
  });
}
```

### Backend Query Parameter Changes

If your backend server's Login and Logout Endpoints read the `tenant_domain` query parameter, you'll need to update them to read `tenant_name` instead.

**Before (v2.x):**
```typescript
// Backend Login Endpoint
const tenantDomain = request.query.tenant_domain;  // Old query param
```

**After (v3.x):**
```typescript
// Backend Login Endpoint
const tenantName = request.query.tenant_name;  // New query param
```

**Backwards Compatible Approach (if backend doesn't support `tenantName` yet):**

If your backend SDK doesn't yet support `tenantName`, you can pass `tenant_domain` directly in the URL as a query parameter:

```typescript
import { redirectToLogin, redirectToLogout } from '@wristband/react-client-auth';

// Login with tenant_domain in URL (backwards compatible)
function handleLogin() {
  redirectToLogin('https://your-server.com/api/auth/login?tenant_domain=acme-corp', {
    tenantName: 'acme-corp',
  });
}

// Logout with tenant_domain in URL (backwards compatible)
function handleLogout() {
  redirectToLogout('https://your-server.com/api/auth/logout?tenant_domain=acme-corp', {
    tenantName: 'acme-corp',
  });
}
```

This allows you to upgrade the React SDK to v3.x while your backend remains on an older version. Once your backend is upgraded to support `tenantName`, migrate to using the config-based approach shown above.

<br>

---

<br>

## Type Changes: Enums to String Literal Unions

Version 3.x converts `AuthStatus` and `WristbandErrorCode` from TypeScript enums to string literal union types. This change follows modern TypeScript best practices and provides better tree-shaking, zero runtime overhead, and simpler usage while still retaining IDE autocomplete and type checking.

### AuthStatus

**Before (v2.x):**
```typescript
import { AuthStatus, useWristbandAuth } from '@wristband/react-client-auth';

function MyComponent() {
  const { authStatus } = useWristbandAuth();
  
  if (authStatus === AuthStatus.LOADING) {
    return <Spinner />;
  }
  
  if (authStatus === AuthStatus.AUTHENTICATED) {
    return <Dashboard />;
  }
  
  return <LoginPrompt />;
}
```

**After (v3.x):**
```typescript
import { useWristbandAuth } from '@wristband/react-client-auth';

function MyComponent() {
  const { authStatus } = useWristbandAuth();
  
  if (authStatus === 'LOADING') {
    return <Spinner />;
  }
  
  if (authStatus === 'AUTHENTICATED') {
    return <Dashboard />;
  }
  
  return <LoginPrompt />;
}
```

**Key Changes:**
- Replace `AuthStatus.LOADING` with `'LOADING'`
- Replace `AuthStatus.AUTHENTICATED` with `'AUTHENTICATED'`
- Replace `AuthStatus.UNAUTHENTICATED` with `'UNAUTHENTICATED'`
- You no longer need to import `AuthStatus` unless you're using it for type annotations

**Type Annotations (optional):**
```typescript
import { AuthStatus } from '@wristband/react-client-auth';

const status: AuthStatus = 'LOADING';  // Still works for type safety
```

### WristbandErrorCode

**Before (v2.x):**
```typescript
import { WristbandErrorCode, useWristbandAuth } from '@wristband/react-client-auth';

function MyComponent() {
  const { authError } = useWristbandAuth();
  
  if (authError?.code === WristbandErrorCode.UNAUTHENTICATED) {
    // Handle unauthenticated error
  }
}
```

**After (v3.x):**
```typescript
import { useWristbandAuth } from '@wristband/react-client-auth';

function MyComponent() {
  const { authError } = useWristbandAuth();
  
  if (authError?.code === 'UNAUTHENTICATED') {
    // Handle unauthenticated error
  }
}
```

**Key Changes:**
- Use string literals directly: `'INVALID_LOGIN_URL'`, `'INVALID_LOGOUT_URL'`, `'INVALID_SESSION_RESPONSE'`, `'INVALID_SESSION_URL'`, `'INVALID_TOKEN_RESPONSE'`, `'INVALID_TOKEN_URL'`, `'SESSION_FETCH_FAILED'`, `'TOKEN_FETCH_FAILED'`, `'UNAUTHENTICATED'`
- You no longer need to import `WristbandErrorCode` unless you're using it for type annotations

**Type Annotations (optional):**
```typescript
import { WristbandErrorCode } from '@wristband/react-client-auth';

const errorCode: WristbandErrorCode = 'UNAUTHENTICATED';  // Still works for type safety
```

<br>

---

<br>

## Questions

Reach out to the Wristband team at <support@wristband.dev> for any questions around migration.

<br/>
