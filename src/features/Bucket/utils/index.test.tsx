import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProcessingResult } from '@/lib/types';

import { buildProcessBucketDto, canProcessBucket, handleBucketProcess, parseBucketContent } from './index';

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

describe('parseBucketContent', () => {
  it('uses the first line as title and the rest as notes', () => {
    expect(parseBucketContent('Buy milk\nfrom the corner shop\ntonight')).toEqual({
      title: 'Buy milk',
      notes: 'from the corner shop\ntonight',
    });
  });

  it('trims the title and leaves notes empty for a single line', () => {
    expect(parseBucketContent('  Just a title  ')).toEqual({ title: 'Just a title', notes: '' });
  });

  it('returns empty title/notes for empty content', () => {
    expect(parseBucketContent('')).toEqual({ title: '', notes: '' });
  });
});

describe('canProcessBucket', () => {
  it('allows TASK only when a project exists and is selected', () => {
    expect(canProcessBucket(ProcessingResult.TASK, 'p1', true)).toBe(true);
    expect(canProcessBucket(ProcessingResult.TASK, undefined, true)).toBe(false);
    expect(canProcessBucket(ProcessingResult.TASK, 'p1', false)).toBe(false);
  });

  it('always allows TRASH and never allows NOTE (not implemented)', () => {
    expect(canProcessBucket(ProcessingResult.TRASH, undefined, false)).toBe(true);
    expect(canProcessBucket(ProcessingResult.NOTE, 'p1', true)).toBe(false);
  });
});

describe('buildProcessBucketDto', () => {
  const taskData = {
    title: 'Write the launch email',
    notes: 'body',
    priority: 'high' as const,
    energy: 'medium' as const,
    rollsOver: true,
    scheduledFor: '2026-08-01',
    estimatedMinutes: 30,
    url: 'https://x.dev',
  };

  it('builds a TASK dto with projectId + mapped taskDetails', () => {
    expect(
      buildProcessBucketDto({
        bucketId: 'b1',
        selectedType: ProcessingResult.TASK,
        selectedProjectId: 'p1',
        taskData,
      })
    ).toEqual({
      processingResult: ProcessingResult.TASK,
      projectId: 'p1',
      taskDetails: {
        title: 'Write the launch email',
        notes: 'body',
        priority: 'high',
        energy: 'medium',
        rollsOver: true,
        scheduledFor: '2026-08-01',
        estimatedMinutes: 30,
        url: 'https://x.dev',
      },
    });
  });

  it('drops empty optional task fields to undefined', () => {
    const dto = buildProcessBucketDto({
      bucketId: 'b1',
      selectedType: ProcessingResult.TASK,
      selectedProjectId: 'p1',
      taskData: { ...taskData, notes: '', url: '', scheduledFor: null, estimatedMinutes: null },
    });
    expect(dto.taskDetails).toEqual({
      title: 'Write the launch email',
      notes: undefined,
      priority: 'high',
      energy: 'medium',
      rollsOver: true,
      scheduledFor: undefined,
      estimatedMinutes: undefined,
      url: undefined,
    });
  });

  it('builds a bare TRASH dto with no project/task', () => {
    expect(buildProcessBucketDto({ bucketId: 'b1', selectedType: ProcessingResult.TRASH })).toEqual({
      processingResult: ProcessingResult.TRASH,
    });
  });

  it('throws for TASK without project/taskData and for the unimplemented NOTE', () => {
    expect(() => buildProcessBucketDto({ bucketId: 'b1', selectedType: ProcessingResult.TASK })).toThrow();
    expect(() => buildProcessBucketDto({ bucketId: 'b1', selectedType: ProcessingResult.NOTE })).toThrow(
      'NOTE processing is not yet implemented'
    );
  });
});

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
