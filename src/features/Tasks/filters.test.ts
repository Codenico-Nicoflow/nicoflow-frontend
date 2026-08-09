import { describe, expect, it } from 'vitest';

import { ScheduleFilter, TaskStatus } from '@/lib/types';
import { makeTask } from '@/mocks/handlers';

import { countTasks, defaultTaskFilter, matchesFilter, matchesScheduleFilter, TASK_FILTER } from './filters';

const scheduled = makeTask({ id: 'sched', status: TaskStatus.ACTIVE, scheduledFor: '2026-08-05' });
const unscheduled = makeTask({ id: 'open', status: TaskStatus.ACTIVE, scheduledFor: null });
const done = makeTask({ id: 'done', status: TaskStatus.DONE, scheduledFor: null });
const cancelled = makeTask({ id: 'canc', status: TaskStatus.CANCELLED, scheduledFor: null });

describe('matchesFilter', () => {
  it('lets everything through on all', () => {
    expect(matchesFilter(done, TASK_FILTER.ALL)).toBe(true);
  });

  it('matches a status filter against the task status', () => {
    expect(matchesFilter(scheduled, TASK_FILTER.ACTIVE)).toBe(true);
    expect(matchesFilter(done, TASK_FILTER.ACTIVE)).toBe(false);
  });
});

describe('matchesScheduleFilter', () => {
  it('lets everything through on all', () => {
    expect(matchesScheduleFilter(unscheduled, ScheduleFilter.ALL)).toBe(true);
  });

  it('matches scheduled against a non-null scheduledFor', () => {
    expect(matchesScheduleFilter(scheduled, ScheduleFilter.SCHEDULED)).toBe(true);
    expect(matchesScheduleFilter(unscheduled, ScheduleFilter.SCHEDULED)).toBe(false);
  });

  it('matches unscheduled against a null scheduledFor', () => {
    expect(matchesScheduleFilter(unscheduled, ScheduleFilter.UNSCHEDULED)).toBe(true);
    expect(matchesScheduleFilter(scheduled, ScheduleFilter.UNSCHEDULED)).toBe(false);
  });
});

describe('countTasks', () => {
  it('counts each status over the same list', () => {
    expect(countTasks([scheduled, unscheduled, done, cancelled])).toEqual({
      all: 4,
      active: 2,
      done: 1,
      cancelled: 1,
    });
  });
});

describe('defaultTaskFilter', () => {
  it('always opens on Active', () => {
    expect(defaultTaskFilter()).toBe(TASK_FILTER.ACTIVE);
  });
});
