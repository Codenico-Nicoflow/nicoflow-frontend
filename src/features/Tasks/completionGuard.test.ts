import { describe, expect, it } from 'vitest';

import { TaskStatus } from '@/lib/types';

import { needsCompletionConfirm } from './completionGuard';

describe('needsCompletionConfirm', () => {
  it('asks when completing a task that still has open subtasks', () => {
    expect(needsCompletionConfirm({ openSubtaskCount: 2 }, TaskStatus.DONE)).toBe(true);
  });

  it('does not ask when every subtask is closed', () => {
    expect(needsCompletionConfirm({ openSubtaskCount: 0 }, TaskStatus.DONE)).toBe(false);
  });

  it('does not ask for a transition that is not a completion', () => {
    expect(needsCompletionConfirm({ openSubtaskCount: 3 }, TaskStatus.ACTIVE)).toBe(false);
    expect(needsCompletionConfirm({ openSubtaskCount: 3 }, TaskStatus.SOMEDAY)).toBe(false);
    expect(needsCompletionConfirm({ openSubtaskCount: 3 }, TaskStatus.CANCELLED)).toBe(false);
  });
});
