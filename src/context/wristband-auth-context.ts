import { createContext } from 'react';

import { IWristbandAuthContext } from '../types/auth-provider-types';

// React context responsbile for establishing that the user is authenticated and getting session data.
export const WristbandAuthContext = createContext<IWristbandAuthContext | undefined>(undefined);
