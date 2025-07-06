import React, { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';

import { useWristbandSession } from '../../src/hooks/use-wristband-session';
import { WristbandAuthContext } from '../../src/context/wristband-auth-context';
import { AuthStatus, IWristbandAuthContext } from '../../src/types/auth-provider-types';

// Type definition for a strongly-typed session example
interface UserSessionData {
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
}

describe('useWristbandSession', () => {
  // Reset any mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return session data from context', () => {
    // Create mock context with session data
    const updateMetadataMock = vi.fn();
    const contextValue: IWristbandAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      authStatus: AuthStatus.AUTHENTICATED,
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: {
        firstName: 'John',
        lastName: 'Doe',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
      },
      updateMetadata: updateMetadataMock,
      clearAuthData: () => {},
      clearToken: () => {},
      getToken: () => Promise.resolve(''),
    };

    // Use the context provider directly to verify it's being used
    const TestProvider = WristbandAuthContext.Provider;

    // Create a wrapper that provides the mock context
    const wrapper = ({ children }: { children: ReactNode }) => (
      <TestProvider value={contextValue}>{children}</TestProvider>
    );

    // Use the hook with the provided context and specify the metadata type
    const { result } = renderHook(() => useWristbandSession<UserSessionData>(), { wrapper });

    // The hook should return the session data
    expect(result.current).toEqual({
      metadata: {
        firstName: 'John',
        lastName: 'Doe',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
      },
      tenantId: 'tenant-456',
      userId: 'user-123',
      updateMetadata: expect.any(Function),
    });
  });

  it('should throw error when used outside of WristbandAuthProvider', () => {
    // Verify WristbandAuthContext exists
    expect(WristbandAuthContext).toBeDefined();

    // Attempt to use the hook without a provider
    const consoleError = console.error;
    console.error = vi.fn(); // Suppress React error logs

    // We expect the hook to throw when used outside a provider
    expect(() => {
      renderHook(() => useWristbandSession());
    }).toThrow('useWristbandSession() must be used within a WristbandAuthProvider.');

    // Restore console.error
    console.error = consoleError;
  });

  it('should call context.updateMetadata when updateMetadata is called', () => {
    const updateMetadataMock = vi.fn();
    const contextValue: IWristbandAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      authStatus: AuthStatus.AUTHENTICATED,
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: {
        firstName: 'John',
        lastName: 'Doe',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
      },
      updateMetadata: updateMetadataMock,
      clearAuthData: () => {},
      clearToken: () => {},
      getToken: () => Promise.resolve(''),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
    );

    // Use the hook and call updateMetadata
    const { result } = renderHook(() => useWristbandSession<UserSessionData>(), { wrapper });

    act(() => {
      result.current.updateMetadata({ firstName: 'Jane' });
    });

    // The context's updateMetadata should be called with the new metadata
    expect(updateMetadataMock).toHaveBeenCalledWith({ firstName: 'Jane' });
  });

  it('should handle empty metadata correctly', () => {
    // Create context with empty metadata
    const contextValue: IWristbandAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      authStatus: AuthStatus.AUTHENTICATED,
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: {},
      updateMetadata: vi.fn(),
      clearAuthData: () => {},
      clearToken: () => {},
      getToken: () => Promise.resolve(''),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
    );

    // Use the hook
    const { result } = renderHook(() => useWristbandSession(), { wrapper });

    // Metadata should be an empty object
    expect(result.current.metadata).toEqual({});
  });

  it('should work correctly with a real-world component scenario', () => {
    // A real-world component example that uses the session data
    interface ProfileProps {
      showPermissions?: boolean;
    }

    const ProfileComponent = ({ showPermissions = false }: ProfileProps) => {
      const { metadata, userId } = useWristbandSession<UserSessionData>();

      return (
        <div>
          <h1 data-testid="greeting">
            Welcome, {metadata.firstName} {metadata.lastName}
          </h1>
          <p data-testid="user-id">User ID: {userId}</p>
          <p data-testid="role">Role: {metadata.role}</p>
          {showPermissions && (
            <ul data-testid="permissions">
              {metadata.permissions.map((permission, index) => (
                <li key={index}>{permission}</li>
              ))}
            </ul>
          )}
        </div>
      );
    };

    // Create context with user data
    const contextValue: IWristbandAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      authStatus: AuthStatus.AUTHENTICATED,
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: {
        firstName: 'John',
        lastName: 'Doe',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
      },
      updateMetadata: vi.fn(),
      clearAuthData: () => {},
      clearToken: () => {},
      getToken: () => Promise.resolve(''),
    };

    // Render component that uses the hook
    render(
      <WristbandAuthContext.Provider value={contextValue}>
        <ProfileComponent showPermissions={true} />
      </WristbandAuthContext.Provider>
    );

    // Component should display the user data correctly
    expect(screen.getByTestId('greeting').textContent).toBe('Welcome, John Doe');
    expect(screen.getByTestId('user-id').textContent).toBe('User ID: user-123');
    expect(screen.getByTestId('role').textContent).toBe('Role: admin');

    // Test permissions list
    const permissionsList = screen.getByTestId('permissions');
    expect(permissionsList.children.length).toBe(3);
    expect(permissionsList.children[0].textContent).toBe('read');
    expect(permissionsList.children[1].textContent).toBe('write');
    expect(permissionsList.children[2].textContent).toBe('delete');
  });

  it('should support generic type parameters for strongly-typed metadata', () => {
    // Create context with fully-typed metadata
    interface EnterpriseUserData {
      employeeId: number;
      department: string;
      accessLevel: number;
      manager: {
        id: string;
        name: string;
      };
    }

    const updateMetadataMock = vi.fn();
    const contextValue: IWristbandAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      authStatus: AuthStatus.AUTHENTICATED,
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: {
        employeeId: 12345,
        department: 'Engineering',
        accessLevel: 3,
        manager: {
          id: 'mgr-789',
          name: 'Jane Smith',
        },
      },
      updateMetadata: updateMetadataMock,
      clearAuthData: () => {},
      clearToken: () => {},
      getToken: () => Promise.resolve(''),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <WristbandAuthContext.Provider value={contextValue}>{children}</WristbandAuthContext.Provider>
    );

    // Use the hook with strongly-typed metadata
    const { result } = renderHook(() => useWristbandSession<EnterpriseUserData>(), { wrapper });

    // Type information should be preserved
    expect(result.current.metadata.employeeId).toBe(12345);
    expect(result.current.metadata.department).toBe('Engineering');
    expect(result.current.metadata.accessLevel).toBe(3);
    expect(result.current.metadata.manager.id).toBe('mgr-789');
    expect(result.current.metadata.manager.name).toBe('Jane Smith');

    // Test updating nested properties
    act(() => {
      result.current.updateMetadata({
        manager: {
          id: 'mgr-789',
          name: 'Jane Wilson', // Updated name
        },
      });
    });

    expect(updateMetadataMock).toHaveBeenCalledWith({
      manager: {
        id: 'mgr-789',
        name: 'Jane Wilson',
      },
    });
  });
});
