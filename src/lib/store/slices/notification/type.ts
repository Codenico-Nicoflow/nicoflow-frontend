import type { INotification, INotificationPref } from '@/lib/types';

// List query params: opaque cursor + optional read filter (matches the backend
// keyset pagination). Undefined fields are omitted from the request.
export type GetNotificationsRequest = {
  cursor?: string;
  isRead?: boolean;
  limit?: number;
};

export type GetNotificationsResponse = {
  items: INotification[];
  nextCursor: string;
};

export type UnreadCountResponse = {
  count: number;
};

export type CountResponse = {
  count: number;
};

export type MarkReadRequest = string;
export type MarkReadResponse = INotification;

export type DeleteNotificationRequest = string;

export type GetPreferencesResponse = INotificationPref;

// Partial update — every field optional (lazy upsert on the backend).
export type UpdatePreferencesRequest = Partial<INotificationPref>;
export type UpdatePreferencesResponse = INotificationPref;
