import { describe, expect, it } from 'vitest';

import { captureToDoc, NOTE_TITLE_MAX, truncateNoteTitle } from './noteDraft';

describe('truncateNoteTitle', () => {
  it('leaves a short capture untouched', () => {
    expect(truncateNoteTitle('Call the dentist')).toBe('Call the dentist');
  });

  it('trims surrounding whitespace', () => {
    expect(truncateNoteTitle('  padded  ')).toBe('padded');
  });

  // The title field is a single-line input, so anything after the first newline
  // would be dropped silently. It still survives in the body.
  it('takes only the first line of a multi-line capture', () => {
    expect(truncateNoteTitle('Research pricing\nCompare three vendors')).toBe('Research pricing');
  });

  // Capture allows 500 characters, a note title caps at 255 — truncating on the
  // client is what lets the user see what will be saved instead of a later 422.
  it('cuts a 400-character capture down to the 255-character cap', () => {
    const long = 'x'.repeat(400);

    const result = truncateNoteTitle(long);

    expect(result).toHaveLength(NOTE_TITLE_MAX);
    expect(NOTE_TITLE_MAX).toBe(255);
  });

  it('keeps a capture that lands exactly on the cap', () => {
    expect(truncateNoteTitle('y'.repeat(255))).toHaveLength(255);
  });
});

describe('captureToDoc', () => {
  it('turns a single line into one paragraph', () => {
    expect(captureToDoc('one line')).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one line' }] }],
    });
  });

  it('turns each line into its own paragraph and drops blank ones', () => {
    const doc = captureToDoc('first\n\nsecond\n   \nthird');

    expect(doc.content).toHaveLength(3);
    expect(doc.content?.[1]).toEqual({ type: 'paragraph', content: [{ type: 'text', text: 'second' }] });
  });

  // Matches the server's NOT NULL empty-doc default, so the client never has to
  // branch on null-vs-empty.
  it('produces the empty doc for an empty capture', () => {
    expect(captureToDoc('   ')).toEqual({ type: 'doc', content: [] });
  });
});
