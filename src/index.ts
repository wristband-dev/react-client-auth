// Export provider
export { WristbandAuthProvider } from './context/wristband-auth-provider';

// Export hooks
export { useWristbandAuth } from './hooks/use-wristband-auth';
export { useWristbandSession } from './hooks/use-wristband-session';

// Export types
export { AuthStatus } from './types/types';
export type { LoginRedirectConfig, LogoutRedirectConfig, SessionResponse } from './types/types';

// Export utils
export { redirectToLogin, redirectToLogout } from './utils/auth';
