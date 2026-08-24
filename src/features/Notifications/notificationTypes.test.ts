import { describe, expect, it } from 'vitest';

import { categoryForType, NotificationCategory, styleForCategory } from './notificationTypes';

describe('categoryForType', () => {
  it.each([
    ['task_due_soon', NotificationCategory.REMINDER],
    ['task_overdue', NotificationCategory.REMINDER],
    ['task_scheduled_today', NotificationCategory.REMINDER],
    ['day_plan_nudge', NotificationCategory.REMINDER],
    ['inbox_unprocessed', NotificationCategory.REMINDER],
    ['inbox_stale', NotificationCategory.REMINDER],
    ['daily_summary', NotificationCategory.SUMMARY],
    ['task_completed', NotificationCategory.CELEBRATION],
    ['project_completed', NotificationCategory.CELEBRATION],
    ['inbox_zero', NotificationCategory.CELEBRATION],
    ['streak_milestone', NotificationCategory.CELEBRATION],
    ['system_announcement', NotificationCategory.SYSTEM],
  ])('%s → %s', (type, expected) => {
    expect(categoryForType(type)).toBe(expected);
  });

  it('unknown type falls back to system', () => {
    expect(categoryForType('unknown_future_type')).toBe(NotificationCategory.SYSTEM);
    expect(categoryForType('')).toBe(NotificationCategory.SYSTEM);
  });
});

describe('styleForCategory', () => {
  it('returns a style object with iconBg, iconText, accent for every category', () => {
    for (const cat of Object.values(NotificationCategory)) {
      const style = styleForCategory(cat);
      expect(style.iconBg).toBeTruthy();
      expect(style.iconText).toBeTruthy();
      expect(style.accent).toBeTruthy();
    }
  });
});
