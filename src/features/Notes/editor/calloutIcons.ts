// The fixed icon set a callout can carry (NIC-1969). Not a free-form emoji
// picker — a small, curated allowlist, same posture as the color palette
// (colorTokens.ts): the node stores this NAME, never a raw glyph, so the
// renderer is always drawing an icon it knows about.
export const NOTE_CALLOUT_ICONS = ['info', 'warning', 'success', 'idea', 'star', 'note', 'flag', 'question'] as const;
export type NoteCalloutIcon = (typeof NOTE_CALLOUT_ICONS)[number];

export const isNoteCalloutIcon = (value: unknown): value is NoteCalloutIcon =>
  typeof value === 'string' && (NOTE_CALLOUT_ICONS as readonly string[]).includes(value);
