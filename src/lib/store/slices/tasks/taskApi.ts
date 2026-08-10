import type { InfiniteData } from '@reduxjs/toolkit/query';
import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiEnvelope, ITask } from '@/lib/types';
import { TASKS_API } from '@/lib/types';

import { baseQueryWithReauth } from '../baseQuery';

import type {
  CreateTaskRequest,
  CreateTaskResponse,
  DeleteTaskRequest,
  DeleteTaskResponse,
  GetCalendarTasksRequest,
  GetCalendarTasksResponse,
  GetFocusRequest,
  GetFocusResponse,
  GetTaskRequest,
  GetTaskResponse,
  GetTasksPage,
  GetTasksRequest,
  GetTimeSpreadResponse,
  ReorderTaskRequest,
  ReorderTaskResponse,
  ScheduleTaskRequest,
  ScheduleTaskResponse,
  UpdateTaskRequest,
  UpdateTaskResponse,
  UpdateTaskStatusRequest,
  UpdateTaskStatusResponse,
} from './type';

// Derived from the RTK utils themselves rather than importing RootState: the
// slice must stay importable without a circular dependency on the configured
// store, and these follow the toolkit's own types across upgrades.
type TaskApiState = Parameters<typeof taskApi.util.selectInvalidatedBy>[0];
type CalendarPatch = ReturnType<typeof taskApi.util.updateQueryData>;
type TaskApiDispatch = <T extends CalendarPatch>(patch: T) => ReturnType<T>;

/**
 * Apply `mutate` to a task inside every cached calendar window, returning the
 * patch handles so a failed mutation can undo them.
 *
 * Only `getCalendarTasks` entries are touched: the per-project infinite lists
 * have no drag surface, and re-patching them would duplicate work the
 * invalidation already does on success.
 */
/**
 * Truncate every cached `getTasks` page list back to just page 1.
 *
 * A create/delete/reorder shifts the keyset (created_at DESC) that later
 * pages' cursors were computed against. If those stale pages are still in
 * the cache when the mutation's `invalidatesTags` fires, RTK's automatic
 * refetch replays each one's stored cursor as if nothing moved, re-including
 * whatever row now sits on the old page boundary — a visible duplicate.
 *
 * Called from `onQueryStarted` BEFORE `queryFulfilled` — i.e. as soon as the
 * request goes out, not after it resolves. `invalidatesTags`' own refetch is
 * dispatched by middleware in the same tick the mutation settles, so
 * truncating afterward races it and can lose; truncating up front guarantees
 * only page 1 exists by the time that refetch runs. Trade-off: a user several
 * pages deep loses that depth on any task mutation and re-scrolls — accepted,
 * correctness over preserved scroll position.
 */
const collapseTaskListsToPage1 = (state: TaskApiState, dispatch: TaskApiDispatch) =>
  taskApi.util
    .selectInvalidatedBy(state, [{ type: 'Task' }])
    .filter(entry => entry.endpointName === 'getTasks')
    .forEach(entry =>
      dispatch(
        taskApi.util.updateQueryData(
          'getTasks',
          entry.originalArgs as GetTasksRequest,
          (draft: InfiniteData<GetTasksPage, string>) => {
            draft.pages = draft.pages.slice(0, 1);
            draft.pageParams = draft.pageParams.slice(0, 1);
          }
        )
      )
    );

const patchCalendarCaches = (
  state: TaskApiState,
  dispatch: TaskApiDispatch,
  id: string,
  mutate: (task: ITask) => void
) =>
  taskApi.util
    .selectInvalidatedBy(state, [{ type: 'Task' }])
    .filter(entry => entry.endpointName === 'getCalendarTasks')
    .map(entry =>
      dispatch(
        taskApi.util.updateQueryData('getCalendarTasks', entry.originalArgs as GetCalendarTasksRequest, draft => {
          const found = draft.find(task => task.id === id);
          if (found) mutate(found);
        })
      )
    );

