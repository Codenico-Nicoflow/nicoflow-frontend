import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StorageBar } from './StorageBar';

const MB = 1024 * 1024;
const LIMIT = 100 * MB;

describe('StorageBar', () => {
  it('shows "82.0 MB of 100 MB" in amber for a warning-band total', () => {
    renderComponent(<StorageBar usedBytes={82 * MB} limitBytes={LIMIT} />);

    expect(screen.getByText('82.0 MB of 100 MB')).toBeInTheDocument();
    const bar = screen.getByTestId('storage-bar');
    expect(bar).toHaveAttribute('data-level', 'warning');
    expect(bar.querySelector('.bg-amber-500')).not.toBeNull();
  });

  it('is green well under the cap', () => {
    renderComponent(<StorageBar usedBytes={30 * MB} limitBytes={LIMIT} />);
    const bar = screen.getByTestId('storage-bar');
    expect(bar).toHaveAttribute('data-level', 'ok');
    expect(bar.querySelector('.bg-emerald-500')).not.toBeNull();
    expect(screen.getByText('30.0 MB of 100 MB')).toBeInTheDocument();
  });

  it('is red at/above 95% and clamps the bar width to 100%', () => {
    renderComponent(<StorageBar usedBytes={120 * MB} limitBytes={LIMIT} />);
    const bar = screen.getByTestId('storage-bar');
    expect(bar).toHaveAttribute('data-level', 'critical');
    const fill = bar.querySelector<HTMLElement>('.bg-red-500');
    expect(fill).not.toBeNull();
    expect(fill?.style.width).toBe('100%');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  // The whole point of the server-sourced figure: the account total is independent
  // of whichever owner's list happens to be open.
  it('reports the account total even when the open owner holds almost nothing', () => {
    renderComponent(<StorageBar usedBytes={99 * MB} limitBytes={LIMIT} />);
    expect(screen.getByText('99.0 MB of 100 MB')).toBeInTheDocument();
    expect(screen.getByTestId('storage-bar')).toHaveAttribute('data-level', 'critical');
  });

  it('renders a skeleton while the usage request is in flight', () => {
    renderComponent(<StorageBar isLoading />);
    expect(screen.getByTestId('storage-bar-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('storage-bar')).toBeNull();
  });
});
