import { useContext } from 'react';

import { IWristbandAuthContext } from '../types/types';
import { WristbandAuthContext } from '../context/wristband-auth-context';

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
