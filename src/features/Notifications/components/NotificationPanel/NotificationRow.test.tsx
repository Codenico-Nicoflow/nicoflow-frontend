import { renderComponent } from '__tests__/renderComponent';
import type { INotification } from '@nicoflow/shared/types';
import { categoryForType } from '@nicoflow/shared/types';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { NotificationRow } from './NotificationRow';

const makeNotification = (overrides: Partial<INotification> = {}): INotification => {
  const type = overrides.type ?? 'task_due_soon';
  return {
    id: 'n1',
    type,
    category: categoryForType(type),
    title: 'Task due soon',
    body: 'This task is scheduled soon.',
    metadata: {},
    isRead: false,
    readAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
};

const renderRow = (n: INotification, onMarkRead = vi.fn(), onDismiss = vi.fn()) =>
  renderComponent(<NotificationRow notification={n} onMarkRead={onMarkRead} onDismiss={onDismiss} />);

describe('NotificationRow', () => {
  it('renders title and body', () => {
    renderRow(makeNotification());
    expect(screen.getByText('Task due soon')).toBeInTheDocument();
    expect(screen.getByText('This task is scheduled soon.')).toBeInTheDocument();
  });

  it('shows unread accent bar when unread', () => {
    renderRow(makeNotification({ isRead: false }));
    expect(screen.getByTestId('unread-bar')).toBeInTheDocument();
  });

  it('hides unread accent bar when read', () => {
    renderRow(makeNotification({ isRead: true }));
    expect(screen.queryByTestId('unread-bar')).not.toBeInTheDocument();
  });

  it('reminder category gets amber styling', () => {
    renderRow(makeNotification({ type: 'task_due_soon' }));
    const row = screen.getByTestId('notification-row');
    expect(row).toHaveAttribute('data-category', 'reminder');
  });

  it('celebration category gets emerald styling', () => {
    renderRow(makeNotification({ type: 'task_completed', metadata: { taskId: 't1', projectId: 'p1' } }));
    const row = screen.getByTestId('notification-row');
    expect(row).toHaveAttribute('data-category', 'celebration');
  });

  it('system category is not navigable', () => {
    renderRow(makeNotification({ type: 'system_announcement' }));
    const row = screen.getByTestId('notification-row');
    expect(row).not.toHaveAttribute('role', 'button');
  });

  it('reminder without projectId in metadata is not navigable', () => {
    renderRow(makeNotification({ type: 'task_due_soon', metadata: {} }));
    const row = screen.getByTestId('notification-row');
    expect(row).not.toHaveAttribute('role', 'button');
  });

  it('celebration with projectId is navigable', () => {
    renderRow(makeNotification({ type: 'task_completed', metadata: { taskId: 't1', projectId: 'p1' } }));
    const row = screen.getByTestId('notification-row');
    expect(row).toHaveAttribute('role', 'button');
  });

  it('calls onMarkRead when mark-read button is clicked', async () => {
    const onMarkRead = vi.fn();
    renderRow(makeNotification(), onMarkRead);
    await userEvent.click(screen.getByTestId('mark-read-button'));
    expect(onMarkRead).toHaveBeenCalledWith('n1');
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const onDismiss = vi.fn();
    renderRow(makeNotification(), vi.fn(), onDismiss);
    await userEvent.click(screen.getByTestId('dismiss-button'));
    expect(onDismiss).toHaveBeenCalledWith('n1');
  });

  it('action buttons do not propagate to row click handler', async () => {
    const onMarkRead = vi.fn();
    renderRow(makeNotification({ type: 'task_completed', metadata: { taskId: 't1', projectId: 'p1' } }), onMarkRead);
    // clicking mark-read should fire onMarkRead, not navigate
    await userEvent.click(screen.getByTestId('mark-read-button'));
    expect(onMarkRead).toHaveBeenCalledOnce();
  });

  it('hides mark-read button on already-read notification', () => {
    renderRow(makeNotification({ isRead: true }));
    expect(screen.queryByTestId('mark-read-button')).not.toBeInTheDocument();
  });

  it('summary category gets muted styling', () => {
    renderRow(makeNotification({ type: 'daily_summary' }));
    const row = screen.getByTestId('notification-row');
    expect(row).toHaveAttribute('data-category', 'summary');
  });

  it('reminder with entityId + projectId in metadata is navigable', () => {
    renderRow(
      makeNotification({
        type: 'task_due_soon',
        metadata: { entityType: 'task', entityId: 't1', projectId: 'p1' },
      })
    );
    expect(screen.getByTestId('notification-row')).toHaveAttribute('role', 'button');
  });

  it('reminder with only projectId (no entityId) is still navigable', () => {
    renderRow(
      makeNotification({
        type: 'task_due_soon',
        metadata: { projectId: 'p1' },
      })
    );
    // projectId present but no entityId → navigates to /projects/:id (no task param).
    expect(screen.getByTestId('notification-row')).toHaveAttribute('role', 'button');
  });
});
