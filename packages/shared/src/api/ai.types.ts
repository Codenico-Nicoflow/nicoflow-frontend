// AI-assistant wire types. Kept import-clean and framework-agnostic (no DOM /
// RTK imports) so they survive the E-033 shared-package extraction.
// All IDs are strings — the backend uses application-generated string PKs.
// Source of truth: E-026 backend (ai domain: SessionView / MessageView / UsageView) + SPEC §3.

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

// The set of tool names the AI can propose.
export type AIToolName = 'complete_task' | 'reschedule_task' | 'create_task';

// A pending tool proposal returned by GET /ai/sessions/:id/tool-calls?status=pending
// (for rehydrating proposals after a page reload). `id` is the DB row's primary
// key — NOT the identity used to confirm/reject. Confirm/reject and dedup against
// live-streamed proposals must key off `toolUseId`.
export interface AIPendingToolCall {
  id: string;
  toolUseId: string;
  toolName: AIToolName;
  input: unknown;
  assistantMessageId: string;
  createdAt: string;
}

// create body — title optional; empty falls back to the backend default.
export type CreateAISessionRequest = {
  title?: string;
};

export type CreateAISessionResponse = AISessionView;

export type GetAISessionsResponse = AISessionView[];

// GET /ai/sessions/:id → session + its full message history + a cursor seed for
// history older than the initial 50 messages (empty string when ≤50 messages total).
export type GetAISessionResponse = AISessionDetailView & { messagesCursor: string };

export type GetAIUsageResponse = AIUsageView;

export type ListPendingToolCallsResponse = AIPendingToolCall[];

// GET /ai/sessions/:id/messages — paginated older history (oldest→newest ASC).
// Only ever loads in the "previous" direction (load-older-on-scroll-up), so this
// endpoint uses getPreviousPageParam, not getNextPageParam.
export type GetSessionMessagesPage = {
  items: AIMessageView[];
  nextCursor: string;
};

// Combined query arg: sessionId identifies the cache entry; seedCursor seeds the
// first fetch of older history from the session-detail's messagesCursor field.
export type GetSessionMessagesRequest = {
  sessionId: string;
  seedCursor: string;
};
