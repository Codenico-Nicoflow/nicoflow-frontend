import { describe, expect, it } from 'vitest';

import { attachmentOwnerId, focusSessionEvent, WS_EVENT_TAGS } from './events';

const TASK_TAGS = ['Task', 'Focus', 'TimeSpread', 'Subtask', 'Search'];

describe('WS_EVENT_TAGS', () => {
  it('maps notification.created to the notification list + count tags', () => {
    expect(WS_EVENT_TAGS['notification.created']).toEqual(['Notification', 'NotificationCount']);
  });

  it('maps every task event to the family + Focus + TimeSpread + Subtask + Search', () => {
    for (const event of ['task.created', 'task.updated', 'task.deleted', 'task.status_changed']) {
      expect(WS_EVENT_TAGS[event]).toEqual(TASK_TAGS);
    }
  });

  it('maps every project event to Project + Area + Search (the board nests projects)', () => {
    for (const event of ['project.created', 'project.updated', 'project.deleted']) {
      expect(WS_EVENT_TAGS[event]).toEqual(['Project', 'Area', 'Search']);
    }
  });

  it('maps every area event to Area + Search', () => {
    for (const event of ['area.created', 'area.updated', 'area.deleted']) {
      expect(WS_EVENT_TAGS[event]).toEqual(['Area', 'Search']);
    }
  });

  it('maps every bucket event to Bucket', () => {
    for (const event of ['bucket.created', 'bucket.processed', 'bucket.deleted']) {
      expect(WS_EVENT_TAGS[event]).toEqual(['Bucket']);
    }
  });

  it('maps ai.session.updated to AISession (whole family — the title reorders the list)', () => {
    expect(WS_EVENT_TAGS['ai.session.updated']).toEqual(['AISession']);
  });

  it('has no entry for an unknown event (ignored, not thrown)', () => {
    expect(WS_EVENT_TAGS['something.new']).toBeUndefined();
  });

  it('has no flat-tag entry for attachment events (they invalidate per owner)', () => {
    expect(WS_EVENT_TAGS['attachment.created']).toBeUndefined();
    expect(WS_EVENT_TAGS['attachment.deleted']).toBeUndefined();
  });
});

describe('attachmentOwnerId', () => {
  it('reads ownerId from a created (full AttachmentView) payload', () => {
    const payload = { id: 'a1', ownerType: 'task', ownerId: 'task-9', fileName: 'x.pdf' };
    expect(attachmentOwnerId('attachment.created', payload)).toBe('task-9');
  });

  it('reads ownerId from a deleted ({ id, ownerType, ownerId }) payload', () => {
    expect(attachmentOwnerId('attachment.deleted', { id: 'a1', ownerType: 'task', ownerId: 'task-9' })).toBe('task-9');
  });

  it('returns null for a non-attachment event', () => {
    expect(attachmentOwnerId('task.updated', { ownerId: 'task-9' })).toBeNull();
  });

  it('returns null for a malformed payload (missing/empty/non-string ownerId)', () => {
    expect(attachmentOwnerId('attachment.created', {})).toBeNull();
    expect(attachmentOwnerId('attachment.created', { ownerId: '' })).toBeNull();
    expect(attachmentOwnerId('attachment.created', { ownerId: 123 })).toBeNull();
    expect(attachmentOwnerId('attachment.created', null)).toBeNull();
  });
});

describe('focusSessionEvent', () => {
  const session = {
    id: 'sess-1',
    taskId: 'task-9',
    startedAt: '2026-07-29T10:00:00Z',
    endedAt: null,
    lastSeen: '2026-07-29T10:00:30Z',
    durationSeconds: 0,
  };

  it('parses focus.session_started into a started event', () => {
    expect(focusSessionEvent('focus.session_started', session)).toEqual({ kind: 'started', session });
  });

  it('parses focus.session_ended into an ended event', () => {
    const ended = { ...session, endedAt: '2026-07-29T10:05:00Z', durationSeconds: 300 };
    expect(focusSessionEvent('focus.session_ended', ended)).toEqual({ kind: 'ended', session: ended });
  });

  it('returns null for a non-focus event', () => {
    expect(focusSessionEvent('task.updated', session)).toBeNull();
  });

  it('returns null for a malformed payload (missing/empty ids, non-object)', () => {
    expect(focusSessionEvent('focus.session_started', {})).toBeNull();
    expect(focusSessionEvent('focus.session_started', { ...session, id: '' })).toBeNull();
    expect(focusSessionEvent('focus.session_started', { ...session, taskId: 7 })).toBeNull();
    expect(focusSessionEvent('focus.session_started', null)).toBeNull();
  });

  it('session_ended also invalidates Focus (cumulative totals moved); started has no tag entry', () => {
    expect(WS_EVENT_TAGS['focus.session_ended']).toEqual(['Focus']);
    expect(WS_EVENT_TAGS['focus.session_started']).toBeUndefined();
  });
});
