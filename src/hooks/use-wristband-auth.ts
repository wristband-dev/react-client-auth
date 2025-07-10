import { useContext } from 'react';

import { WristbandAuthContext } from '../context/wristband-auth-context';
import { IWristbandAuthContext } from '../types/auth-provider-types';

export function useWristbandAuth(): Pick<
  IWristbandAuthContext,
  'isAuthenticated' | 'isLoading' | 'authStatus' | 'clearAuthData'
> {
  const context = useContext(WristbandAuthContext);

  if (context === undefined) {
    throw new Error('useWristbandAuth() must be used within a WristbandAuthProvider.');
  }

  return {
    clearAuthData: context.clearAuthData,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    authStatus: context.authStatus,
  };
}
