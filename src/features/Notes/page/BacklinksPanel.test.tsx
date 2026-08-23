import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import type { INote } from '@nicoflow/shared/types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { BacklinksPanel } from './BacklinksPanel';

const API = 'http://localhost:8080/v1';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const note = (overrides: Partial<INote> = {}): INote => ({
  id: 'linking-note',
  projectId: 'p1',
  title: 'Sprint planning',
  excerpt: 'Mentions the note being viewed.',
  version: 1,
  createdAt: '2026-03-01T08:00:00Z',
  updatedAt: '2026-03-01T08:00:00Z',
  ...overrides,
});

const backlinksReturn = (notes: INote[]) =>
  server.use(http.get(`${API}/notes/n1/backlinks`, () => HttpResponse.json({ data: notes, error: null })));

describe('BacklinksPanel', () => {
  it('shows a loading skeleton before the query resolves', async () => {
    server.use(
      http.get(`${API}/notes/n1/backlinks`, async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return HttpResponse.json({ data: [], error: null });
      })
    );

    renderComponent(<BacklinksPanel noteId="n1" />);

    expect(screen.getByTestId('backlinks-loading')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('backlinks-loading')).not.toBeInTheDocument());
  });

  it('shows an empty state when nothing links to the note', async () => {
    backlinksReturn([]);

    renderComponent(<BacklinksPanel noteId="n1" />);

    await waitFor(() => expect(screen.getByTestId('backlinks-empty')).toBeInTheDocument());
  });

  it('renders a row per linking note', async () => {
    backlinksReturn([
      note({ id: 'a', title: 'Sprint planning' }),
      note({ id: 'b', title: 'Retro notes', excerpt: 'Also links back.' }),
    ]);

    renderComponent(<BacklinksPanel noteId="n1" />);

    await waitFor(() => expect(screen.getByText('Sprint planning')).toBeInTheDocument());
    expect(screen.getByText('Retro notes')).toBeInTheDocument();
  });

  it('navigates to the linking note when its row is clicked', async () => {
    backlinksReturn([note({ id: 'a', title: 'Sprint planning' })]);
    const user = userEvent.setup();

    renderComponent(<BacklinksPanel noteId="n1" />);

    await waitFor(() => expect(screen.getByText('Sprint planning')).toBeInTheDocument());
    await user.click(screen.getByTestId('note-row-a'));

    expect(mockNavigate).toHaveBeenCalledWith('/notes/a');
  });
});