export const taskApi = createApi({
  reducerPath: 'taskApi',
  baseQuery: baseQueryWithReauth,
  // 'Task' = per-project infinite lists. 'Focus' and 'TimeSpread' are derived
  // cross-project views (ranked list / day buckets): any task mutation must
  // refresh them too.
  tagTypes: ['Task', 'Focus', 'TimeSpread'],
  endpoints: builder => ({
    // Cursor-paginated per-project task list (keyset on (created_at, id) DESC).
    // Three generics: page shape, query arg (cache key), page param type.
    // Filter counts in the UI only reflect loaded pages once a project exceeds
    // one page — accepted tradeoff (no summary-count endpoint).
    getTasks: builder.infiniteQuery<GetTasksPage, GetTasksRequest, string>({
      infiniteQueryOptions: {
        initialPageParam: '',
        getNextPageParam: (lastPage: GetTasksPage) => (lastPage.nextCursor === '' ? undefined : lastPage.nextCursor),
      },
      query: ({ queryArg, pageParam }) => ({
        url: `/projects/${queryArg.projectId}/tasks`,
        params: {
          ...(queryArg.status !== undefined && { status: queryArg.status }),
          ...(queryArg.priority !== undefined && { priority: queryArg.priority }),
          ...(queryArg.energy !== undefined && { energy: queryArg.energy }),
          ...(queryArg.search !== undefined && { search: queryArg.search }),
          ...(queryArg.sortField !== undefined && { sortField: queryArg.sortField }),
          ...(queryArg.sortOrder !== undefined && { sortOrder: queryArg.sortOrder }),
          ...(pageParam !== '' && { cursor: pageParam }),
          limit: 50,
        },
      }),
      transformResponse: (raw: ApiEnvelope<GetTasksPage>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: ['Task'],
    }),
    getTask: builder.query<GetTaskResponse, GetTaskRequest>({
      query: id => `${TASKS_API.GET_TASK}${id}`,
      transformResponse: (raw: ApiEnvelope<GetTaskResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: ['Task'],
    }),
    createTask: builder.mutation<CreateTaskResponse, CreateTaskRequest>({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/tasks`,
        method: 'POST',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<CreateTaskResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      // Collapse before the request resolves — see collapseTaskListsToPage1.
      onQueryStarted: (_arg, { dispatch, getState }) => {
        collapseTaskListsToPage1(getState(), dispatch);
      },
      invalidatesTags: ['Task', 'Focus', 'TimeSpread'],
    }),
    updateTask: builder.mutation<UpdateTaskResponse, UpdateTaskRequest>({
      query: ({ id, ...body }) => ({
        url: `${TASKS_API.UPDATE_TASK}${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<UpdateTaskResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      // Only calendar windows are patched optimistically — resize on the grid
      // must track the pointer. Dialog edits go through the same endpoint and
      // simply get a patch that no cached window contains.
      onQueryStarted: async ({ id, ...body }, { dispatch, getState, queryFulfilled }) => {
        const patches = patchCalendarCaches(getState(), dispatch, id, task => {
          if (body.estimatedMinutes !== undefined) task.estimatedMinutes = body.estimatedMinutes;
          if (body.scheduledTime !== undefined) task.scheduledTime = body.scheduledTime;
          if (body.scheduledFor !== undefined) task.scheduledFor = body.scheduledFor;
        });
        try {
          await queryFulfilled;
        } catch {
          patches.forEach(patch => patch.undo());
        }
      },
      invalidatesTags: ['Task', 'Focus', 'TimeSpread'],
    }),
    deleteTask: builder.mutation<DeleteTaskResponse, DeleteTaskRequest>({
      query: id => ({
        url: `${TASKS_API.DELETE_TASK}${id}`,
        method: 'DELETE',
      }),
      transformErrorResponse: error => error.data,
      onQueryStarted: (_arg, { dispatch, getState }) => {
        collapseTaskListsToPage1(getState(), dispatch);
      },
      invalidatesTags: ['Task', 'Focus', 'TimeSpread'],
    }),
    updateTaskStatus: builder.mutation<UpdateTaskStatusResponse, UpdateTaskStatusRequest>({
      query: ({ id, status }) => ({
        url: `${TASKS_API.UPDATE_TASK}${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (raw: ApiEnvelope<UpdateTaskStatusResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      // Optimistic: flip the status in every page of every cached getTasks
      // list, then undo all patches on failure. The cache is now InfiniteData
      // so we walk pages[].items instead of a flat draft array.
      onQueryStarted: async ({ id, status }, { dispatch, getState, queryFulfilled }) => {
        const entries = taskApi.util.selectInvalidatedBy(getState(), [{ type: 'Task' }]);
        const patches = entries
          .filter(entry => entry.endpointName === 'getTasks')
          .map(entry =>
            dispatch(
              taskApi.util.updateQueryData(
                'getTasks',
                entry.originalArgs as GetTasksRequest,
                (draft: InfiniteData<GetTasksPage, string>) => {
                  for (const page of draft.pages) {
                    const found = page.items.find(task => task.id === id);
                    if (found) {
                      found.status = status;
                      break;
                    }
                  }
                }
              )
            )
          );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach(patch => patch.undo());
        }
      },
      invalidatesTags: ['Task', 'Focus', 'TimeSpread'],
    }),
    reorderTask: builder.mutation<ReorderTaskResponse, ReorderTaskRequest>({
      query: ({ id, displayOrder }) => ({
        url: `${TASKS_API.UPDATE_TASK}${id}/reorder`,
        method: 'PATCH',
        body: { displayOrder },
      }),
      transformResponse: (raw: ApiEnvelope<ReorderTaskResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      // Optimistic: move the task to its target order across all pages, repack
      // siblings contiguously (mirrors the backend), and undo on failure. Only
      // the first page that contains the task is mutated — displayOrder is
      // contiguous within the project and reordering crosses pages only when
      // the user drags past the loaded boundary, which the UI does not support.
      onQueryStarted: async ({ id, displayOrder }, { dispatch, getState, queryFulfilled }) => {
        const entries = taskApi.util.selectInvalidatedBy(getState(), [{ type: 'Task' }]);
        const patches = entries
          .filter(entry => entry.endpointName === 'getTasks')
          .map(entry =>
            dispatch(
              taskApi.util.updateQueryData(
                'getTasks',
                entry.originalArgs as GetTasksRequest,
                (draft: InfiniteData<GetTasksPage, string>) => {
                  for (const page of draft.pages) {
                    const moved = page.items.find(task => task.id === id);
                    if (!moved) continue;
                    const siblings = page.items
                      .filter(task => task.id !== id)
                      .sort((a, b) => a.displayOrder - b.displayOrder);
                    siblings.splice(Math.min(Math.max(displayOrder, 0), siblings.length), 0, moved);
                    siblings.forEach((task, order) => {
                      task.displayOrder = order;
                    });
                    break;
                  }
                }
              )
            )
          );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach(patch => patch.undo());
        }
      },
      invalidatesTags: ['Task', 'Focus', 'TimeSpread'],
    }),
    scheduleTask: builder.mutation<ScheduleTaskResponse, ScheduleTaskRequest>({
      query: ({ id, ...body }) => ({
        url: `${TASKS_API.UPDATE_TASK}${id}/schedule`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<ScheduleTaskResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      // Optimistic so a calendar drag lands under the pointer instead of after
      // a round trip; a rejected mutation (including the free-plan 403) undoes
      // the patch and the block visibly springs back.
      onQueryStarted: async ({ id, ...body }, { dispatch, getState, queryFulfilled }) => {
        const patches = patchCalendarCaches(getState(), dispatch, id, task => {
          if (body.scheduledFor !== undefined) task.scheduledFor = body.scheduledFor;
          if (body.scheduledTime !== undefined) task.scheduledTime = body.scheduledTime;
          if (body.rollsOver !== undefined) task.rollsOver = body.rollsOver;
        });
        try {
          await queryFulfilled;
        } catch {
          patches.forEach(patch => patch.undo());
        }
      },
      invalidatesTags: ['Task', 'Focus', 'TimeSpread'],
    }),
    // Focus — "what can I do right now?" Ranked across all projects, so it lives
    // outside the per-project getTasks lists under its own Focus tag; any task
    // mutation invalidates Focus (see the mutation invalidatesTags above).
    getFocus: builder.query<GetFocusResponse, GetFocusRequest>({
      query: params => ({
        url: '/focus',
        params,
      }),
      transformResponse: (raw: ApiEnvelope<{ items: GetFocusResponse }>) => raw.data.items,
      transformErrorResponse: error => error.data,
      providesTags: ['Focus'],
    }),
    // Time Spread — the today/tomorrow/this-week buckets. Another derived
    // cross-project view under its own tag, refreshed by any task mutation.
    getTimeSpread: builder.query<GetTimeSpreadResponse, void>({
      // Send the browser's IANA zone so day buckets align with the user's
      // local calendar (the API defaults to UTC when tz is absent).
      query: () => `/time-spread?tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`,
      transformResponse: (raw: ApiEnvelope<GetTimeSpreadResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: ['TimeSpread'],
    }),
    // Calendar range — the flat window the hour grid renders. Deliberately under
    // the 'Task' tag rather than a tag of its own: it IS the task list for a
    // date window, so every existing task mutation and WS task event already
    // invalidates it, and the calendar stays live for free.
    getCalendarTasks: builder.query<GetCalendarTasksResponse, GetCalendarTasksRequest>({
      query: params => ({
        url: '/tasks',
        params,
      }),
      transformResponse: (raw: ApiEnvelope<{ items: GetCalendarTasksResponse }>) => raw.data.items,
      transformErrorResponse: error => error.data,
      providesTags: ['Task'],
    }),
  }),
});

export const {
  useGetTasksInfiniteQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskStatusMutation,
  useReorderTaskMutation,
  useScheduleTaskMutation,
  useGetFocusQuery,
  useGetTimeSpreadQuery,
  useGetCalendarTasksQuery,
} = taskApi;
