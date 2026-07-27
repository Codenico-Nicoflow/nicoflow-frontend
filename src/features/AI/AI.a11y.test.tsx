import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockUser } from '@/mocks/handlers';

import { AIChat } from './components/AIChat';
import { AIMessage } from './components/AIMessage';
import { AIDisabledBanner, QuotaIndicator, QuotaWall } from './components/QuotaIndicator';
import { AISessionList } from './AISessionList';
import type { QuotaStatus } from './quota';
import { deriveQuota } from './quota';

expect.extend(toHaveNoViolations);

const USAGE = 'http://localhost:8080/v1/ai/usage';
const SESSIONS = 'http://localhost:8080/v1/ai/sessions';
const SESSION = 'http://localhost:8080/v1/ai/sessions/s1';

const authedStore = () => createMockStore({ auth: { user: mockUser, token: 'tok', isLoading: false } });

const freeExhausted = deriveQuota({ used: 5, limit: 5, scope: 'lifetime', month: null }) as QuotaStatus;
const proExhausted = deriveQuota({ used: 500, limit: 500, scope: 'month', month: '2026-07' }) as QuotaStatus;

describe('AI feature accessibility', () => {
  beforeEach(() => {
    // The global afterEach clears mocks, wiping matchMedia's implementation that
    // next-themes (via renderComponent's ThemeProvider) calls into.
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
      http.get(USAGE, () =>
        HttpResponse.json({ data: { used: 1, limit: 500, scope: 'month', month: '2026-07' }, error: null })
      ),
      http.get(SESSIONS, () =>
        HttpResponse.json({
          data: [{ id: 's1', title: 'Planning', createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' }],
          error: null,
        })
      ),
      http.get(SESSION, () =>
        HttpResponse.json({
          data: {
            id: 's1',
            title: 'Planning',
            createdAt: '2026-07-01T00:00:00Z',
            updatedAt: '2026-07-01T00:00:00Z',
            messages: [
              { id: 'm1', role: 'user', content: 'Plan my week', createdAt: '2026-07-01T00:00:00Z' },
              { id: 'm2', role: 'assistant', content: 'Here is a **plan**.', createdAt: '2026-07-01T00:00:01Z' },
            ],
          },
          error: null,
        })
      )
    );
  });

  it('has no violations in the chat thread + composer', async () => {
    const { container } = renderComponent(<AIChat sessionId="s1" />, { store: authedStore() });
    // Wait for the history to land too — auditing mid-fetch would both miss the
    // rendered turns and leave a pending update after the assertion.
    await screen.findByText('Plan my week');
    await screen.findByTestId('ai-composer-input');

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations in the session rail', async () => {
    const { container } = renderComponent(<AISessionList activeId="s1" onSelect={vi.fn()} onCreate={vi.fn()} />, {
      store: authedStore(),
    });
    await screen.findByTestId('ai-session-s1');

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations in the quota footer, walls, or disabled banner', async () => {
    const { container } = renderComponent(
      <>
        <QuotaIndicator quota={freeExhausted} />
        <QuotaWall quota={freeExhausted} />
        <QuotaWall quota={proExhausted} />
        <AIDisabledBanner />
      </>,
      { store: authedStore() }
    );
    await screen.findByTestId('ai-quota-upgrade-cta');

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations on a failed turn with its retry affordance', async () => {
    const { container } = renderComponent(
      <AIMessage role="user" content="hi" status="error" errorCode="AI_PROVIDER_ERROR" onRetry={vi.fn()} />,
      { store: authedStore() }
    );
    await screen.findByTestId('ai-message-retry');

    expect(await axe(container)).toHaveNoViolations();
  });

  describe('icon-only controls expose accessible names', () => {
    it('names the new-chat and per-row delete buttons', async () => {
      renderComponent(<AISessionList activeId="s1" onSelect={vi.fn()} onCreate={vi.fn()} />, { store: authedStore() });
      await screen.findByTestId('ai-session-s1');

      expect(screen.getByRole('button', { name: 'Delete conversation' })).toBeInTheDocument();
    });

    it('names the send button', async () => {
      renderComponent(<AIChat sessionId="s1" />, { store: authedStore() });
      await screen.findByText('Plan my week');

      expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
    });
  });

  describe('streaming state is perceivable without motion', () => {
    it('announces generation for assistive tech and marks the turn busy', () => {
      renderComponent(<AIMessage role="assistant" content="partial" streaming />, { store: authedStore() });

      // The pulsing caret is aria-hidden, so the state needs a text equivalent.
      expect(screen.getByText('Generating a response')).toBeInTheDocument();
      expect(screen.getByTestId('ai-message-assistant').querySelector('[aria-busy="true"]')).toBeInTheDocument();
    });

    it('drops the caret animation under prefers-reduced-motion', () => {
      renderComponent(<AIMessage role="assistant" content="partial" streaming />, { store: authedStore() });

      const caret = screen.getByTestId('ai-message-assistant').querySelector('[aria-hidden="true"]');
      expect(caret).toHaveClass('motion-reduce:animate-none');
    });
  });

  it('exposes the quota meter as a progressbar with a name and bounds', async () => {
    renderComponent(<QuotaIndicator quota={freeExhausted} />, { store: authedStore() });

    const meter = await screen.findByRole('progressbar');
    await waitFor(() => expect(meter).toHaveAttribute('aria-valuenow', '5'));
    expect(meter).toHaveAttribute('aria-valuemax', '5');
    expect(meter).toHaveAccessibleName('5 / 5 free messages');
  });
});
