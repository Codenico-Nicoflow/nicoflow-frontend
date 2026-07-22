import { describe, expect, it } from 'vitest';

import { WS_EVENT_TAGS } from './events';

const TASK_TAGS = ['Task', 'Focus', 'TimeSpread'];

describe('WS_EVENT_TAGS', () => {
  it('maps notification.created to the notification list + count tags', () => {
    expect(WS_EVENT_TAGS['notification.created']).toEqual(['Notification', 'NotificationCount']);
  });

  it('maps every task event to the family + Focus + TimeSpread', () => {
    for (const event of ['task.created', 'task.updated', 'task.deleted', 'task.status_changed']) {
      expect(WS_EVENT_TAGS[event]).toEqual(TASK_TAGS);
    }
  });

  it('maps every project event to Project + Area (the board nests projects)', () => {
    for (const event of ['project.created', 'project.updated', 'project.deleted']) {
      expect(WS_EVENT_TAGS[event]).toEqual(['Project', 'Area']);
    }
  });

  it('maps every area event to Area', () => {
    for (const event of ['area.created', 'area.updated', 'area.deleted']) {
      expect(WS_EVENT_TAGS[event]).toEqual(['Area']);
    }
  });

  it('maps every bucket event to Bucket', () => {
    for (const event of ['bucket.created', 'bucket.processed', 'bucket.deleted']) {
      expect(WS_EVENT_TAGS[event]).toEqual(['Bucket']);
    }
  });

  it('has no entry for an unknown event (ignored, not thrown)', () => {
    expect(WS_EVENT_TAGS['something.new']).toBeUndefined();
  });
});
