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

export type AIStreamEvent = AIStreamDelta | AIStreamDone | AIStreamError;
