import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import GoogleStatusStrip from './components/GoogleStatusStrip';
import { clearDismissedStatus, dismissStatus, isStatusDismissed } from './googleStatusDismissal';

describe('GoogleStatusStrip', () => {
  it('renders nothing while the overlay is healthy', () => {
    renderComponent(<GoogleStatusStrip status="ok" onDismiss={vi.fn()} />);

    expect(screen.queryByTestId('google-status-strip')).not.toBeInTheDocument();
  });

  it('offers a reconnect route when the connection is dead', () => {
    renderComponent(<GoogleStatusStrip status="disconnected" onDismiss={vi.fn()} />);

    expect(screen.getByTestId('google-status-strip')).toHaveAttribute('data-status', 'disconnected');
    expect(screen.getByTestId('google-status-reconnect')).toHaveAttribute('href', '/settings');
  });

  // A transient outage has nothing for the user to do; a button would imply
  // otherwise.
  it('offers no action for a transient failure', () => {
    renderComponent(<GoogleStatusStrip status="error" onDismiss={vi.fn()} />);

    expect(screen.getByTestId('google-status-strip')).toHaveAttribute('data-status', 'error');
    expect(screen.queryByTestId('google-status-reconnect')).not.toBeInTheDocument();
  });

  it('is dismissible', async () => {
    const onDismiss = vi.fn();
    renderComponent(<GoogleStatusStrip status="error" onDismiss={onDismiss} />);

    await userEvent.click(screen.getByTestId('google-status-dismiss'));

    expect(onDismiss).toHaveBeenCalled();
  });

  // Context about a secondary layer must not interrupt someone reading tasks.
  it('announces politely rather than assertively', () => {
    renderComponent(<GoogleStatusStrip status="disconnected" onDismiss={vi.fn()} />);

    expect(screen.getByTestId('google-status-strip')).toHaveAttribute('role', 'status');
  });
});

describe('googleStatusDismissal', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('records a dismissal', () => {
    dismissStatus('error');

    expect(isStatusDismissed('error')).toBe(true);
  });

  /**
   * The reason dismissal is keyed by status rather than a boolean: waving away
   * a transient outage must not silence "your connection is dead", which is the
   * more important message.
   */
  it('does not let one status silence another', () => {
    dismissStatus('error');

    expect(isStatusDismissed('disconnected')).toBe(false);
  });

  it('reports nothing dismissed by default', () => {
    expect(isStatusDismissed('error')).toBe(false);
    expect(isStatusDismissed('disconnected')).toBe(false);
  });

  // Otherwise the next genuine failure arrives pre-silenced by an answer to an
  // older, unrelated one.
  it('clears the record once the connection is healthy', () => {
    dismissStatus('disconnected');
    clearDismissedStatus();

    expect(isStatusDismissed('disconnected')).toBe(false);
  });

  it('treats unavailable storage as not dismissed', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('private mode');
    });

    // Erring toward showing the strip — silently hiding a broken calendar is
    // the failure this feature exists to prevent.
    expect(isStatusDismissed('error')).toBe(false);

    getItem.mockRestore();
  });

  it('does not throw when storage refuses a write', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(() => dismissStatus('error')).not.toThrow();

    setItem.mockRestore();
  });
});
