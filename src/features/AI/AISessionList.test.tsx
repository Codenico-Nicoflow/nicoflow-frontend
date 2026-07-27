import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CONFIRM_DIALOG_CONFIRM_BUTTON } from '@/lib/test_ids';

import AIPage from '../../pages/ai/AIPage';

import type { AISessionView } from './types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const aiError = (code: string, status: number) =>
  HttpResponse.json({ data: null, error: { code, message: code } }, { status });

const API = 'http://localhost:8080/v1';

const store = () =>
  createMockStore({
    auth: {
      user: {
        id: 'u1',
        email: 'a@b.co',
        firstName: 'A',
        lastName: 'B',
        username: 'ab',
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        imageUrl: '',
        status: 'regular',
      },
      token: 't',
    },
  });

const makeSession = (o: Partial<AISessionView> = {}): AISessionView => ({
  id: 's1',
  title: 'Plan my week',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...o,
});

// AIChatPanel fetches the open session's detail; stub it so an active route
// doesn't log an unhandled-request warning (the list is what's under test).
const sessionDetail = () =>
  http.get(`${API}/ai/sessions/:id`, ({ params }) =>
    HttpResponse.json({ data: { ...makeSession({ id: String(params.id) }), messages: [] }, error: null })
  );

// The page owns navigation, so testing through it exercises the real
// create/select/delete → route behaviour the story specifies. Both /ai and
// /ai/:id resolve to AIPage so useParams().id reflects the active session.
const renderPage = (route = '/ai') =>
  renderComponent(
    <Routes>
      <Route path="/ai" element={<AIPage />} />
      <Route path="/ai/:id" element={<AIPage />} />
    </Routes>,
    { store: store(), initialRoute: route }
  );

