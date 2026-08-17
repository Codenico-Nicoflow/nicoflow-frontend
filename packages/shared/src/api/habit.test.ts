import { server } from '__tests__/server';
import type { IHabit, IHabitCell, IHabitDetail, IHabitSubject } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { createHabitApi } from './habit';

const API = 'http://localhost:8080/v1';

const makeHabit = (overrides: Partial<IHabit> = {}): IHabit => ({
  id: 'habit-1',
  name: 'Read',
  subject: 'reading',
  color: 'indigo',
  polarity: 'build',
  targetValue: 1,
  unit: null,
  scheduleKind: 'daily',
  byWeekday: null,
  timesPerWeek: null,
  streakUnit: 'day',
  currentStreak: 0,
  longestStreak: 0,
  dueToday: true,
  completedToday: false,
  loggedToday: false,
  todayValue: 0,
  periodProgress: null,
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const makeHabitCell = (overrides: Partial<IHabitCell> = {}): IHabitCell => ({
  date: '2026-08-05',
  scheduled: true,
  value: 0,
  satisfied: false,
  progress: null,
  ...overrides,
});

const makeHabitDetail = (overrides: Partial<IHabitDetail> = {}): IHabitDetail => ({
  ...makeHabit(),
  cells: [],
  ...overrides,
});

const mockHabitSubjects: IHabitSubject[] = [
  { slug: 'reading', labelKey: 'habits.subject.reading' },
  { slug: 'exercise', labelKey: 'habits.subject.exercise' },
];

const baseQuery = fetchBaseQuery({ baseUrl: API });

const makeStore = () => {
  const habitApi = createHabitApi(baseQuery);
  const store = configureStore({
    reducer: {
      auth: (state = { token: null }) => state,
      [habitApi.reducerPath]: habitApi.reducer,
    },
    middleware: gDM => gDM().concat(habitApi.middleware),
  });
  return { store, habitApi };
};

describe('habitApi slice', () => {
  it('getHabits unwraps the envelope and keeps string IDs', async () => {
    server.use(http.get(`${API}/habits`, () => HttpResponse.json({ data: [makeHabit()], error: null })));

    const { store, habitApi } = makeStore();
    const result = await store.dispatch(habitApi.endpoints.getHabits.initiate());

    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]?.id).toBe('habit-1');
    expect(typeof result.data?.[0]?.id).toBe('string');
  });

  it('getHabits asks for archived rows only when told to', async () => {
    const urls: string[] = [];
    server.use(
      http.get(`${API}/habits`, ({ request }) => {
        urls.push(new URL(request.url).search);
        return HttpResponse.json({ data: [], error: null });
      })
    );

    const { store, habitApi } = makeStore();
    await store.dispatch(habitApi.endpoints.getHabits.initiate());
    await store.dispatch(habitApi.endpoints.getHabits.initiate({ includeArchived: true }));

    expect(urls).toEqual(['', '?includeArchived=true']);
  });

  it('getHabit returns the detail shape with its heatmap cells', async () => {
    server.use(
      http.get(`${API}/habits/habit-1`, () =>
        HttpResponse.json({
          data: makeHabitDetail({ cells: [makeHabitCell({ satisfied: true })] }),
          error: null,
        })
      )
    );

    const { store, habitApi } = makeStore();
    const result = await store.dispatch(habitApi.endpoints.getHabit.initiate('habit-1'));

    expect(result.data?.cells).toHaveLength(1);
    expect(result.data?.cells?.[0]?.satisfied).toBe(true);
  });

  it('getHabitsToday reads the dedicated feed, not the full list', async () => {
    let todayCalled = false;
    server.use(
      http.get(`${API}/habits/today`, () => {
        todayCalled = true;
        return HttpResponse.json({ data: [makeHabit({ dueToday: true })], error: null });
      })
    );

    const { store, habitApi } = makeStore();
    const result = await store.dispatch(habitApi.endpoints.getHabitsToday.initiate());

    expect(todayCalled).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('getHabitSubjects returns the served catalog', async () => {
    server.use(http.get(`${API}/habits/subjects`, () => HttpResponse.json({ data: mockHabitSubjects, error: null })));

    const { store, habitApi } = makeStore();
    const result = await store.dispatch(habitApi.endpoints.getHabitSubjects.initiate());

    expect(result.data?.length).toBeGreaterThan(0);
    expect(result.data?.[0]).toHaveProperty('labelKey');
  });

  it('createHabit posts the schedule shape and unwraps the created habit', async () => {
    let body: unknown;
    server.use(
      http.post(`${API}/habits`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: makeHabit({ id: 'new-1' }), error: null }, { status: 201 });
      })
    );

    const { store, habitApi } = makeStore();
    const result = await store.dispatch(
      habitApi.endpoints.createHabit.initiate({
        name: 'Read',
        scheduleKind: 'weekly_quota',
        timesPerWeek: 3,
      })
    );

    expect(body).toEqual({ name: 'Read', scheduleKind: 'weekly_quota', timesPerWeek: 3 });
    expect('data' in result && result.data?.id).toBe('new-1');
  });

  it('updateHabit sends the id in the path, not the body', async () => {
    let body: unknown;
    server.use(
      http.patch(`${API}/habits/habit-1`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: makeHabit({ name: 'Read more' }), error: null });
      })
    );

    const { store, habitApi } = makeStore();
    await store.dispatch(habitApi.endpoints.updateHabit.initiate({ id: 'habit-1', name: 'Read more' }));

    expect(body).toEqual({ name: 'Read more' });
  });

  it('checkIn posts to the nested path with an empty body by default', async () => {
    let body: unknown;
    server.use(
      http.post(`${API}/habits/habit-1/check-in`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: makeHabit({ currentStreak: 5, completedToday: true }), error: null });
      })
    );

    const { store, habitApi } = makeStore();
    const result = await store.dispatch(habitApi.endpoints.checkIn.initiate({ id: 'habit-1' }));

    expect(body).toEqual({});
    expect('data' in result && result.data?.currentStreak).toBe(5);
  });

  it('checkIn forwards a backfill date and value', async () => {
    let body: unknown;
    server.use(
      http.post(`${API}/habits/habit-1/check-in`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: makeHabit(), error: null });
      })
    );

    const { store, habitApi } = makeStore();
    await store.dispatch(habitApi.endpoints.checkIn.initiate({ id: 'habit-1', date: '2026-08-01', value: 3 }));

    expect(body).toEqual({ date: '2026-08-01', value: 3 });
  });

  it('undoCheckIn deletes on the same nested path', async () => {
    let called = false;
    server.use(
      http.delete(`${API}/habits/habit-1/check-in`, () => {
        called = true;
        return HttpResponse.json({ data: makeHabit({ currentStreak: 0 }), error: null });
      })
    );

    const { store, habitApi } = makeStore();
    const result = await store.dispatch(habitApi.endpoints.undoCheckIn.initiate({ id: 'habit-1' }));

    expect(called).toBe(true);
    expect('data' in result && result.data?.currentStreak).toBe(0);
  });

  it('archiveHabit soft-deletes without expecting a body back', async () => {
    server.use(http.delete(`${API}/habits/habit-1`, () => new HttpResponse(null, { status: 204 })));

    const { store, habitApi } = makeStore();
    const result = await store.dispatch(habitApi.endpoints.archiveHabit.initiate('habit-1'));

    expect('error' in result).toBe(false);
  });
});
