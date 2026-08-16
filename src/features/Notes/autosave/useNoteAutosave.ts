import { useCallback, useEffect, useRef, useState } from 'react';

import type { ApiErrorBody, TiptapDoc } from '@nicoflow/shared/types';

import { useUpdateNoteMutation } from '@/lib/store';

import type { SaveStatusValue } from './types';
import { AUTOSAVE_DEBOUNCE_MS, SaveStatus } from './types';

export interface NoteDraft {
  title?: string;
  content?: TiptapDoc;
}

export interface UseNoteAutosaveOptions {
  noteId: string;
  /** The version last read from the server. Adopted from every successful save. */
  initialVersion: number;
  debounceMs?: number;
}

export interface UseNoteAutosaveResult {
  status: SaveStatusValue;
  version: number;
  /** True once a 409 has been seen. Terminal — autosave never resumes. */
  isConflicted: boolean;
  /** Queue a debounced save. A no-op once conflicted. */
  save: (draft: NoteDraft) => void;
  /** Send any pending edit immediately (navigation, explicit save). */
  flush: () => void;
}

// Owns the whole save lifecycle for one note: debounce, the optimistic-concurrency
// version, an honest status, and the terminal conflict state.
//
// The failure this exists to prevent: a stale editor that keeps autosaving hits
// 409 every ~1.5s forever, and a retry that ignores the conflict overwrites
// another session's work with an older document. There is no undo. So a 409 is
// TERMINAL here — not a retry with backoff, not a merge. Recovery is the user
// choosing to reload, which is the page's job, not the hook's.
export const useNoteAutosave = ({
  noteId,
  initialVersion,
  debounceMs = AUTOSAVE_DEBOUNCE_MS,
}: UseNoteAutosaveOptions): UseNoteAutosaveResult => {
  const [updateNote] = useUpdateNoteMutation();
  const [status, setStatus] = useState<SaveStatusValue>(SaveStatus.IDLE);
  const [version, setVersion] = useState(initialVersion);

  // Refs, not state: the debounce callback closes over these, and a stale
  // closure here would send an old version and manufacture the very conflict
  // this hook exists to avoid.
  const versionRef = useRef(initialVersion);
  const pendingRef = useRef<NoteDraft | null>(null);
  const conflictedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);

  // The unmount flush deliberately starts a request on the way out, so its
  // response lands after this component is gone. Writing status/version then is
  // a state update on an unmounted tree — in tests it resolves after the
  // environment is torn down and fails the run outright.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // A different note means a different document and version line; carrying the
  // old one over would PATCH the new note with the previous note's version.
  useEffect(() => {
    versionRef.current = initialVersion;
    setVersion(initialVersion);
    conflictedRef.current = false;
    pendingRef.current = null;
    setStatus(SaveStatus.IDLE);
  }, [noteId, initialVersion]);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const send = useCallback(async () => {
    if (conflictedRef.current) return;

    const draft = pendingRef.current;
    if (!draft) return;

    // Claim the work before awaiting, so a flush racing the timer can't send
    // the same edit twice and burn a version.
    pendingRef.current = null;
    inFlightRef.current = true;
    if (isMountedRef.current) setStatus(SaveStatus.SAVING);

    try {
      const saved = await updateNote({ id: noteId, version: versionRef.current, ...draft }).unwrap();

      versionRef.current = saved.version;
      if (!isMountedRef.current) return;

      setVersion(saved.version);
      // Only report success from a resolved response — never optimistically.
      // If more edits arrived while this was in flight, we're already dirty again.
      setStatus(pendingRef.current ? SaveStatus.UNSAVED : SaveStatus.SAVED);
    } catch (error) {
      const code = (error as ApiErrorBody | undefined)?.code;

      if (code === 'CONFLICT') {
        // Terminal. Drop the pending edit so nothing can flush it later, and
        // keep the local document intact for the user to copy out of.
        conflictedRef.current = true;
        pendingRef.current = null;
        clearTimer();
        if (isMountedRef.current) setStatus(SaveStatus.CONFLICT);
      } else {
        // Retryable: 422 oversize, network. Put the edit back so the next
        // keystroke's debounce picks it up rather than losing it.
        pendingRef.current = draft;
        if (isMountedRef.current) setStatus(SaveStatus.ERROR);
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [noteId, updateNote]);

  const save = useCallback(
    (draft: NoteDraft) => {
      if (conflictedRef.current) return;

      pendingRef.current = { ...pendingRef.current, ...draft };
      // Conditional so ordinary typing re-renders once on the idle→unsaved edge
      // rather than on every keystroke.
      setStatus(current => (current === SaveStatus.UNSAVED ? current : SaveStatus.UNSAVED));

      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void send();
      }, debounceMs);
    },
    [debounceMs, send]
  );

  const flush = useCallback(() => {
    clearTimer();
    if (conflictedRef.current || inFlightRef.current || !pendingRef.current) return;
    void send();
  }, [send]);

  // Flush on unmount/navigate so the last edit inside the debounce window isn't
  // dropped. Reads refs only — depending on `flush` would re-run this on every
  // identity change and flush mid-session.
  useEffect(
    () => () => {
      clearTimer();
      if (conflictedRef.current || inFlightRef.current || !pendingRef.current) return;
      void send();
    },
    [send]
  );

  return {
    status,
    version,
    isConflicted: status === SaveStatus.CONFLICT,
    save,
    flush,
  };
};
