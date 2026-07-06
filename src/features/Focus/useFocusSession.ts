import { useMemo, useState } from 'react';

import type { ITask } from '@/lib/types';

export interface FocusSession {
  /** The task the user is doing right now, or null before Start / after finishing all. */
  current: ITask | null;
  /** Remaining ranked tasks below the current one, session-skips pushed to the end. */
  upNext: ITask[];
  /** Begin a task in-place — it becomes the NOW card. */
  start: (taskId: string) => void;
  /** Finish the current task (caller persists status: done), then advance to the next. */
  advance: () => void;
  /** Skip the current task for this session only (deprioritized, not persisted), then advance. */
  skip: () => void;
  /** True once the user has started at least one task this session. */
  isActive: boolean;
}

// Session state for the Focus execution loop. It layers over the server-ranked
// list: `startedId` is the NOW task, `skipped` are tasks the user passed on this
// session (kept local — never persisted; a refetch/reload starts a clean session).
// Everything else is derived so the ranking stays the backend's source of truth.
export const useFocusSession = (ranked: ITask[]): FocusSession => {
  const [startedId, setStartedId] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);

  const { current, upNext } = useMemo(() => {
    // Drop tasks that left the ranking (completed elsewhere, refetched away).
    const present = new Set(ranked.map(task => task.id));
    const liveSkipped = skipped.filter(id => present.has(id));

    const active = startedId ? (ranked.find(task => task.id === startedId) ?? null) : null;
    const rest = ranked.filter(task => task.id !== active?.id);

    // Skipped tasks fall to the bottom but stay available — a session pass isn't a delete.
    const skippedSet = new Set(liveSkipped);
    const ordered = [...rest.filter(t => !skippedSet.has(t.id)), ...rest.filter(t => skippedSet.has(t.id))];

    return { current: active, upNext: ordered };
  }, [ranked, startedId, skipped]);

  const start = (taskId: string) => setStartedId(taskId);

  // After Done/Skip, promote the top of upNext so the loop keeps flowing without
  // making the user re-Start each time. Falls back to null when nothing's left.
  const advanceTo = (nextId: string | null) => setStartedId(nextId);

  const advance = () => advanceTo(upNext[0]?.id ?? null);

  const skip = () => {
    if (startedId) setSkipped(prev => (prev.includes(startedId) ? prev : [...prev, startedId]));
    // Next task is the first up-next that isn't the one we just skipped.
    advanceTo(upNext.find(task => task.id !== startedId)?.id ?? null);
  };

  return { current, upNext, start, advance, skip, isActive: startedId !== null };
};
