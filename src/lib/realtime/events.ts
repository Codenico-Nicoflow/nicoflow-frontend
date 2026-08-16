// The server-pushed WebSocket envelope (matches SPEC §3.14 / nicoflow-api ws.Event).
// Payloads are full resources; we deliberately don't type each one — the client
// reacts by invalidating RTK Query tags and refetching, never by patching cache
// from the payload, so the exact payload shape doesn't matter here.
import type { IFocusSession } from '@nicoflow/shared/types';

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
  // An item processed into a note creates one, so the notes list moves too.
  'bucket.processed': ['Bucket', 'Note'],
  'bucket.deleted': ['Bucket'],
  // Note events (E-054) also invalidate Search — results embed notes. The
  // payload is the LIST shape (NoteView, no content) on created/updated and
  // { id } on deleted, so nothing here ever reads a document body from an
  // event; a view that needs the body refetches the scalar.
  'note.created': ['Note', 'Search'],
  'note.updated': ['Note', 'Search'],
  'note.deleted': ['Note', 'Search'],
  // Habit events (E-055). checked_in is here for the same reason it carries a
  // full payload server-side: the write recomputes the streak AND can drop the
  // habit out of the Today feed once a weekly quota is met, so a second tab has
  // to refetch both views rather than just the row it touched.
  'habit.created': ['Habit'],
  'habit.updated': ['Habit'],
  'habit.deleted': ['Habit'],
  'habit.checked_in': ['Habit'],
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
  // A closed segment changes the task's totalFocusSeconds, which the Focus list
  // carries (E-049/NIC-1712) — refetch it so the cumulative display refreshes.
  // session_started changes no derived data (the prior segment's close emits its
  // own ended event), so it has no tag entry; both events also feed the timer
  // hook through focusSessionEvent below.
  'focus.session_ended': ['Focus'],
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

// Focus session events are the second payload-dependent case: the timer hook
// needs the SessionView itself (which session started/ended, and its measured
// duration) to stop a zombie tick or credit a closed segment — a tag refetch
// alone can't say "this tab's segment is over". Malformed payloads are ignored,
// never thrown, same stance as above.
export const focusSessionEvent = (
  event: string,
  payload: unknown
): { kind: 'started' | 'ended'; session: IFocusSession } | null => {
  const kind = event === 'focus.session_started' ? 'started' : event === 'focus.session_ended' ? 'ended' : null;
  if (!kind) return null;
  if (typeof payload !== 'object' || payload === null) return null;
  const session = payload as IFocusSession;
  if (typeof session.id !== 'string' || session.id.length === 0) return null;
  if (typeof session.taskId !== 'string' || session.taskId.length === 0) return null;
  return { kind, session };
};

// A note.updated naming the note the user has open, WITH unsaved edits, is the
// one event the client must not act on: invalidating 'Note' refetches the scalar
// and replaces the document mid-edit, destroying work with no undo. The
// version/409 path is the backstop for that case.
//
// Clean open note, or an event about any other note, falls through and
// invalidates normally — that quiet refetch is what usually avoids the 409.
// Only the SCALAR is at risk, so 'Search' still invalidates either way (see the
// caller); this predicate is about the note body alone.
export const shouldSkipNoteRefetch = (
  event: string,
  payload: unknown,
  hasUnsavedEdits: (noteId: string) => boolean
): boolean => {
  if (event !== 'note.updated') return false;
  if (typeof payload !== 'object' || payload === null) return false;
  const id = (payload as { id?: unknown }).id;
  if (typeof id !== 'string' || id.length === 0) return false;
  return hasUnsavedEdits(id);
};
