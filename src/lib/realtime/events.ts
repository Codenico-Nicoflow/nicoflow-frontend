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
//
// An event lists EVERY tag any open view derives from that resource, across api
// instances (tags don't cross createApi). Under-listing leaves a cross-tab view
// stale even though the event arrived — the reverse of over-fetching, and worse.

// Task events invalidate the whole family + Focus + TimeSpread (a scheduled-date
// or status change moves a task between Today/Next-7/Focus, which per-id would
// miss) + Subtask (the backend reuses task.updated for subtask mutations, and the
// subtask list is a separate api) + Search (results embed tasks).
const TASK_TAGS = ['Task', 'Focus', 'TimeSpread', 'Subtask', 'Search'] as const;

export const WS_EVENT_TAGS: Record<string, readonly string[]> = {
  'notification.created': ['Notification', 'NotificationCount'],
  'task.created': TASK_TAGS,
  'task.updated': TASK_TAGS,
  'task.deleted': TASK_TAGS,
  'task.status_changed': TASK_TAGS,
  // Project events also invalidate Area (the areas board nests projects, mirroring
  // refreshBoardOnSuccess in projectApi's own mutations) + Search (results embed
  // projects).
  'project.created': ['Project', 'Area', 'Search'],
  'project.updated': ['Project', 'Area', 'Search'],
  'project.deleted': ['Project', 'Area', 'Search'],
  // Area events also invalidate Search (results embed areas).
  'area.created': ['Area', 'Search'],
  'area.updated': ['Area', 'Search'],
  'area.deleted': ['Area', 'Search'],
  'bucket.created': ['Bucket'],
  'bucket.processed': ['Bucket'],
  'bucket.deleted': ['Bucket'],
};
