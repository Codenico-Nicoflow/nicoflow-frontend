import { describe, expect, it } from 'vitest';

import { TaskStatus } from '@/lib/types';
import { makeTask } from '@/mocks/handlers';

import { countTasks, defaultTaskFilter, isUnscheduled, matchesFilter, TASK_FILTER } from './filters';

const scheduled = makeTask({ id: 'sched', status: TaskStatus.ACTIVE, scheduledFor: '2026-08-05' });
const openUnscheduled = makeTask({ id: 'open', status: TaskStatus.ACTIVE, scheduledFor: null });
const inbox = makeTask({ id: 'in', status: TaskStatus.INBOX, scheduledFor: null });
const someday = makeTask({ id: 'some', status: TaskStatus.SOMEDAY, scheduledFor: null });
const done = makeTask({ id: 'done', status: TaskStatus.DONE, scheduledFor: null });
const cancelled = makeTask({ id: 'canc', status: TaskStatus.CANCELLED, scheduledFor: null });

describe('isUnscheduled', () => {
  it('is true for an open task with no scheduledFor', () => {
    expect(isUnscheduled(openUnscheduled)).toBe(true);
    expect(isUnscheduled(inbox)).toBe(true);
    expect(isUnscheduled(someday)).toBe(true);
  });

  it('is false once the task carries a date', () => {
    expect(isUnscheduled(scheduled)).toBe(false);
  });

  // A finished task never needs a date, so it must not pad the worklist.
  it('excludes done and cancelled tasks even without a date', () => {
    expect(isUnscheduled(done)).toBe(false);
    expect(isUnscheduled(cancelled)).toBe(false);
  });
});

describe('matchesFilter', () => {
  it('lets everything through on all', () => {
    expect(matchesFilter(done, TASK_FILTER.ALL)).toBe(true);
  });

  it('matches a status filter against the task status', () => {
    expect(matchesFilter(inbox, TASK_FILTER.INBOX)).toBe(true);
    expect(matchesFilter(openUnscheduled, TASK_FILTER.INBOX)).toBe(false);
  });

  it('applies the unscheduled predicate rather than a status compare', () => {
    expect(matchesFilter(openUnscheduled, TASK_FILTER.UNSCHEDULED)).toBe(true);
    expect(matchesFilter(scheduled, TASK_FILTER.UNSCHEDULED)).toBe(false);
    expect(matchesFilter(done, TASK_FILTER.UNSCHEDULED)).toBe(false);
  });
});

describe('countTasks', () => {
  it('counts each lens over the same list', () => {
    expect(countTasks([scheduled, openUnscheduled, inbox, someday, done, cancelled])).toEqual({
      all: 6,
      inbox: 1,
      unscheduled: 3,
      active: 2,
      someday: 1,
      done: 1,
      cancelled: 1,
    });
  });

  it('counts a task under both its status and unscheduled', () => {
    const counts = countTasks([inbox]);
    expect(counts.inbox).toBe(1);
    expect(counts.unscheduled).toBe(1);
  });
});

describe('defaultTaskFilter', () => {
  it('opens on inbox when the project has unprocessed tasks', () => {
    expect(defaultTaskFilter(countTasks([inbox, scheduled]))).toBe(TASK_FILTER.INBOX);
  });

  it('falls back to all when the inbox is empty', () => {
    expect(defaultTaskFilter(countTasks([scheduled, done]))).toBe(TASK_FILTER.ALL);
  });

  it('falls back to all for an empty project', () => {
    expect(defaultTaskFilter(countTasks([]))).toBe(TASK_FILTER.ALL);
  });
});
