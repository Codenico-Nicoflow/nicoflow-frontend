// AI-assistant wire types. Kept import-clean and framework-agnostic (no DOM /
// RTK imports) so they survive the E-033 shared-package extraction. All IDs are
// strings — the backend uses application-generated string PKs. Source of truth:
// E-026 backend (ai domain: SessionView / MessageView / UsageView) + SPEC §3.

export type AIMessageRole = 'user' | 'assistant';

// One persisted turn of a conversation (GET /ai/sessions/:id → messages[]).
export interface AIMessageView {
  id: string;
  role: AIMessageRole;
  content: string;
  createdAt: string;
}

// A conversation as returned by list/create (GET|POST /ai/sessions).
export interface AISessionView {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

// A session plus its full message history (GET /ai/sessions/:id).
export interface AISessionDetailView extends AISessionView {
  messages: AIMessageView[];
}

// Quota state (GET /ai/usage). Free plans report scope "lifetime" with month
// null; Pro reports "month" with month "YYYY-MM".
export type AIUsageScope = 'month' | 'lifetime';

export interface AIUsageView {
  used: number;
  limit: number;
  scope: AIUsageScope;
  month: string | null;
}

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
  toolName: 'complete_task' | 'reschedule_task' | 'create_task';
  input: unknown;
  assistantMessageId: string;
}

export type AIStreamEvent = AIStreamDelta | AIStreamDone | AIStreamError | AIStreamToolProposal;

// The set of tool names the AI can propose.
export type AIToolName = AIStreamToolProposal['toolName'];

// A pending tool proposal returned by GET /ai/sessions/:id/tool-calls?status=pending
// (for rehydrating proposals after a page reload).
export interface AIPendingToolCall {
  id: string; // toolUseId
  toolName: AIToolName;
  input: unknown;
  assistantMessageId: string;
  createdAt: string;
}

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
