import type { INotification, INotificationPref } from '@nicoflow/shared/types';

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

// Web Push subscribe payload — the flattened shape of a browser PushSubscription
// (endpoint + P-256 keys), matching POST /notifications/push/subscribe.
export type PushSubscribeRequest = {
  endpoint: string;
  p256dhKey: string;
  authKey: string;
  userAgent: string;
};

// Unsubscribe only needs the endpoint to identify the row.
export type PushUnsubscribeRequest = {
  endpoint: string;
};
