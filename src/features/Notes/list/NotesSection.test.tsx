import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { INote } from '@/lib/types';

import { NotesSection } from './NotesSection';

const API = 'http://localhost:8080/v1';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

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

const listReturns = (notes: INote[]) =>
  server.use(http.get(`${API}/notes`, () => HttpResponse.json({ data: notes, error: null })));

beforeEach(() => {
  mockNavigate.mockClear();
});

describe('NotesSection list', () => {
  it('renders a row per note with its title and excerpt', async () => {
    listReturns([
      note({ id: 'n1', title: 'Meeting minutes' }),
      note({ id: 'n2', title: 'Research', excerpt: 'Comparing three approaches.' }),
      note({ id: 'n3', title: 'Decisions' }),
    ]);

    renderComponent(<NotesSection projectId="p1" />);

    await waitFor(() => expect(screen.getByText('Meeting minutes')).toBeInTheDocument());
    expect(screen.getByText('Research')).toBeInTheDocument();
    expect(screen.getByText('Comparing three approaches.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  // The server orders updatedAt DESC; the client renders as received rather
  // than re-sorting, so a server ordering change doesn't need a client change.
  it('preserves the server ordering', async () => {
    listReturns([note({ id: 'n1', title: 'Newest' }), note({ id: 'n2', title: 'Older' })]);

    renderComponent(<NotesSection projectId="p1" />);

    await waitFor(() => expect(screen.getByText('Newest')).toBeInTheDocument());
    const rows = screen.getAllByRole('listitem');
    expect(within(rows[0]!).getByText('Newest')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('Older')).toBeInTheDocument();
  });

  it('falls back to placeholder copy for an untitled or empty note', async () => {
    listReturns([note({ title: '', excerpt: '' })]);

    renderComponent(<NotesSection projectId="p1" />);

    await waitFor(() => expect(screen.getByText('Untitled note')).toBeInTheDocument());
    expect(screen.getByText('Empty note')).toBeInTheDocument();
  });

  // AC5: the list shape carries no body, so a row cannot be the editor's source.
  it('never exposes a note body on a row', async () => {
    listReturns([note({ excerpt: 'Only the excerpt is here.' })]);

    renderComponent(<NotesSection projectId="p1" />);

    await waitFor(() => expect(screen.getByText('Only the excerpt is here.')).toBeInTheDocument());
    expect(screen.queryByText(/"type":"doc"/)).not.toBeInTheDocument();
  });
});

describe('NotesSection loading and empty states', () => {
  it('shows a skeleton while the request is in flight, not a stale flash', async () => {
    server.use(
      http.get(`${API}/notes`, async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return HttpResponse.json({ data: [note()], error: null });
      })
    );

    renderComponent(<NotesSection projectId="p1" />);

    expect(screen.getByTestId('notes-loading')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Meeting minutes')).toBeInTheDocument());
    expect(screen.queryByTestId('notes-loading')).not.toBeInTheDocument();
  });

  // AC3: the empty state sits above a surface that is still there — the heading
  // and the create affordance stay reachable.
  it('renders the empty state without removing the heading or create action', async () => {
    listReturns([]);

    renderComponent(<NotesSection projectId="p1" />);

    await waitFor(() => expect(screen.getByTestId('notes-empty')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByTestId('notes-create')).toBeInTheDocument();
  });

  it('offers a retry when the list fails to load', async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/notes`, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'boom' } }, { status: 500 });
        }
        return HttpResponse.json({ data: [note()], error: null });
      })
    );

    const user = userEvent.setup();
    renderComponent(<NotesSection projectId="p1" />);

    await waitFor(() => expect(screen.getByTestId('notes-error')).toBeInTheDocument());
    await user.click(screen.getByTestId('notes-retry'));

    await waitFor(() => expect(screen.getByText('Meeting minutes')).toBeInTheDocument());
  });
});

describe('NotesSection create', () => {
  it('creates a note for the project and routes into its editor', async () => {
    let body: unknown = null;
    listReturns([]);
    server.use(
      http.post(`${API}/notes`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          {
            data: {
              id: 'new-note',
              projectId: 'p1',
              title: '',
              content: { type: 'doc', content: [] },
              version: 1,
              createdAt: '2026-03-01T08:00:00Z',
              updatedAt: '2026-03-01T08:00:00Z',
            },
            error: null,
          },
          { status: 201 }
        );
      })
    );

    const user = userEvent.setup();
    renderComponent(<NotesSection projectId="p1" />);

    await waitFor(() => expect(screen.getByTestId('notes-empty')).toBeInTheDocument());
    await user.click(screen.getByTestId('notes-create'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/notes/new-note'));
    expect(body).toEqual({ projectId: 'p1', title: 'Untitled note', content: { type: 'doc', content: [] } });
  });

  // AC6: notes are free and unlimited — creating the 50th must behave like the
  // first, with no plan gate anywhere in this path.
  it('creates without any plan gate when the project already has many notes', async () => {
    listReturns(Array.from({ length: 30 }, (_, index) => note({ id: `n${index}`, title: `Note ${index}` })));
    server.use(
      http.post(`${API}/notes`, () =>
        HttpResponse.json(
          {
            data: {
              id: 'note-31',
              projectId: 'p1',
              title: '',
              content: { type: 'doc', content: [] },
              version: 1,
              createdAt: '2026-03-01T08:00:00Z',
              updatedAt: '2026-03-01T08:00:00Z',
            },
            error: null,
          },
          { status: 201 }
        )
      )
    );

    const user = userEvent.setup();
    renderComponent(<NotesSection projectId="p1" />);

    await waitFor(() => expect(screen.getByText('Note 0')).toBeInTheDocument());
    await user.click(screen.getByTestId('notes-create'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/notes/note-31'));
    expect(screen.queryByText(/upgrade/i)).not.toBeInTheDocument();
  });

  it('surfaces a create failure instead of navigating', async () => {
    listReturns([]);
    server.use(
      http.post(`${API}/notes`, () =>
        HttpResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'boom' } }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    renderComponent(<NotesSection projectId="p1" />);

    await waitFor(() => expect(screen.getByTestId('notes-empty')).toBeInTheDocument());
    await user.click(screen.getByTestId('notes-create'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Couldn't create the note. Try again."));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
