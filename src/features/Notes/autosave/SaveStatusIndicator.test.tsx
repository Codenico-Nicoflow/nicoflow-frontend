import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConflictNotice } from './ConflictNotice';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { SaveStatus } from './types';

describe('SaveStatusIndicator', () => {
  it('renders nothing when idle, so an untouched note shows no save chrome', () => {
    renderComponent(<SaveStatusIndicator status={SaveStatus.IDLE} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it.each([
    [SaveStatus.UNSAVED, 'Unsaved changes'],
    [SaveStatus.SAVING, 'Saving…'],
    [SaveStatus.SAVED, 'Saved'],
    [SaveStatus.CONFLICT, 'This note changed somewhere else'],
  ])('renders %s as its own message', (status, expected) => {
    renderComponent(<SaveStatusIndicator status={status} />);

    expect(screen.getByRole('status')).toHaveTextContent(expected);
  });

  // The status changes while the user is typing, so it must be announced
  // politely rather than interrupting.
  it('announces politely without stealing focus', () => {
    renderComponent(<SaveStatusIndicator status={SaveStatus.SAVING} />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});

describe('ConflictNotice', () => {
  it('explains the conflict and offers reload as the only action', () => {
    renderComponent(<ConflictNotice onReload={vi.fn()} />);

    expect(screen.getByText('This note changed somewhere else')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('calls onReload when the action is used', async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    renderComponent(<ConflictNotice onReload={onReload} />);

    await user.click(screen.getByRole('button', { name: 'Reload the latest version' }));

    expect(onReload).toHaveBeenCalledOnce();
  });

  it('is reachable by keyboard', async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    renderComponent(<ConflictNotice onReload={onReload} />);

    await user.tab();
    await user.keyboard('{Enter}');

    expect(onReload).toHaveBeenCalledOnce();
  });
});
