import { useContext } from 'react';

import { WristbandAuthContext } from '../context/wristband-auth-context';
import { IWristbandAuthContext } from '../types/auth-provider-types';

export function useWristbandAuth(): Pick<IWristbandAuthContext, 'isAuthenticated' | 'isLoading' | 'authStatus'> {
  const context = useContext(WristbandAuthContext);

  if (context === undefined) {
    throw new Error('useWristbandAuth() must be used within a WristbandAuthProvider.');
  }

  return {
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    authStatus: context.authStatus,
  };
}
