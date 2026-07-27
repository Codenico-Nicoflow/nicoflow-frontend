import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AIChat } from '@/features/AI/components/AIChat';
import { mockUser } from '@/mocks/handlers';

import { AITwoPanelShell } from '../../AITwoPanelShell';

const USAGE = 'http://localhost:8080/v1/ai/usage';
const SESSIONS = 'http://localhost:8080/v1/ai/sessions';
const SESSION = 'http://localhost:8080/v1/ai/sessions/s1';
const MESSAGES = 'http://localhost:8080/v1/ai/sessions/s1/messages';

const authedStore = () => createMockStore({ auth: { user: mockUser, token: 'tok', isLoading: false } });

const usageEnvelope = (used: number, limit: number, scope: 'month' | 'lifetime') => ({
  data: { used, limit, scope, month: scope === 'month' ? '2026-07' : null },
  error: null,
});

const sessionEnvelope = (messages: unknown[]) => ({
  data: { id: 's1', title: 'Chat', createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z', messages },
  error: null,
});

const frame = (obj: unknown) => `data: ${JSON.stringify(obj)}\n\n`;

const sseResponse = (frames: string[]) => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const f of frames) controller.enqueue(encoder.encode(f));
      controller.close();
    },
  });
  return new HttpResponse(stream, { headers: { 'Content-Type': 'text/event-stream' } });
};

const shell = () => <AITwoPanelShell activeId="s1" onSelect={vi.fn()} onCreate={vi.fn()} />;

