// The curated palette shared by the textColor and highlight marks (NIC-1968).
// Marks store this TOKEN NAME, never a raw hex — the actual color comes from a
// `--note-text-*`/`--note-highlight-*` CSS custom property (src/index.css),
// resolved per theme at render time. That's what makes a light/dark toggle
// re-tint existing marks for free, with no JS re-render logic (AC4).
//
// This exact set of 9 (plus "default") is dictated by the backend's allowlist
// (nicoflow-api internal/domain/note/content.go `swatchTokens`) — the server
// rejects any other value with an "unrecognized color" error. Do not add or
// rename a token here without updating the backend allowlist first.
export const NOTE_COLOR_TOKENS = [
  'gray',
  'brown',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'red',
] as const;
export type NoteColorToken = (typeof NOTE_COLOR_TOKENS)[number];

export const isNoteColorToken = (value: unknown): value is NoteColorToken =>
  typeof value === 'string' && (NOTE_COLOR_TOKENS as readonly string[]).includes(value);
