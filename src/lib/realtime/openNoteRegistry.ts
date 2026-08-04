// Which note the user currently has open, and whether it has unsaved edits.
//
// A `note.updated` for that note is the one WS event the client must sometimes
// IGNORE: invalidating 'Note' refetches the scalar, and a refetch while the user
// is mid-edit replaces the document under them — their unsaved work is gone, with
// no undo. So the editor registers itself here, and the socket consults it.
//
// Module state rather than Redux on purpose: this is transient UI bookkeeping,
// read once inside a socket callback, and putting it in the store would persist
// it and invite a re-render per keystroke.
//
// When the open note IS clean, the refetch is not just safe but desirable — it is
// the cheap conflict-avoidance path. A second tab picking up the change quietly
// usually avoids hitting the 409 at all.

type OpenNote = {
  id: string;
  isDirty: boolean;
};

let openNote: OpenNote | null = null;

export const setOpenNote = (id: string, isDirty: boolean): void => {
  openNote = { id, isDirty };
};

export const clearOpenNote = (id: string): void => {
  // Guarded by id so a late unmount from a previous note can't wipe the entry
  // the newly-mounted editor just wrote.
  if (openNote?.id === id) openNote = null;
};

// True when refetching this note would destroy unsaved local work.
export const hasUnsavedEditsFor = (noteId: string): boolean => openNote?.id === noteId && openNote.isDirty;

// Test seam — the registry is module state, so suites need a reset.
export const resetOpenNote = (): void => {
  openNote = null;
};
