import type {
  AIMessageView,
  AIPendingToolCall,
  AISessionDetailView,
  AISessionView,
  AIUsageView,
} from '@/features/AI/types';

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