describe('AI quota surface', () => {
  // The global afterEach clears mocks, wiping matchMedia's implementation that
  // next-themes (via renderComponent's ThemeProvider) calls into.
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    server.use(
      http.get(SESSIONS, () => HttpResponse.json({ data: [], error: null })),
      http.get(SESSION, () => HttpResponse.json(sessionEnvelope([])))
    );
  });

  describe('quota footer', () => {
    it('renders the pro monthly label from the usage query', async () => {
      server.use(http.get(USAGE, () => HttpResponse.json(usageEnvelope(12, 500, 'month'))));
      renderComponent(shell(), { store: authedStore() });

      expect(await screen.findByTestId('ai-quota-label')).toHaveTextContent('12 / 500 this month');
    });

    it('renders the free lifetime label from the usage query', async () => {
      server.use(http.get(USAGE, () => HttpResponse.json(usageEnvelope(2, 5, 'lifetime'))));
      renderComponent(shell(), { store: authedStore() });

      expect(await screen.findByTestId('ai-quota-label')).toHaveTextContent('2 / 5 free messages');
    });

    it('marks the footer exhausted once the cap is reached', async () => {
      server.use(http.get(USAGE, () => HttpResponse.json(usageEnvelope(5, 5, 'lifetime'))));
      renderComponent(shell(), { store: authedStore() });

      await waitFor(() =>
        expect(screen.getByTestId('ai-quota-indicator')).toHaveAttribute('data-quota-state', 'exhausted')
      );
    });

    it('renders nothing rather than a misleading 0/0 when usage fails to load', async () => {
      server.use(
        http.get(USAGE, () =>
          HttpResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'x' } }, { status: 500 })
        )
      );
      renderComponent(shell(), { store: authedStore() });

      await screen.findByTestId('ai-shell-desktop');
      await waitFor(() => expect(screen.queryByTestId('ai-quota-loading')).not.toBeInTheDocument());
      expect(screen.queryByTestId('ai-quota-indicator')).not.toBeInTheDocument();
    });

    // AC1 — usage updates from the stream's done payload, with no second GET.
    it('updates from a done event without refetching usage', async () => {
      let usageCalls = 0;
      server.use(
        http.get(USAGE, () => {
          usageCalls += 1;
          return HttpResponse.json(usageEnvelope(1, 500, 'month'));
        }),
        http.post(MESSAGES, () =>
          sseResponse([
            frame({ type: 'delta', text: 'hi' }),
            frame({
              type: 'done',
              messageId: 'a1',
              usage: { used: 2, limit: 500, scope: 'month', month: '2026-07' },
            }),
          ])
        )
      );

      const user = userEvent.setup();
      renderComponent(shell(), { store: authedStore() });

      expect(await screen.findByTestId('ai-quota-label')).toHaveTextContent('1 / 500 this month');
      const callsBeforeSend = usageCalls;

      await user.type(screen.getByTestId('ai-composer-input'), 'hey');
      await user.keyboard('{Enter}');

      // The footer moves to the done payload's usage…
      await waitFor(() => expect(screen.getByTestId('ai-quota-label')).toHaveTextContent('2 / 500 this month'));
      // …written straight into the cache, so no extra GET /ai/usage was issued.
      expect(usageCalls).toBe(callsBeforeSend);
    });
  });

  // AC2 — the free wall replaces the composer with an upsell; Pro gets a notice.
  describe('exhausted quota', () => {
    it('replaces the composer with an upgrade CTA for a free user at the cap', async () => {
      server.use(http.get(USAGE, () => HttpResponse.json(usageEnvelope(5, 5, 'lifetime'))));
      renderComponent(<AIChat sessionId="s1" />, { store: authedStore() });

      expect(await screen.findByTestId('ai-quota-wall')).toBeInTheDocument();
      expect(screen.getByTestId('ai-quota-upgrade-cta')).toHaveAttribute('href', '/settings');
      expect(screen.queryByTestId('ai-composer-input')).not.toBeInTheDocument();
    });

    it('shows a resets-next-month notice with no CTA for a pro user at the cap', async () => {
      server.use(http.get(USAGE, () => HttpResponse.json(usageEnvelope(500, 500, 'month'))));
      renderComponent(<AIChat sessionId="s1" />, { store: authedStore() });

      expect(await screen.findByTestId('ai-quota-reset-notice')).toBeInTheDocument();
      expect(screen.getByText('Your AI messages reset at the start of next month.')).toBeInTheDocument();
      expect(screen.queryByTestId('ai-quota-upgrade-cta')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ai-composer-input')).not.toBeInTheDocument();
    });

    it('keeps the composer while usage is still under the cap', async () => {
      server.use(http.get(USAGE, () => HttpResponse.json(usageEnvelope(4, 5, 'lifetime'))));
      renderComponent(<AIChat sessionId="s1" />, { store: authedStore() });

      expect(await screen.findByTestId('ai-composer-input')).toBeInTheDocument();
      expect(screen.queryByTestId('ai-quota-wall')).not.toBeInTheDocument();
    });

    // Stale cached usage must not let a walled user keep sending — a live
    // AI_LIMIT_REACHED raises the wall on its own.
    it('raises the wall when a send returns AI_LIMIT_REACHED despite stale usage', async () => {
      server.use(
        http.get(USAGE, () => HttpResponse.json(usageEnvelope(1, 5, 'lifetime'))),
        http.post(MESSAGES, () =>
          HttpResponse.json({ data: null, error: { code: 'AI_LIMIT_REACHED', message: 'x' } }, { status: 429 })
        )
      );

      const user = userEvent.setup();
      renderComponent(<AIChat sessionId="s1" />, { store: authedStore() });

      await user.type(await screen.findByTestId('ai-composer-input'), 'hey');
      await user.keyboard('{Enter}');

      expect(await screen.findByTestId('ai-quota-wall')).toBeInTheDocument();
      expect(screen.queryByTestId('ai-composer-input')).not.toBeInTheDocument();
    });
  });

  // AC3 — AI_UNAVAILABLE is a feature state, not a crash.
  describe('feature disabled', () => {
    it('renders the disabled banner instead of the shell when usage returns AI_UNAVAILABLE', async () => {
      server.use(
        http.get(USAGE, () =>
          HttpResponse.json({ data: null, error: { code: 'AI_UNAVAILABLE', message: 'x' } }, { status: 503 })
        )
      );
      renderComponent(shell(), { store: authedStore() });

      expect(await screen.findByTestId('ai-disabled-banner')).toBeInTheDocument();
      expect(screen.getByText('The AI assistant is unavailable')).toBeInTheDocument();
      expect(screen.queryByTestId('ai-shell-desktop')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ai-composer-input')).not.toBeInTheDocument();
    });

    it('does not disable the feature for a non-AI_UNAVAILABLE failure', async () => {
      server.use(
        http.get(USAGE, () =>
          HttpResponse.json({ data: null, error: { code: 'AI_PROVIDER_ERROR', message: 'x' } }, { status: 502 })
        )
      );
      renderComponent(shell(), { store: authedStore() });

      expect(await screen.findByTestId('ai-shell-desktop')).toBeInTheDocument();
      expect(screen.queryByTestId('ai-disabled-banner')).not.toBeInTheDocument();
    });
  });
});
