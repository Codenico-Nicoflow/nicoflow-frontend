import { configureStore } from '@reduxjs/toolkit';
import type { InfiniteData } from '@reduxjs/toolkit/query';
import { describe, expect, it } from 'vitest';

import type { IUser } from '@/lib/types';

import { clearAuth, setUser } from './slices/auth/authSlice';
import { taskApi } from './slices/tasks/taskApi';
import type { GetTasksPage } from './slices/tasks/type';
import { rootReducer } from './store';

const mockUser: IUser = {
  id: '1',
  email: 'a@b.co',
  firstName: 'A',
  lastName: 'B',
  username: 'ab',
  theme: 'light',
  language: 'en',
  timezone: 'UTC',
  imageUrl: '',
  status: 'regular',
};

const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(taskApi.middleware),
  });

describe('rootReducer logout cache reset', () => {
  it('wipes every RTK Query cache on clearAuth so a new user sees no stale data', () => {
    const store = makeStore();
    store.dispatch(setUser(mockUser));
    const emptyInfiniteData: InfiniteData<GetTasksPage, string> = {
      pages: [{ items: [], nextCursor: '' }],
      pageParams: [''],
    };
    store.dispatch(taskApi.util.upsertQueryData('getTasks', { projectId: 'p1' }, emptyInfiniteData));

    expect(Object.keys(store.getState()[taskApi.reducerPath].queries).length).toBeGreaterThan(0);

    store.dispatch(clearAuth());

    expect(store.getState().auth.user).toBeNull();
    expect(Object.keys(store.getState()[taskApi.reducerPath].queries)).toHaveLength(0);
  });
});
