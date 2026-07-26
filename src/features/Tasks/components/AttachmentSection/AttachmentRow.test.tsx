import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import type { IAttachment } from '@/lib/types';
import { makeUser } from '@/mocks/handlers';

import { AttachmentRow } from './AttachmentRow';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const API = 'http://localhost:8080/v1';

const makeAttachment = (overrides: Partial<IAttachment> = {}): IAttachment => ({
  id: 'a1',
  ownerType: 'task',
  ownerId: 't1',
  fileName: 'report.pdf',
  fileSize: 2048,
  mimeType: 'application/pdf',
  createdAt: '2026-07-24T08:00:00Z',
  ...overrides,
});

// AttachmentRow drives RTK Query mutations, so it needs a store (any plan — reads
// + delete are plan-agnostic).
const renderRow = (att = makeAttachment()) =>
  renderComponent(
    <ul>
      <AttachmentRow attachment={att} />
    </ul>,
    { store: createMockStore({ auth: { user: makeUser({ status: 'premium' }) } }) }
  );

describe('AttachmentRow', () => {
  it('renders name and formatted size (AC1)', () => {
    renderRow(makeAttachment({ fileName: 'design.pdf', fileSize: 1_572_864 }));
    expect(screen.getByText('design.pdf')).toBeInTheDocument();
    expect(screen.getByText('1.5 MB')).toBeInTheDocument();
  });

  it('opens the presigned URL in a new tab on download (AC2)', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    server.use(
      http.get(`${API}/attachments/a1/download-url`, () =>
        HttpResponse.json({ data: { url: 'https://s3.test/signed' }, error: null })
      )
    );

    const user = userEvent.setup();
    renderRow();
    await user.click(screen.getByTestId('attachment-download-a1'));

    await waitFor(() =>
      expect(openSpy).toHaveBeenCalledWith('https://s3.test/signed', '_blank', 'noopener,noreferrer')
    );
    openSpy.mockRestore();
  });

  it('requires inline confirm before deleting, with no undo affordance (AC3)', async () => {
    let deleted = false;
    server.use(
      http.delete(`${API}/attachments/a1`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const user = userEvent.setup();
    renderRow();

    // First click only arms the inline confirm — nothing deleted yet.
    await user.click(screen.getByTestId('attachment-delete-a1'));
    expect(screen.getByTestId('attachment-delete-confirm-a1')).toBeInTheDocument();
    expect(deleted).toBe(false);

    // Cancel disarms it.
    await user.click(screen.getByTestId('attachment-delete-cancel-a1'));
    expect(screen.queryByTestId('attachment-delete-confirm-a1')).not.toBeInTheDocument();
    expect(deleted).toBe(false);

    // Arm again + confirm → hard delete + success toast, no undo control anywhere.
    await user.click(screen.getByTestId('attachment-delete-a1'));
    await user.click(screen.getByTestId('attachment-delete-confirm-a1'));

    await waitFor(() => expect(deleted).toBe(true));
    expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/deleted/i));
    expect(screen.queryByText(/undo/i)).not.toBeInTheDocument();
  });

  it('keeps the row and toasts on delete failure', async () => {
    server.use(
      http.delete(`${API}/attachments/a1`, () =>
        HttpResponse.json({ data: null, error: { code: 'RESOURCE_NOT_FOUND', message: 'gone' } }, { status: 404 })
      )
    );

    const user = userEvent.setup();
    renderRow();
    await user.click(screen.getByTestId('attachment-delete-a1'));
    await user.click(screen.getByTestId('attachment-delete-confirm-a1'));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByTestId('attachment-row-a1')).toBeInTheDocument();
  });
});
