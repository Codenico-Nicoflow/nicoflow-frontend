// Streaming/UI-side AI types that stay web-local (SSE parsing, local proposal
// tracking). The wire view types (AIMessageView, AISessionView, AIUsageView,
// AIPendingToolCall, AIToolName, …) moved to @nicoflow/shared/api under
// NIC-1936 — re-exported here for callers that still import from this module.
import type { AIToolName as SharedAIToolName, AIUsageView } from '@nicoflow/shared/api';

export type {
  AIMessageRole,
  AIMessageView,
  AIPendingToolCall,
  AISessionDetailView,
  AISessionView,
  AIUsageScope,
  AIUsageView,
} from '@nicoflow/shared/api';

// NIC-1998: 11 new tool names added by the backend. Extended here locally until
// the next @nicoflow/shared release picks them up into the union.
export type NewAIToolName =
  | 'setup_recurring_task'
  | 'adjust_recurring_task'
  | 'pause_recurring_task'
  | 'end_recurring_series'
  | 'create_note'
  | 'create_area'
  | 'create_project'
  | 'update_project'
  | 'add_subtask'
  | 'complete_subtask'
  | 'process_bucket_item';

export type AIToolName = SharedAIToolName | NewAIToolName;

// Streaming send-message events (POST /ai/sessions/:id/messages, SSE over POST —
// NIC-1684). Each SSE frame is a `data: <json>` line; exactly one terminal event
// (done | error) closes a stream. Shapes mirror the backend sink 1:1 (ai domain
// deltaEvent / doneEvent / errorEvent) — do NOT add fields the wire doesn't send.
//
//   delta — an incremental text chunk of the assistant reply
//   done  — the stream completed; carries the persisted message id + fresh usage
//   error — a mid-stream failure (status already committed); carries a §4 code
export interface AIStreamDelta {
  type: 'delta';
  text: string;
}

export interface AIStreamDone {
  type: 'done';
  messageId: string;
  usage: AIUsageView;
}

export interface AIStreamError {
  type: 'error';
  code: string;
}

// Sent when Claude wants to perform a write action but has NOT executed it.
// The stream ends after this frame — no `done` follows in the same turn.
export interface AIStreamToolProposal {
  type: 'tool_proposal';
  toolUseId: string;
  toolName: AIToolName;
  input: unknown;
  assistantMessageId: string;
}

export type AIStreamEvent = AIStreamDelta | AIStreamDone | AIStreamError | AIStreamToolProposal;

// Status values for a tool proposal turn.
export type ToolProposalStatus = 'pending_confirm' | 'executing' | 'done' | 'rejected' | 'error';

// A locally-tracked tool proposal turn (lives in useAIStream.pending alongside
// regular PendingMessage turns). Discriminated by kind === 'tool_proposal'.
export interface PendingToolProposal {
  kind: 'tool_proposal';
  id: string; // toolUseId
  role: 'assistant';
  createdAt: string;
  status: ToolProposalStatus;
  tool: {
    name: AIToolName;
    input: unknown;
    assistantMessageId: string;
  };
  // Set when status === 'error'. The 'already_resolved' value is a distinct
  // terminal: a 409 CONFLICT means another client already acted, so the card
  // shows a non-retryable "Already resolved" state instead of a generic error.
  errorMessage?: string;
  alreadyResolved?: boolean;
}
