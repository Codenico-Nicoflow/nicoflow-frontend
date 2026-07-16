import { createApi } from '@reduxjs/toolkit/query/react';

import type { ApiEnvelope } from '@/lib/types';
import { NOTIFICATION_API } from '@/lib/types';

import { baseQueryWithReauth } from '../baseQuery';

import type {
  CountResponse,
  DeleteNotificationRequest,
  GetNotificationsRequest,
  GetNotificationsResponse,
  GetPreferencesResponse,
  MarkReadRequest,
  MarkReadResponse,
  PushSubscribeRequest,
  PushUnsubscribeRequest,
  UnreadCountResponse,
  UpdatePreferencesRequest,
  UpdatePreferencesResponse,
} from './type';

// Builds the /notifications query string from the optional filter params, omitting
// anything undefined so the request stays clean (e.g. no `isRead=undefined`).
const buildListUrl = ({ cursor, isRead, limit }: GetNotificationsRequest): string => {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (isRead !== undefined) params.set('isRead', String(isRead));
  if (limit !== undefined) params.set('limit', String(limit));
  const qs = params.toString();
  return qs ? `${NOTIFICATION_API.GET_NOTIFICATIONS}?${qs}` : NOTIFICATION_API.GET_NOTIFICATIONS;
};

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Notification', 'NotificationCount', 'NotificationPref'],
  endpoints: builder => ({
    getNotifications: builder.query<GetNotificationsResponse, GetNotificationsRequest | void>({
      query: (args = {}) => buildListUrl(args ?? {}),
      transformResponse: (raw: ApiEnvelope<GetNotificationsResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: ['Notification'],
    }),
    getUnreadCount: builder.query<UnreadCountResponse, void>({
      query: () => NOTIFICATION_API.GET_UNREAD_COUNT,
      transformResponse: (raw: ApiEnvelope<UnreadCountResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: ['NotificationCount'],
    }),
    markRead: builder.mutation<MarkReadResponse, MarkReadRequest>({
      query: id => ({
        url: `${NOTIFICATION_API.MARK_READ}${id}/read`,
        method: 'PATCH',
      }),
      transformResponse: (raw: ApiEnvelope<MarkReadResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Notification', 'NotificationCount'],
    }),
    markAllRead: builder.mutation<CountResponse, void>({
      query: () => ({
        url: NOTIFICATION_API.MARK_ALL_READ,
        method: 'PATCH',
      }),
      transformResponse: (raw: ApiEnvelope<CountResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Notification', 'NotificationCount'],
    }),
    deleteNotification: builder.mutation<void, DeleteNotificationRequest>({
      query: id => ({
        url: `${NOTIFICATION_API.DELETE_NOTIFICATION}${id}`,
        method: 'DELETE',
      }),
      transformErrorResponse: error => error.data,
      invalidatesTags: ['Notification', 'NotificationCount'],
    }),
    getPreferences: builder.query<GetPreferencesResponse, void>({
      query: () => NOTIFICATION_API.GET_PREFERENCES,
      transformResponse: (raw: ApiEnvelope<GetPreferencesResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      providesTags: ['NotificationPref'],
    }),
    updatePreferences: builder.mutation<UpdatePreferencesResponse, UpdatePreferencesRequest>({
      query: body => ({
        url: NOTIFICATION_API.UPDATE_PREFERENCES,
        method: 'PUT',
        body,
      }),
      transformResponse: (raw: ApiEnvelope<UpdatePreferencesResponse>) => raw.data,
      transformErrorResponse: error => error.data,
      invalidatesTags: ['NotificationPref'],
    }),
    // Web Push (Pro-only on the backend): a free-plan caller gets PLAN_LIMIT_EXCEEDED,
    // surfaced to the UI as an upgrade prompt. Success carries no body (201).
    subscribePush: builder.mutation<void, PushSubscribeRequest>({
      query: body => ({
        url: NOTIFICATION_API.PUSH_SUBSCRIBE,
        method: 'POST',
        body,
      }),
      transformErrorResponse: error => error.data,
    }),
    unsubscribePush: builder.mutation<void, PushUnsubscribeRequest>({
      query: body => ({
        url: NOTIFICATION_API.PUSH_SUBSCRIBE,
        method: 'DELETE',
        body,
      }),
      transformErrorResponse: error => error.data,
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useSubscribePushMutation,
  useUnsubscribePushMutation,
} = notificationApi;
