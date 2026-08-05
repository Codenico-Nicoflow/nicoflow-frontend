import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiEnvelope, IHabit, IHabitDetail, IHabitSubject } from '@/lib/types';
import { HABIT_API } from '@/lib/types';

import { baseQueryWithReauth } from '../baseQuery';

import type { CheckInRequest, CreateHabitRequest, UndoCheckInRequest, UpdateHabitRequest } from './type';

// Habits data layer (E-055).
//
// Every mutation — including a check-in — invalidates the whole 'Habit' list as
// well as the touched id. A check-in changes the streak, and the Today strip is
// a *derived* view of the same resource: a habit leaves that feed the moment its
// quota is met, so refreshing only the scalar would leave the strip showing work
// the user has already done.
export const habitApi = createApi({
  reducerPath: 'habitApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Habit'],
  endpoints: builder => ({
    getHabits: builder.query<IHabit[], { includeArchived?: boolean } | void>({
      query: args => {
        const includeArchived = args && args.includeArchived;
        return includeArchived ? `${HABIT_API.LIST}?includeArchived=true` : HABIT_API.LIST;
      },
      transformResponse: (raw: ApiEnvelope<IHabit[]>) => raw.data,
      providesTags: result =>
        result
          ? [...result.map(({ id }) => ({ type: 'Habit' as const, id })), { type: 'Habit' as const, id: 'LIST' }]
          : [{ type: 'Habit' as const, id: 'LIST' }],
    }),

    // The Today strip. Its own endpoint rather than a slice of getHabits: the
    // server decides what is still owed, including the quota rule, so the client
    // never reimplements "due".
    getHabitsToday: builder.query<IHabit[], void>({
      query: () => HABIT_API.TODAY,
      transformResponse: (raw: ApiEnvelope<IHabit[]>) => raw.data,
      providesTags: [{ type: 'Habit', id: 'TODAY' }],
    }),

    getHabit: builder.query<IHabitDetail, string>({
      query: id => `${HABIT_API.DETAIL}${id}`,
      transformResponse: (raw: ApiEnvelope<IHabitDetail>) => raw.data,
      providesTags: (_result, _error, id) => [{ type: 'Habit', id }],
    }),

    // Static catalog. Cached indefinitely — it changes on deploy, not per user,
    // and refetching it on every dialog open would be pure waste.
    getHabitSubjects: builder.query<IHabitSubject[], void>({
      query: () => HABIT_API.SUBJECTS,
      transformResponse: (raw: ApiEnvelope<IHabitSubject[]>) => raw.data,
      keepUnusedDataFor: 3600,
    }),

    createHabit: builder.mutation<IHabit, CreateHabitRequest>({
      query: body => ({ url: HABIT_API.CREATE, method: 'POST', body }),
      transformResponse: (raw: ApiEnvelope<IHabit>) => raw.data,
      invalidatesTags: [
        { type: 'Habit', id: 'LIST' },
        { type: 'Habit', id: 'TODAY' },
      ],
    }),

    updateHabit: builder.mutation<IHabit, UpdateHabitRequest>({
      query: ({ id, ...body }) => ({ url: `${HABIT_API.DETAIL}${id}`, method: 'PATCH', body }),
      transformResponse: (raw: ApiEnvelope<IHabit>) => raw.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Habit', id },
        { type: 'Habit', id: 'LIST' },
        { type: 'Habit', id: 'TODAY' },
      ],
    }),

    deleteHabit: builder.mutation<void, string>({
      query: id => ({ url: `${HABIT_API.DETAIL}${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Habit', id },
        { type: 'Habit', id: 'LIST' },
        { type: 'Habit', id: 'TODAY' },
      ],
    }),

    checkIn: builder.mutation<IHabit, CheckInRequest>({
      query: ({ id, ...body }) => ({
        url: `${HABIT_API.DETAIL}${id}${HABIT_API.CHECK_IN}`,
        method: 'POST',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<IHabit>) => raw.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Habit', id },
        { type: 'Habit', id: 'LIST' },
        { type: 'Habit', id: 'TODAY' },
      ],
    }),

    undoCheckIn: builder.mutation<IHabit, UndoCheckInRequest>({
      query: ({ id, ...body }) => ({
        url: `${HABIT_API.DETAIL}${id}${HABIT_API.CHECK_IN}`,
        method: 'DELETE',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<IHabit>) => raw.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Habit', id },
        { type: 'Habit', id: 'LIST' },
        { type: 'Habit', id: 'TODAY' },
      ],
    }),
  }),
});

export const {
  useGetHabitsQuery,
  useGetHabitsTodayQuery,
  useGetHabitQuery,
  useGetHabitSubjectsQuery,
  useCreateHabitMutation,
  useUpdateHabitMutation,
  useDeleteHabitMutation,
  useCheckInMutation,
  useUndoCheckInMutation,
} = habitApi;
