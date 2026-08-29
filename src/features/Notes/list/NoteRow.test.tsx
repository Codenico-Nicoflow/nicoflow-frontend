import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import type { INote } from '@nicoflow/shared/types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { NoteRow } from './NoteRow';

const API = 'http://localhost:8080/v1';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const note = (overrides: Partial<INote> = {}): INote => ({
  id: 'n1',
  projectId: 'p1',
  title: 'Meeting minutes',
  excerpt: 'We agreed to ship the notes surface first.',
  version: 1,
  createdAt: '2026-03-01T08:00:00Z',
  updatedAt: '2026-03-01T08:00:00Z',
  ...overrides,
});

describe('NoteRow', () => {
  it('opens the note on click', async () => {
    const onOpen = vi.fn();
    renderComponent(<NoteRow note={note()} onOpen={onOpen} />);

    await userEvent.click(screen.getByTestId('note-row-n1'));

    expect(onOpen).toHaveBeenCalledWith('n1');
  });

  it('deletes the note after confirming', async () => {
    let deleteCalled = false;
    server.use(
      http.delete(`${API}/notes/n1`, () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    renderComponent(<NoteRow note={note()} onOpen={vi.fn()} />);

    await userEvent.click(screen.getByTestId('note-row-n1-actions-trigger'));
    await userEvent.click(await screen.findByText('Delete note'));
    await userEvent.click(await screen.findByText('Delete'));

    await waitFor(() => expect(deleteCalled).toBe(true));
  });

  it('does not delete without confirming', async () => {
    let deleteCalled = false;
    server.use(
      http.delete(`${API}/notes/n1`, () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    renderComponent(<NoteRow note={note()} onOpen={vi.fn()} />);

    await userEvent.click(screen.getByTestId('note-row-n1-actions-trigger'));
    await userEvent.click(await screen.findByText('Delete note'));
    await userEvent.click(await screen.findByText('Cancel'));

    expect(deleteCalled).toBe(false);
  });

  it('shows an error toast when delete fails', async () => {
    server.use(
      http.delete(`${API}/notes/n1`, () => HttpResponse.json({ data: null, error: { code: 'ERR' } }, { status: 500 }))
    );
    renderComponent(<NoteRow note={note()} onOpen={vi.fn()} />);

    await userEvent.click(screen.getByTestId('note-row-n1-actions-trigger'));
    await userEvent.click(await screen.findByText('Delete note'));
    await userEvent.click(await screen.findByText('Delete'));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
