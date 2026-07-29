import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeBucket, makeProject, makeTask } from '@/mocks/handlers';

import { Rail } from './index';

const API = 'http://localhost:8080/v1';
const env = <T,>(data: T) => ({ data, error: null });

describe('Rail', () => {
  it('renders the primary destinations + settings', () => {
    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });
    for (const id of ['rail-today', 'rail-inbox', 'rail-areas', 'rail-settings']) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });

  it('marks Areas active on a project route (prefix match)', () => {
    renderComponent(<Rail />, { initialRoute: '/projects/abc-123' });
    expect(screen.getByTestId('rail-areas')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('rail-today')).not.toHaveAttribute('aria-current');
  });

  it('shows the count of today tasks as a badge on the Today item', async () => {
    server.use(
      http.get(`${API}/time-spread`, () =>
        HttpResponse.json(env({ today: [makeTask({ id: 'a' }), makeTask({ id: 'b' })], tomorrow: [], thisWeek: [] }))
      )
    );

    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

    await waitFor(() => expect(screen.getByTestId('rail-today-badge')).toHaveTextContent('2'));
  });

  it('hides the Today badge when nothing is scheduled', async () => {
    server.use(http.get(`${API}/time-spread`, () => HttpResponse.json(env({ today: [], tomorrow: [], thisWeek: [] }))));

    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

    await waitFor(() => expect(screen.getByTestId('rail-today')).toBeInTheDocument());
    expect(screen.queryByTestId('rail-today-badge')).not.toBeInTheDocument();
  });

  it('shows the count of unprocessed captures as a badge on the Inbox item', async () => {
    server.use(
      http.get(`${API}/bucket`, () =>
        HttpResponse.json(
          env({
            items: [
              makeBucket({ id: 'u1' }),
              makeBucket({ id: 'u2' }),
              // a processed item must not be counted
              makeBucket({ id: 'p1', processedAt: '2026-07-12T09:00:00Z', processingResult: 'task' }),
            ],
          })
        )
      )
    );

    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

    await waitFor(() => expect(screen.getByTestId('rail-inbox-badge')).toHaveTextContent('2'));
  });

  it('hides the Inbox badge when there are no unprocessed captures', async () => {
    server.use(
      http.get(`${API}/bucket`, () =>
        HttpResponse.json(env({ items: [makeBucket({ id: 'p1', processedAt: '2026-07-12T09:00:00Z' })] }))
      )
    );

    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

    await waitFor(() => expect(screen.getByTestId('rail-inbox')).toBeInTheDocument());
    expect(screen.queryByTestId('rail-inbox-badge')).not.toBeInTheDocument();
  });

  it('caps the Inbox badge at 9+', async () => {
    server.use(
      http.get(`${API}/bucket`, () =>
        HttpResponse.json(env({ items: Array.from({ length: 12 }, (_, i) => makeBucket({ id: `u${i}` })) }))
      )
    );

    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

    await waitFor(() => expect(screen.getByTestId('rail-inbox-badge')).toHaveTextContent('9+'));
  });

  describe('favorites', () => {
    const withProjects = (items: ReturnType<typeof makeProject>[]) =>
      server.use(http.get(`${API}/projects`, () => HttpResponse.json(env({ items }))));

    it('shows a shortcut per starred project, alphabetically', async () => {
      withProjects([
        makeProject({ id: 'p1', name: 'Zebra', isFavorite: true }),
        makeProject({ id: 'p2', name: 'Apple', isFavorite: true }),
        makeProject({ id: 'p3', name: 'Unstarred', isFavorite: false }),
      ]);

      renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

      await waitFor(() => expect(screen.getByTestId('rail-favorite-p1')).toBeInTheDocument());
      expect(screen.queryByTestId('rail-favorite-p3')).not.toBeInTheDocument();

      // Read the accessible name rather than aria-label: expanded rows carry a
      // visible label instead, so asserting the attribute would only pass in
      // the collapsed variant.
      const rendered = screen
        .getAllByTestId(/^rail-favorite-/)
        .map(el => el.textContent?.trim() || el.getAttribute('aria-label'));
      expect(rendered).toEqual(['Apple', 'Zebra']);
    });

    it('renders no divider when nothing is starred', async () => {
      withProjects([makeProject({ id: 'p1', name: 'Plain', isFavorite: false })]);

      renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

      await waitFor(() => expect(screen.getByTestId('rail-inbox')).toBeInTheDocument());
      expect(screen.queryByTestId('rail-favorites-divider')).not.toBeInTheDocument();
    });

    it('marks the favorite active on its own project route, alongside Areas', async () => {
      withProjects([makeProject({ id: 'p1', name: 'Alpha', isFavorite: true })]);

      renderComponent(<Rail />, { initialRoute: '/projects/p1' });

      await waitFor(() => expect(screen.getByTestId('rail-favorite-p1')).toHaveAttribute('aria-current', 'page'));
      // Areas stays section-active — the two answer different questions.
      expect(screen.getByTestId('rail-areas')).toHaveAttribute('aria-current', 'page');
    });

    it('does not mark a favorite active on a different project route', async () => {
      withProjects([makeProject({ id: 'p1', name: 'Alpha', isFavorite: true })]);

      renderComponent(<Rail />, { initialRoute: '/projects/other' });

      await waitFor(() => expect(screen.getByTestId('rail-favorite-p1')).toBeInTheDocument());
      expect(screen.getByTestId('rail-favorite-p1')).not.toHaveAttribute('aria-current');
    });

    it('shows at most five shortcuts when more are starred', async () => {
      withProjects(
        Array.from({ length: 7 }, (_, i) => makeProject({ id: `p${i}`, name: `Fav ${i}`, isFavorite: true }))
      );

      renderComponent(<Rail />, { initialRoute: '/quick-access/today' });

      await waitFor(() => expect(screen.getAllByTestId(/^rail-favorite-/)).toHaveLength(5));
    });
  });
});
