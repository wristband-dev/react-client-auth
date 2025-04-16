import React, { useContext } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WristbandAuthContext } from './wristband-auth-context';
import { AuthStatus } from '../types/types';

describe('WristbandAuthContext', () => {
  it('provides context values to consuming components', () => {
    // Mock context values
    const contextValue = {
      isAuthenticated: true,
      isLoading: false,
      authStatus: AuthStatus.AUTHENTICATED,
      userId: 'test-user-id',
      tenantId: 'test-tenant-id',
      metadata: { role: 'admin' },
      updateMetadata: vi.fn()
    };
    
    // Test consumer component
    const TestConsumer = () => {
      const context = useContext(WristbandAuthContext);
      return (
        <div>
          <div data-testid="auth-status">{context?.authStatus}</div>
          <div data-testid="is-authenticated">{String(context?.isAuthenticated)}</div>
        </div>
      );
    };
    
    // Render with Provider
    render(
      <WristbandAuthContext.Provider value={contextValue}>
        <TestConsumer />
      </WristbandAuthContext.Provider>
    );
    
    // Assert context values are correctly consumed
    expect(screen.getByTestId('auth-status').textContent).toBe(AuthStatus.AUTHENTICATED.toString());
    expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
  });
  
  it('returns undefined when used outside Provider', () => {
    // Test consumer without Provider
    const TestConsumer = () => {
      const context = useContext(WristbandAuthContext);
      return (
        <div>
          <div data-testid="context-value">{context === undefined ? 'undefined' : 'defined'}</div>
        </div>
      );
    };
    
    // Render without Provider
    render(<TestConsumer />);
    
    // Assert context is undefined
    expect(screen.getByTestId('context-value').textContent).toBe('undefined');
  });
});
