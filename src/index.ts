// Export provider
export { WristbandAuthProvider } from './context/wristband-auth-provider';

// Export hooks
export { useWristbandAuth } from './hooks/use-wristband-auth';
export { useWristbandSession } from './hooks/use-wristband-session';
export { useWristbandToken } from './hooks/use-wristband-token';

// Export types
export { AuthStatus, WristbandErrorCode } from './types/auth-provider-types';
export type { SessionResponse } from './types/auth-provider-types';
export type { LoginRedirectConfig, LogoutRedirectConfig } from './types/util-types';

// Export errors
export { WristbandError } from './error';

// Export utils
export { redirectToLogin, redirectToLogout } from './utils/auth-utils';
