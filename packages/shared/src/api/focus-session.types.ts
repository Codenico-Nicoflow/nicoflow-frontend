import type { IFocusSession } from '@nicoflow/shared/types';

export interface OpenFocusSessionRequest {
  taskId: string;
}

export type OpenFocusSessionResponse = IFocusSession;
export type CloseFocusSessionResponse = IFocusSession;

// The WS-driven live view of the user's focus session, shared across tabs.
// `seq` makes every event a distinct value so effects re-run even when two
// consecutive events carry an identical session snapshot.
export interface FocusLiveEvent {
  kind: 'started' | 'ended';
  session: IFocusSession;
  seq: number;
}
