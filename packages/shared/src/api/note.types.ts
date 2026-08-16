import type { INote, TiptapDoc } from '@nicoflow/shared/types';

// GET /notes?projectId= — projectId is required by the API (422 without it).
export type ListNotesRequest = {
  projectId: string;
};

// Paginated list response for GET /notes (keyset on (updated_at, id) DESC).
export type ListNotesPage = {
  items: INote[];
  nextCursor: string;
};

// POST /notes. `content` is optional: omitted ⇒ the server's empty-doc default.
// `contentText` is never sent — the server derives the search mirror itself, and
// sending it is a 422.
export type CreateNoteRequest = {
  projectId: string;
  title: string;
  content?: TiptapDoc;
};

// PATCH /notes/:id. Partial in title/content, but `version` is REQUIRED —
// it is the optimistic-concurrency check, and a stale one returns 409 CONFLICT
// having written nothing. Non-optional here so the type system enforces what the
// server does.
export type UpdateNoteRequest = {
  id: string;
  version: number;
  title?: string;
  content?: TiptapDoc;
};
