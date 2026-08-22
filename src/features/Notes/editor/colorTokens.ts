// The curated palette shared by the textColor and highlight marks (NIC-1968).
// Marks store this TOKEN NAME, never a raw hex — the actual color comes from a
// `--note-text-*`/`--note-highlight-*` CSS custom property (src/index.css),
// resolved per theme at render time. That's what makes a light/dark toggle
// re-tint existing marks for free, with no JS re-render logic (AC4).
export const NOTE_COLOR_TOKENS = ['gray', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple'] as const;
export type NoteColorToken = (typeof NOTE_COLOR_TOKENS)[number];

export const isNoteColorToken = (value: unknown): value is NoteColorToken =>
  typeof value === 'string' && (NOTE_COLOR_TOKENS as readonly string[]).includes(value);
