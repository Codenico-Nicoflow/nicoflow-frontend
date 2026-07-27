import type { AISessionDetailView, AISessionView, AIUsageView } from '@/features/AI/types';

// create body — title optional; empty falls back to the backend default.
export type CreateAISessionRequest = {
  title?: string;
};

export type CreateAISessionResponse = AISessionView;

export type GetAISessionsResponse = AISessionView[];

// GET /ai/sessions/:id → session + its message history.
export type GetAISessionResponse = AISessionDetailView;

export type GetAIUsageResponse = AIUsageView;
