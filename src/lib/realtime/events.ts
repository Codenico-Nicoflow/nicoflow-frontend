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
// Task events invalidate the whole family + Focus + TimeSpread: a scheduled-date
// or status change moves a task between Today/Next-7/Focus, which per-id
// invalidation would miss.
const TASK_TAGS = ['Task', 'Focus', 'TimeSpread'] as const;

export const WS_EVENT_TAGS: Record<string, readonly string[]> = {
  'notification.created': ['Notification', 'NotificationCount'],
  'task.created': TASK_TAGS,
  'task.updated': TASK_TAGS,
  'task.deleted': TASK_TAGS,
  'task.status_changed': TASK_TAGS,
  // Project events also invalidate Area: the areas board (ListWithProjects, on
  // areaApi's Area tag) nests projects, mirroring refreshBoardOnSuccess in
  // projectApi's own mutations.
  'project.created': ['Project', 'Area'],
  'project.updated': ['Project', 'Area'],
  'project.deleted': ['Project', 'Area'],
  'area.created': ['Area'],
  'area.updated': ['Area'],
  'area.deleted': ['Area'],
  'bucket.created': ['Bucket'],
  'bucket.processed': ['Bucket'],
  'bucket.deleted': ['Bucket'],
};
