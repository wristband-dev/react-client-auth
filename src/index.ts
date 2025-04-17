// Export provider
export { WristbandAuthProvider } from './context/wristband-auth-provider';

// Export hooks
export { useWristbandAuth } from './hooks/use-wristband-auth';
export { useWristbandSession } from './hooks/use-wristband-session';

// Export types
export { AuthStatus } from './types/auth-provider-types';
export type { SessionResponse } from './types/auth-provider-types';
export type { LoginRedirectConfig, LogoutRedirectConfig } from './types/util-types';

// Export utils
export { redirectToLogin, redirectToLogout } from './utils/auth-utils';
