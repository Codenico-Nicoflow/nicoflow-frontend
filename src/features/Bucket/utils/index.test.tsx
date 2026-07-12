import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProcessingResult } from '@/lib/types';

import { handleBucketProcess } from './index';

// vi.mock is hoisted above the imports, so `toast` resolves to the mock.
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const baseArgs = {
  bucketId: 'bucket-1',
  selectedProjectId: 'project-1',
  taskData: {
    title: 'Write the launch email',
    notes: '',
    priority: 'low' as const,
    energy: 'medium' as const,
    rollsOver: true,
    scheduledFor: null,
    estimatedMinutes: null,
    url: '',
  },
};

describe('handleBucketProcess', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fires exactly one success toast when processing to a task (NIC-1459 regression)', async () => {
    const onSuccess = vi.fn();

    await handleBucketProcess({
      ...baseArgs,
      selectedType: ProcessingResult.TASK,
      processBucketMutation: vi.fn().mockResolvedValue({}),
      onSuccess,
    });

    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('fires exactly one success toast when trashing', async () => {
    await handleBucketProcess({
      ...baseArgs,
      selectedType: ProcessingResult.TRASH,
      processBucketMutation: vi.fn().mockResolvedValue({}),
      onSuccess: vi.fn(),
    });

    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it('fires one error toast and rethrows when the mutation fails', async () => {
    const onSuccess = vi.fn();

    await expect(
      handleBucketProcess({
        ...baseArgs,
        selectedType: ProcessingResult.TASK,
        processBucketMutation: vi.fn().mockRejectedValue(new Error('boom')),
        onSuccess,
      })
    ).rejects.toThrow();

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.success).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
