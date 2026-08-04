import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockUser } from '@/mocks/handlers';

import { NoteEditorPage } from './NoteEditorPage';

const API = 'http://localhost:8080/v1';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ noteId: 'n1' }) };
});

const detail = (overrides: Record<string, unknown> = {}) => ({
  id: 'n1',
  projectId: 'p1',
  title: 'Meeting minutes',
  content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'the body' }] }] },
  version: 3,
  createdAt: '2026-03-01T08:00:00Z',
  updatedAt: '2026-03-01T08:00:00Z',
  ...overrides,
});

const scalarReturns = (body: Record<string, unknown> = detail()) =>
  server.use(http.get(`${API}/notes/n1`, () => HttpResponse.json({ data: body, error: null })));

// Uploads are Pro-only, and the shared mockUser defaults to `regular` — a test
// that forgets this asserts the locked state by accident.
const proStore = () => createMockStore({ auth: { user: { ...mockUser, status: 'premium' } } });
const freeStore = () => createMockStore({ auth: { user: { ...mockUser, status: 'regular' } } });

beforeEach(() => {
  mockNavigate.mockClear();
});

describe('NoteEditorPage load', () => {
  it('shows a skeleton until the scalar resolves, never a placeholder that swaps', async () => {
    server.use(
      http.get(`${API}/notes/n1`, async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return HttpResponse.json({ data: detail(), error: null });
      })
    );

    renderComponent(<NoteEditorPage />);

    expect(screen.getByTestId('note-editor-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('note-title')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('note-title')).toBeInTheDocument());
    expect(screen.queryByTestId('note-editor-skeleton')).not.toBeInTheDocument();
  });

  it('renders the title and body from the scalar response', async () => {
    scalarReturns();

    renderComponent(<NoteEditorPage />);

    await waitFor(() => expect(screen.getByTestId('note-title')).toHaveValue('Meeting minutes'));
    expect(screen.getByText('the body')).toBeInTheDocument();
  });

  it('requests the scalar endpoint for the body', async () => {
    let requested = '';
    server.use(
      http.get(`${API}/notes/n1`, ({ request }) => {
        requested = new URL(request.url).pathname;
        return HttpResponse.json({ data: detail(), error: null });
      })
    );

    renderComponent(<NoteEditorPage />);

    await waitFor(() => expect(requested).toBe('/v1/notes/n1'));
  });

  it('shows a not-found state when the note is missing', async () => {
    server.use(
      http.get(`${API}/notes/n1`, () =>
        HttpResponse.json({ data: null, error: { code: 'RESOURCE_NOT_FOUND', message: 'gone' } }, { status: 404 })
      )
    );

    renderComponent(<NoteEditorPage />);

    await waitFor(() => expect(screen.getByTestId('note-not-found')).toBeInTheDocument());
  });
});

describe('NoteEditorPage saving', () => {
  it('sends the edited title with the version last read', async () => {
    scalarReturns();
    let body: unknown = null;
    server.use(
      http.patch(`${API}/notes/n1`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: detail({ version: 4 }), error: null });
      })
    );

    const user = userEvent.setup();
    renderComponent(<NoteEditorPage />);

    await waitFor(() => expect(screen.getByTestId('note-title')).toHaveValue('Meeting minutes'));
    await user.clear(screen.getByTestId('note-title'));
    await user.type(screen.getByTestId('note-title'), 'Renamed');

    await waitFor(() => expect(body).not.toBeNull(), { timeout: 4000 });
    expect(body).toMatchObject({ version: 3, title: 'Renamed' });
  });

  it('surfaces a conflict and stops offering an editable surface', async () => {
    scalarReturns();
    server.use(
      http.patch(`${API}/notes/n1`, () =>
        HttpResponse.json({ data: null, error: { code: 'CONFLICT', message: 'stale' } }, { status: 409 })
      )
    );

    const user = userEvent.setup();
    renderComponent(<NoteEditorPage />);

    await waitFor(() => expect(screen.getByTestId('note-title')).toHaveValue('Meeting minutes'));
    await user.type(screen.getByTestId('note-title'), '!');

    // The status chip and the notice both name the conflict — the chip is the
    // at-a-glance state, the notice carries the explanation and the way out.
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument(), { timeout: 4000 });
    expect(screen.getByRole('button', { name: 'Reload the latest version' })).toBeInTheDocument();
    expect(screen.getByTestId('note-title')).toBeDisabled();
  });
});

