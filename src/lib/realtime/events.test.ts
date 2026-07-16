import { describe, expect, it } from 'vitest';

import { WS_EVENT_TAGS } from './events';

describe('WS_EVENT_TAGS', () => {
  it('maps notification.created to the notification list + count tags', () => {
    expect(WS_EVENT_TAGS['notification.created']).toEqual(['Notification', 'NotificationCount']);
  });

  it('maps task and bucket events to their tags', () => {
    expect(WS_EVENT_TAGS['task.status_changed']).toEqual(['Task']);
    expect(WS_EVENT_TAGS['bucket.processed']).toEqual(['Bucket']);
  });

  it('has no entry for an unknown event (ignored, not thrown)', () => {
    expect(WS_EVENT_TAGS['something.new']).toBeUndefined();
  });
});
