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
// NIC-1684). Modelled here so the later chat story consumes a typed union rather
// than re-deriving it; no streaming logic ships in this scaffold story.
//
//   delta — an incremental text chunk of the assistant reply
//   done  — the stream completed; carries the persisted message + fresh usage
//   error — the stream aborted; carries a typed error code (SPEC §4)
export interface AIStreamDelta {
  type: 'delta';
  text: string;
}

export interface AIStreamDone {
  type: 'done';
  message: AIMessageView;
  usage: AIUsageView;
}

export interface AIStreamError {
  type: 'error';
  code: string;
  message: string;
}

export type AIStreamEvent = AIStreamDelta | AIStreamDone | AIStreamError;
