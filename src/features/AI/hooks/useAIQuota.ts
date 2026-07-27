import { useMemo } from 'react';

import { useGetAIUsageQuery } from '@/lib/store';
import { getApiErrorCode } from '@/lib/utils';

import type { QuotaStatus } from '../quota';
import { deriveQuota, isFeatureDisabled } from '../quota';

export interface AIQuota {
  quota: QuotaStatus | undefined;
  isLoading: boolean;
  // True when the assistant is switched off server-side (AI_UNAVAILABLE) — the
  // caller renders the feature-disabled banner instead of the chat.
  featureDisabled: boolean;
}

// Reads GET /ai/usage once and derives the render decision. Deliberately NO
// pollingInterval: fresh usage arrives on every stream `done` event, which
// useAIStream writes straight into this same cache entry via upsertQueryData —
// so every consumer of this hook re-renders with no extra request.
//
// Both the shell footer and the chat call this; RTK Query dedupes them onto one
// cache entry ('getAIUsage', undefined), so it is still a single network read.
export const useAIQuota = (): AIQuota => {
  const { data, error, isLoading } = useGetAIUsageQuery();

  const quota = useMemo(() => deriveQuota(data), [data]);

  return {
    quota,
    isLoading,
    featureDisabled: isFeatureDisabled(getApiErrorCode(error)),
  };
};
