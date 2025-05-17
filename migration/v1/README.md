<div align="center">
  <a href="https://wristband.dev">
    <picture>
      <img src="https://assets.wristband.dev/images/email_branding_logo_v1.png" alt="Github" width="297" height="64">
    </picture>
  </a>
  <p align="center">
    Migration instruction from version v0 to version v1
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

# Migration instruction from version v0 to version v1

<br/>

## Default CSRF Property Values

When initializing the `WristbandAuthProvider` component, the `csrfCookieName` and `csrfHeaderName` properties had their default values changed to the following:

| SDK Property Name | Old Default Value | New Default Value |
| ----------------- | ----------------- | ----------------- |
| csrfCookieName | `XSRF-TOKEN` | **`CSRF-TOKEN`** |
| csrfHeaderName | `X-XSRF-TOKEN` | **`X-CSRF-TOKEN`** |

You can still define custom values for each property (if needed) when initializing the SDK:

```typescript
import React from 'react';
import { WristbandAuthProvider } from '@wristband/react-client-auth';

export function MyComponent({ children }) {
  return (
    <WristbandAuthProvider
      csrfCookieName="custom-csrf-cookie-name"
      csrfHeaderName="custom-csrf-header-name"
      // ...other props...
    >
      {children}
    </WristbandAuthProvider>
  );
}
```

<br>

## Questions

Reach out to the Wristband team at <support@wristband.dev> for any questions around migration.

<br/>
