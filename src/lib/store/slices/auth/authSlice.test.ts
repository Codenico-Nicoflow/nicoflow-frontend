import { describe, expect, it } from 'vitest';

import type { IUser } from '@/lib/types';

import type { AuthState } from './authSlice';
import authReducer, { clearAuth, selectIsLoading, selectUser, setIsLoading, setToken, setUser } from './authSlice';

const mockUser: IUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
  theme: 'light',
  language: 'en',
  imageUrl: '',
  status: 'regular',
};

const initialState: AuthState = { user: null, token: null, isLoading: false };

describe('authSlice reducer', () => {
  it('returns initial state when called with undefined', () => {
    expect(authReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('setUser stores the user', () => {
    const state = authReducer(initialState, setUser(mockUser));
    expect(state.user).toEqual(mockUser);
    expect(state.isLoading).toBe(false);
  });

  it('setUser accepts null to clear user', () => {
    const withUser: AuthState = { user: mockUser, token: null, isLoading: false };
    const state = authReducer(withUser, setUser(null));
    expect(state.user).toBeNull();
  });

  it('setToken stores the token', () => {
    const state = authReducer(initialState, setToken('abc123'));
    expect(state.token).toBe('abc123');
  });

  it('setToken accepts null to clear token', () => {
    const withToken: AuthState = { user: null, token: 'abc123', isLoading: false };
    const state = authReducer(withToken, setToken(null));
    expect(state.token).toBeNull();
  });

  it('setIsLoading sets loading flag', () => {
    const state = authReducer(initialState, setIsLoading(true));
    expect(state.isLoading).toBe(true);
  });

  it('clearAuth resets everything to initial state', () => {
    const withUser: AuthState = { user: mockUser, token: 'abc123', isLoading: true };
    const state = authReducer(withUser, clearAuth());
    expect(state).toEqual(initialState);
  });
});

describe('authSlice selectors', () => {
  const rootState = {
    auth: { user: mockUser, token: 'abc123', isLoading: false },
  };

  it('selectUser returns the user', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(selectUser(rootState as any)).toEqual(mockUser);
  });

  it('selectIsLoading returns isLoading', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(selectIsLoading(rootState as any)).toBe(false);
  });

  it('selectUser returns null when no user', () => {
    const emptyRoot = { auth: initialState };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(selectUser(emptyRoot as any)).toBeNull();
  });
});