describe('NoteEditorPage delete', () => {
  it('deletes after confirmation and routes back to the project', async () => {
    scalarReturns();
    let deleted = false;
    server.use(
      http.delete(`${API}/notes/n1`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const user = userEvent.setup();
    renderComponent(<NoteEditorPage />);

    await waitFor(() => expect(screen.getByTestId('note-delete')).toBeInTheDocument());
    await user.click(screen.getByTestId('note-delete'));

    await waitFor(() => expect(screen.getByText('Delete this note?')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleted).toBe(true));
    expect(mockNavigate).toHaveBeenCalledWith('/projects/p1');
  });

  it('does not delete without confirmation', async () => {
    scalarReturns();
    let deleted = false;
    server.use(
      http.delete(`${API}/notes/n1`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const user = userEvent.setup();
    renderComponent(<NoteEditorPage />);

    await waitFor(() => expect(screen.getByTestId('note-delete')).toBeInTheDocument());
    await user.click(screen.getByTestId('note-delete'));

    await waitFor(() => expect(screen.getByText('Delete this note?')).toBeInTheDocument());
    expect(deleted).toBe(false);
  });

  // An orphaned note (its project was deleted) still has to lead somewhere.
  it('routes to areas when the note has no project', async () => {
    scalarReturns(detail({ projectId: null }));
    server.use(http.delete(`${API}/notes/n1`, () => new HttpResponse(null, { status: 204 })));

    const user = userEvent.setup();
    renderComponent(<NoteEditorPage />);

    await waitFor(() => expect(screen.getByTestId('note-delete')).toBeInTheDocument());
    await user.click(screen.getByTestId('note-delete'));
    await waitFor(() => expect(screen.getByText('Delete this note?')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/areas'));
  });

  it('surfaces a delete failure instead of routing away', async () => {
    scalarReturns();
    server.use(
      http.delete(`${API}/notes/n1`, () =>
        HttpResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'boom' } }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    renderComponent(<NoteEditorPage />);

    await waitFor(() => expect(screen.getByTestId('note-delete')).toBeInTheDocument());
    await user.click(screen.getByTestId('note-delete'));
    await waitFor(() => expect(screen.getByText('Delete this note?')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Couldn't delete the note. Try again."));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('NoteEditorPage attachments', () => {
  it('lists the note’s attachments using ownerType "note"', async () => {
    scalarReturns();
    let query = '';
    server.use(
      http.get(`${API}/attachments`, ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json({
          data: [
            {
              id: 'a1',
              ownerType: 'note',
              ownerId: 'n1',
              fileName: 'research.pdf',
              fileSize: 1024,
              mimeType: 'application/pdf',
              createdAt: '2026-03-01T08:00:00Z',
            },
          ],
          error: null,
        });
      })
    );

    renderComponent(<NoteEditorPage />, { store: proStore() });

    await waitFor(() => expect(screen.getByText('research.pdf')).toBeInTheDocument());
    expect(query).toContain('ownerType=note');
    expect(query).toContain('ownerId=n1');
  });

  // AC6: reads stay open on Free so a downgraded user can still see their files.
  it('shows existing attachments to a Free user', async () => {
    scalarReturns();
    server.use(
      http.get(`${API}/attachments`, () =>
        HttpResponse.json({
          data: [
            {
              id: 'a1',
              ownerType: 'note',
              ownerId: 'n1',
              fileName: 'existing.pdf',
              fileSize: 2048,
              mimeType: 'application/pdf',
              createdAt: '2026-03-01T08:00:00Z',
            },
          ],
          error: null,
        })
      )
    );

    renderComponent(<NoteEditorPage />, { store: freeStore() });

    await waitFor(() => expect(screen.getByText('existing.pdf')).toBeInTheDocument());
  });
});
