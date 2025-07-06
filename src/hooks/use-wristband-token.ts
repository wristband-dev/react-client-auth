import { useContext } from 'react';

import { WristbandAuthContext } from '../context/wristband-auth-context';
import { IWristbandAuthContext } from '../types/auth-provider-types';

export function useWristbandToken(): Pick<IWristbandAuthContext, 'getToken' | 'clearToken'> {
  const context = useContext(WristbandAuthContext);

  if (context === undefined) {
    throw new Error('useWristbandToken() must be used within a WristbandAuthProvider.');
  }

  return { clearToken: context.clearToken, getToken: context.getToken };
}
