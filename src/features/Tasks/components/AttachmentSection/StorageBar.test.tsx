import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { IAttachment } from '@/lib/types';

import { StorageBar } from './StorageBar';

const MB = 1024 * 1024;

const att = (fileSize: number): IAttachment => ({
  id: crypto.randomUUID(),
  ownerType: 'task',
  ownerId: 't1',
  fileName: 'f',
  fileSize,
  mimeType: 'application/pdf',
  createdAt: '2026-07-24T08:00:00Z',
});

describe('StorageBar', () => {
  it('shows "82.0 MB of 100 MB" in amber for a warning-band total (AC4)', () => {
    renderComponent(<StorageBar attachments={[att(82 * MB)]} />);

    expect(screen.getByText('82.0 MB of 100 MB')).toBeInTheDocument();
    const bar = screen.getByTestId('storage-bar');
    expect(bar).toHaveAttribute('data-level', 'warning');
    expect(bar.querySelector('.bg-amber-500')).not.toBeNull();
  });

  it('is green well under the cap', () => {
    renderComponent(<StorageBar attachments={[att(10 * MB), att(20 * MB)]} />);
    const bar = screen.getByTestId('storage-bar');
    expect(bar).toHaveAttribute('data-level', 'ok');
    expect(bar.querySelector('.bg-emerald-500')).not.toBeNull();
    expect(screen.getByText('30.0 MB of 100 MB')).toBeInTheDocument();
  });

  it('is red at/above 95% and clamps the bar width to 100%', () => {
    renderComponent(<StorageBar attachments={[att(120 * MB)]} />);
    const bar = screen.getByTestId('storage-bar');
    expect(bar).toHaveAttribute('data-level', 'critical');
    const fill = bar.querySelector<HTMLElement>('.bg-red-500');
    expect(fill).not.toBeNull();
    expect(fill?.style.width).toBe('100%');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});
