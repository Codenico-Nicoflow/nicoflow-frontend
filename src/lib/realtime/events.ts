// The server-pushed WebSocket envelope (matches SPEC §3.14 / nicoflow-api ws.Event).
// Payloads are full resources; we deliberately don't type each one — the client
// reacts by invalidating RTK Query tags and refetching, never by patching cache
// from the payload, so the exact payload shape doesn't matter here.
export type WsEvent = {
  event: string;
  payload: unknown;
  timestamp: string;
};

// RTK Query tag families a given WS event invalidates. Keeping this as data (not a
// switch) makes the mapping auditable and trivially testable. An event with no
// entry is simply ignored — a new backend event never throws, it just no-ops until
// we teach the client about it.
export const WS_EVENT_TAGS: Record<string, readonly string[]> = {
  'notification.created': ['Notification', 'NotificationCount'],
  'task.created': ['Task'],
  'task.updated': ['Task'],
  'task.deleted': ['Task'],
  'task.status_changed': ['Task'],
  'bucket.processed': ['Bucket'],
};
