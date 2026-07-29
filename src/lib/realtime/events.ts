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
  // Fires when a session gains its server-derived title after the first message
  // (NIC-1684). Payload is { id } but we invalidate the whole 'AISession' family
  // rather than per-id: the title change reorders the updatedAt-DESC list, so the
  // LIST tag must refetch, not just the one row.
  'ai.session.updated': ['AISession'],
  // Recurrence events (E-050) also invalidate the task family: every rule
  // mutation moves task rows too — create materializes instance #1, edit
  // re-stamps the live instance, delete reaps the pending one — and the sweep
  // emits recurrence.updated when it materializes. RecurrenceStats is derived
  // from those same occurrence rows, so it moves with them.
  'recurrence.created': ['RecurrenceRule', 'RecurrenceStats', ...TASK_TAGS],
  'recurrence.updated': ['RecurrenceRule', 'RecurrenceStats', ...TASK_TAGS],
  'recurrence.deleted': ['RecurrenceRule', 'RecurrenceStats', ...TASK_TAGS],
};

// Attachment events are the one payload-dependent case: the attachment list is
// tagged per owner — { type: 'Attachment', id: ownerId } — so a flat string tag
// can't express which owner to invalidate. Both events carry ownerId in the
// payload (created = full AttachmentView, deleted = { id, ownerType, ownerId }),
// so we read it at dispatch time rather than mapping it statically.
export const ATTACHMENT_EVENTS = ['attachment.created', 'attachment.deleted'] as const;

// Returns the owner id to invalidate for an attachment event, or null if the event
// isn't an attachment event or the payload lacks a usable ownerId (malformed →
// ignored, never thrown — same forward-compatible stance as WS_EVENT_TAGS).
export const attachmentOwnerId = (event: string, payload: unknown): string | null => {
  if (!ATTACHMENT_EVENTS.includes(event as (typeof ATTACHMENT_EVENTS)[number])) return null;
  if (typeof payload !== 'object' || payload === null) return null;
  const ownerId = (payload as { ownerId?: unknown }).ownerId;
  return typeof ownerId === 'string' && ownerId.length > 0 ? ownerId : null;
};