describe('AISessionList (via AIPage)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the session list with title + relative date, newest highlighted from the route', async () => {
    server.use(
      http.get(`${API}/ai/sessions`, () =>
        HttpResponse.json({ data: [makeSession({ id: 's1', title: 'Plan my week' })], error: null })
      ),
      sessionDetail()
    );

    renderPage('/ai/s1');

    const row = await screen.findByTestId('ai-session-s1');
    expect(within(row).getByText('Plan my week')).toBeInTheDocument();
    // Relative date renders per row (Timestamp).
    expect(within(row).getByTestId('timestamp')).toBeInTheDocument();
    // Active session (route :id) is highlighted.
    expect(row.closest('.bg-accent')).not.toBeNull();
  });

  it('shows the skeleton while the list loads (house rule)', async () => {
    server.use(http.get(`${API}/ai/sessions`, () => new Promise(() => {})));

    renderPage();

    expect(await screen.findByTestId('ai-session-list-loading')).toBeInTheDocument();
  });

  it('shows the empty state when there are no sessions', async () => {
    server.use(http.get(`${API}/ai/sessions`, () => HttpResponse.json({ data: [], error: null })));

    renderPage();

    await waitFor(() => expect(screen.getByText('No conversations yet')).toBeInTheDocument());
  });

  it('shows an error state (not the empty state) when the list load fails (503)', async () => {
    server.use(http.get(`${API}/ai/sessions`, () => aiError('AI_UNAVAILABLE', 503)));

    renderPage();

    expect(await screen.findByTestId('ai-session-list-error')).toBeInTheDocument();
    expect(screen.getByText("Couldn't load conversations")).toBeInTheDocument();
    // The misleading "no conversations" empty state must NOT show on an error.
    expect(screen.queryByText('No conversations yet')).not.toBeInTheDocument();
  });

  it('retries the list load from the error state', async () => {
    let attempt = 0;
    server.use(
      http.get(`${API}/ai/sessions`, () => {
        attempt += 1;
        return attempt === 1
          ? aiError('AI_UNAVAILABLE', 503)
          : HttpResponse.json({ data: [makeSession()], error: null });
      })
    );

    renderPage();

    await userEvent.click(await screen.findByTestId('ai-session-list-retry'));

    expect(await screen.findByTestId('ai-session-s1')).toBeInTheDocument();
  });

  it('toasts when creating a session fails (503) and does not navigate', async () => {
    server.use(
      http.get(`${API}/ai/sessions`, () => HttpResponse.json({ data: [], error: null })),
      http.post(`${API}/ai/sessions`, () => aiError('AI_UNAVAILABLE', 503))
    );

    renderPage('/ai');

    await userEvent.click(await screen.findByTestId('ai-new-session'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(window.location.pathname).toBe('/ai');
  });

  it('toasts when deleting a session fails', async () => {
    server.use(
      http.get(`${API}/ai/sessions`, () => HttpResponse.json({ data: [makeSession({ id: 's1' })], error: null })),
      http.delete(`${API}/ai/sessions/s1`, () => aiError('AI_UNAVAILABLE', 503)),
      sessionDetail()
    );

    renderPage('/ai');

    await userEvent.click(await screen.findByTestId('ai-session-delete-s1'));
    await userEvent.click(await screen.findByTestId(CONFIRM_DIALOG_CONFIRM_BUTTON));

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    // Row stays — the delete didn't succeed.
    expect(screen.getByTestId('ai-session-s1')).toBeInTheDocument();
  });

  it('AC1: New Chat creates a session and navigates to /ai/:id', async () => {
    server.use(
      http.get(`${API}/ai/sessions`, () => HttpResponse.json({ data: [], error: null })),
      http.post(`${API}/ai/sessions`, () =>
        HttpResponse.json({ data: makeSession({ id: 'new-9', title: 'New chat' }), error: null })
      )
    );

    renderPage('/ai');

    await userEvent.click(await screen.findByTestId('ai-new-session'));

    await waitFor(() => expect(window.location.pathname).toBe('/ai/new-9'));
  });

  it('AC2: delete confirm removes the row (list invalidates and refetches)', async () => {
    let deleted = false;
    server.use(
      http.get(`${API}/ai/sessions`, () => {
        const data = deleted ? [] : [makeSession({ id: 's1', title: 'Plan my week' })];
        return HttpResponse.json({ data, error: null });
      }),
      http.delete(`${API}/ai/sessions/s1`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderPage('/ai');

    await userEvent.click(await screen.findByTestId('ai-session-delete-s1'));
    await userEvent.click(await screen.findByTestId(CONFIRM_DIALOG_CONFIRM_BUTTON));

    // Row gone after the invalidated list refetches empty.
    await waitFor(() => expect(screen.queryByTestId('ai-session-s1')).not.toBeInTheDocument());
  });

  it('AC2: deleting the ACTIVE session navigates back to /ai', async () => {
    server.use(
      http.get(`${API}/ai/sessions`, () => HttpResponse.json({ data: [makeSession({ id: 's1' })], error: null })),
      http.delete(`${API}/ai/sessions/s1`, () => new HttpResponse(null, { status: 204 })),
      sessionDetail()
    );

    renderPage('/ai/s1');

    await userEvent.click(await screen.findByTestId('ai-session-delete-s1'));
    await userEvent.click(await screen.findByTestId(CONFIRM_DIALOG_CONFIRM_BUTTON));

    await waitFor(() => expect(window.location.pathname).toBe('/ai'));
  });

  it('AC2: deleting a NON-active session stays on the current route', async () => {
    server.use(
      http.get(`${API}/ai/sessions`, () =>
        HttpResponse.json({ data: [makeSession({ id: 's1' }), makeSession({ id: 's2', title: 'Other' })], error: null })
      ),
      http.delete(`${API}/ai/sessions/s2`, () => new HttpResponse(null, { status: 204 })),
      sessionDetail()
    );

    renderPage('/ai/s1');

    await userEvent.click(await screen.findByTestId('ai-session-delete-s2'));
    await userEvent.click(await screen.findByTestId(CONFIRM_DIALOG_CONFIRM_BUTTON));

    // Deleting a background session must not yank the user off their open one.
    await waitFor(() => expect(screen.queryByTestId('ai-session-delete-confirm-content')).not.toBeInTheDocument());
    expect(window.location.pathname).toBe('/ai/s1');
  });
});
