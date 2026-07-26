import { renderComponent } from '__tests__/renderComponent';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UploadZone } from './UploadZone';

const makeFile = (name: string, type = 'application/pdf') => new File(['x'], name, { type });

describe('UploadZone', () => {
  it('emits picked files via the hidden input', async () => {
    const onFiles = vi.fn();
    const user = userEvent.setup();
    renderComponent(<UploadZone onFiles={onFiles} />);

    const input = screen.getByTestId('upload-zone-input') as HTMLInputElement;
    await user.upload(input, [makeFile('a.pdf'), makeFile('b.pdf')]);

    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles).toHaveBeenCalledWith(expect.arrayContaining([expect.any(File)]));
    expect((onFiles.mock.calls[0]?.[0] as File[]).length).toBe(2);
  });

  it('emits dropped files and clears the drag-active state', () => {
    const onFiles = vi.fn();
    renderComponent(<UploadZone onFiles={onFiles} />);
    const zone = screen.getByTestId('upload-zone');

    fireEvent.dragOver(zone);
    expect(zone).toHaveAttribute('data-drag-active', 'true');

    fireEvent.drop(zone, { dataTransfer: { files: [makeFile('dropped.png', 'image/png')] } });

    expect(onFiles).toHaveBeenCalledTimes(1);
    expect((onFiles.mock.calls[0]?.[0] as File[]).length).toBe(1);
    expect(zone).toHaveAttribute('data-drag-active', 'false');
  });

  it('does not emit when disabled', () => {
    const onFiles = vi.fn();
    renderComponent(<UploadZone onFiles={onFiles} disabled />);
    const zone = screen.getByTestId('upload-zone');

    fireEvent.dragOver(zone);
    expect(zone).toHaveAttribute('data-drag-active', 'false');
    fireEvent.drop(zone, { dataTransfer: { files: [makeFile('x.pdf')] } });

    expect(onFiles).not.toHaveBeenCalled();
    expect(screen.getByTestId('upload-zone-button')).toBeDisabled();
  });
});
