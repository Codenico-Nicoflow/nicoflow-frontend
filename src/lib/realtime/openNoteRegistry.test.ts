import { beforeEach, describe, expect, it } from 'vitest';

import { shouldSkipNoteRefetch } from './events';
import { clearOpenNote, hasUnsavedEditsFor, resetOpenNote, setOpenNote } from './openNoteRegistry';

beforeEach(() => {
  resetOpenNote();
});

describe('openNoteRegistry', () => {
  it('reports no unsaved edits when nothing is open', () => {
    expect(hasUnsavedEditsFor('n1')).toBe(false);
  });

  it('reports unsaved edits only for the open, dirty note', () => {
    setOpenNote('n1', true);

    expect(hasUnsavedEditsFor('n1')).toBe(true);
    expect(hasUnsavedEditsFor('n2')).toBe(false);
  });

  it('reports no unsaved edits for an open but clean note', () => {
    setOpenNote('n1', false);

    expect(hasUnsavedEditsFor('n1')).toBe(false);
  });

  it('clears the entry on close', () => {
    setOpenNote('n1', true);
    clearOpenNote('n1');

    expect(hasUnsavedEditsFor('n1')).toBe(false);
  });

  // Navigating between notes unmounts the old editor after the new one mounts,
  // so an unguarded clear would wipe the entry the new editor just wrote.
  it('ignores a stale close from a previously open note', () => {
    setOpenNote('n1', true);
    setOpenNote('n2', true);
    clearOpenNote('n1');

    expect(hasUnsavedEditsFor('n2')).toBe(true);
  });
});

describe('shouldSkipNoteRefetch', () => {
  it('skips a note.updated for the open note with unsaved edits', () => {
    setOpenNote('n1', true);

    expect(shouldSkipNoteRefetch('note.updated', { id: 'n1' }, hasUnsavedEditsFor)).toBe(true);
  });

  // The clean case is the cheap conflict-avoidance path: refetching quietly is
  // what usually stops the other tab from ever hitting a 409.
  it('does not skip when the open note is clean', () => {
    setOpenNote('n1', false);

    expect(shouldSkipNoteRefetch('note.updated', { id: 'n1' }, hasUnsavedEditsFor)).toBe(false);
  });

  it('does not skip an event about a different note', () => {
    setOpenNote('n1', true);

    expect(shouldSkipNoteRefetch('note.updated', { id: 'n2' }, hasUnsavedEditsFor)).toBe(false);
  });

  // created/deleted can't clobber an in-progress edit, so they never skip.
  it.each(['note.created', 'note.deleted'])('never skips %s', event => {
    setOpenNote('n1', true);

    expect(shouldSkipNoteRefetch(event, { id: 'n1' }, hasUnsavedEditsFor)).toBe(false);
  });

  it.each([null, undefined, 'string', {}, { id: '' }, { id: 7 }])(
    'treats a malformed payload (%s) as not skippable rather than throwing',
    payload => {
      setOpenNote('n1', true);

      expect(shouldSkipNoteRefetch('note.updated', payload, hasUnsavedEditsFor)).toBe(false);
    }
  );
});
