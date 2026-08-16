import type { TiptapDoc } from '@nicoflow/shared/types';

// Capture allows 500 characters; a note title is capped at 255. Truncating on
// the client (before the field is shown, not at submit) is what lets the user
// SEE what will actually be saved instead of being 422'd afterwards.
export const NOTE_TITLE_MAX = 255;

// Only the first line, mirroring how the task path derives its title: the title
// field is a single-line input, so a multi-line capture would lose everything
// after the first newline anyway. The full text still becomes the body.
export const truncateNoteTitle = (text: string): string => (text.split('\n')[0] ?? '').trim().slice(0, NOTE_TITLE_MAX);

// The captured text becomes the body verbatim: one paragraph per line, blank
// lines dropped. An empty capture yields the same empty doc the server would
// have defaulted to, so the client never has to branch on null-vs-empty.
export const captureToDoc = (text: string): TiptapDoc => {
  const paragraphs = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => ({ type: 'paragraph', content: [{ type: 'text', text: line }] }));

  return { type: 'doc', content: paragraphs };
};
