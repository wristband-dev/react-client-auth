import { useContext } from 'react';

import { WristbandAuthContext } from '../context/wristband-auth-context';

export function useWristbandSession<TSessionData = unknown>(): {
  metadata: TSessionData;
  tenantId: string;
  userId: string;
  updateMetadata: (newMetadata: Partial<TSessionData>) => void;
} {
  const context = useContext(WristbandAuthContext);

  if (context === undefined) {
    throw new Error('useWristbandSession() must be used within a WristbandAuthProvider.');
  }

  return {
    metadata: context.metadata as TSessionData,
    tenantId: context.tenantId,
    userId: context.userId,
    updateMetadata: (newMetadata: Partial<TSessionData>) => {
      context.updateMetadata(newMetadata as Partial<TSessionData>);
    },
  };
}
