import { useMemo, useState } from 'react';

import type { ITask } from '@nicoflow/shared/types';

export interface FocusSession {
  /** The task the user is doing right now, or null before Start / after finishing all. */
  current: ITask | null;
  /** Remaining ranked tasks below the current one. */
  upNext: ITask[];
  /** Begin a task in-place — it becomes the NOW card. Also switches when one is already running. */
  start: (taskId: string) => void;
  /** Finish the current task (caller persists status: done), then advance to the next. */
  advance: () => void;
  /** Leave the current task — end the session and return to the ranked shortlist. */
  cancel: () => void;
  /** True once the user has started at least one task this session. */
  isActive: boolean;
}

// Session state for the Focus execution loop. It layers over the server-ranked
// list: `startedId` is the NOW task; everything else is derived so the ranking
// stays the backend's source of truth. Cancel clears it back to the shortlist.
export const useFocusSession = (ranked: ITask[]): FocusSession => {
  const [startedId, setStartedId] = useState<string | null>(null);

  const { current, upNext } = useMemo(() => {
    const active = startedId ? (ranked.find(task => task.id === startedId) ?? null) : null;
    const upNext = ranked.filter(task => task.id !== active?.id);
    return { current: active, upNext };
  }, [ranked, startedId]);

  // Start on an idle session, or switch straight to another task mid-session.
  const start = (taskId: string) => setStartedId(taskId);

  // After Done, promote the top of upNext so the loop keeps flowing; null when nothing's left.
  const advance = () => setStartedId(upNext[0]?.id ?? null);

  // Not now: leave the current task and drop back to the ranked shortlist — no advance.
  const cancel = () => setStartedId(null);

  return { current, upNext, start, advance, cancel, isActive: startedId !== null };
};
