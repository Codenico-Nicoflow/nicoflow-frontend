import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockUser } from '@/mocks/handlers';

import { AIChat } from './AIChat';

const SESSION = 'http://localhost:8080/v1/ai/sessions/s1';
const MESSAGES = 'http://localhost:8080/v1/ai/sessions/s1/messages';
const TOOL_CALLS = 'http://localhost:8080/v1/ai/sessions/s1/tool-calls';
const CONFIRM_TOOL = (id: string) => `http://localhost:8080/v1/ai/sessions/s1/tool-calls/${id}/confirm`;
const AREAS_WITH_PROJECTS = 'http://localhost:8080/v1/areas/with-projects';

const authedStore = () => createMockStore({ auth: { user: mockUser, token: 'tok', isLoading: false } });

const sessionEnvelope = (messages: unknown[]) => ({
  data: { id: 's1', title: 'Chat', createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z', messages },
  error: null,
});

const frame = (obj: unknown) => `data: ${JSON.stringify(obj)}\n\n`;

// An SSE response whose frames are emitted over time so the render can assert
// incremental growth before the terminal event lands.
const sseResponse = (frames: string[]) => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Separate enqueues arrive as separate reads → the render still grows
      // incrementally, with no timers leaking past the test.
      for (const f of frames) controller.enqueue(encoder.encode(f));
      controller.close();
    },
  });
  return new HttpResponse(stream, { headers: { 'Content-Type': 'text/event-stream' } });
};

describe('AIChat', () => {
  // The global afterEach runs vi.clearAllMocks(), which wipes window.matchMedia's
  // implementation — next-themes (via ThemeProvider in renderComponent) then calls
  // .addListener on undefined. Re-arm it before each test in this suite.
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
  });

  afterEach(() => vi.restoreAllMocks());

  it('shows the empty state for a session with no messages', async () => {
    server.use(http.get(SESSION, () => HttpResponse.json(sessionEnvelope([]))));
    renderComponent(<AIChat sessionId="s1" />, { store: authedStore() });

    expect(await screen.findByText('Start a conversation with your AI assistant')).toBeInTheDocument();
  });

  it('renders persisted history', async () => {
    server.use(
      http.get(SESSION, () =>
        HttpResponse.json(
          sessionEnvelope([
            { id: 'm1', role: 'user', content: 'hi', createdAt: '2026-07-01T00:00:00Z' },
            { id: 'm2', role: 'assistant', content: 'hello', createdAt: '2026-07-01T00:00:01Z' },
          ])
        )
      )
    );
    renderComponent(<AIChat sessionId="s1" />, { store: authedStore() });

    expect(await screen.findByText('hi')).toBeInTheDocument();
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('streams an assistant reply incrementally after send', async () => {
    server.use(
      http.get(SESSION, () => HttpResponse.json(sessionEnvelope([]))),
      http.post(MESSAGES, () =>
        sseResponse([
          frame({ type: 'delta', text: 'Hel' }),
          frame({ type: 'delta', text: 'lo!' }),
          frame({ type: 'done', messageId: 'a1', usage: { used: 1, limit: 500, scope: 'month', month: '2026-07' } }),
        ])
      )
    );

    const user = userEvent.setup();
    renderComponent(<AIChat sessionId="s1" />, { store: authedStore() });

    await screen.findByText('Start a conversation with your AI assistant');
    await user.type(screen.getByTestId('ai-composer-input'), 'hey');
    await user.keyboard('{Enter}');

    // Optimistic user turn appears immediately.
    expect(await screen.findByText('hey')).toBeInTheDocument();
    // Assistant text accumulates as deltas arrive.
    await waitFor(() => expect(screen.getByText('Hello!')).toBeInTheDocument());
  });

  it('shows a retry error state and hides the composer when the session fails to load (503)', async () => {
    server.use(
      http.get(SESSION, () =>
        HttpResponse.json({ data: null, error: { code: 'AI_UNAVAILABLE', message: 'x' } }, { status: 503 })
      )
    );

    renderComponent(<AIChat sessionId="s1" />, { store: authedStore() });

    expect(await screen.findByTestId('ai-chat-error')).toBeInTheDocument();
    expect(screen.getByText("Couldn't load this conversation")).toBeInTheDocument();
    // Composer is hidden until the load recovers.
    expect(screen.queryByTestId('ai-composer-input')).not.toBeInTheDocument();
  });

  it('renders a tool_proposal card when the stream emits a tool_proposal event', async () => {
    server.use(
      http.get(SESSION, () => HttpResponse.json(sessionEnvelope([]))),
      http.get(TOOL_CALLS, () => HttpResponse.json({ data: [], error: null })),
      http.get(AREAS_WITH_PROJECTS, () => HttpResponse.json({ data: [], error: null })),
      http.post(MESSAGES, () =>
        sseResponse([
          frame({ type: 'delta', text: 'I can complete that.' }),
          frame({
            type: 'tool_proposal',
            toolUseId: 'toolu_test',
            toolName: 'complete_task',
            input: { taskId: 'task-99', reason: 'You asked.' },
            assistantMessageId: 'msg-tool',
          }),
        ])
      )
    );

    const user = userEvent.setup();
    renderComponent(<AIChat sessionId="s1" />, { store: authedStore() });

    await screen.findByText('Start a conversation with your AI assistant');
    await user.type(screen.getByTestId('ai-composer-input'), 'complete my task');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(screen.getByTestId('tool-proposal-card')).toBeInTheDocument());
    // Preceding text turn stays visible above the card
    expect(screen.getByText('I can complete that.')).toBeInTheDocument();
    // Confirm/Reject buttons are rendered
    expect(screen.getByTestId('tool-proposal-confirm')).toBeInTheDocument();
    expect(screen.getByTestId('tool-proposal-reject')).toBeInTheDocument();
  });

  it('shows Applied chip after Confirm is clicked and the follow-up stream completes', async () => {
    server.use(
      http.get(SESSION, () => HttpResponse.json(sessionEnvelope([]))),
      http.get(TOOL_CALLS, () => HttpResponse.json({ data: [], error: null })),
      http.get(AREAS_WITH_PROJECTS, () => HttpResponse.json({ data: [], error: null })),
      http.post(MESSAGES, () =>
        sseResponse([
          frame({
            type: 'tool_proposal',
            toolUseId: 'toolu_conf',
            toolName: 'complete_task',
            input: { taskId: 'task-88' },
            assistantMessageId: 'msg-c',
          }),
        ])
      ),
      http.post(CONFIRM_TOOL('toolu_conf'), () =>
        sseResponse([
          frame({ type: 'delta', text: 'Task completed!' }),
          frame({ type: 'done', messageId: 'follow-1', usage: { used: 2, limit: 5, scope: 'lifetime', month: null } }),
        ])
      )
    );

    const user = userEvent.setup();
    renderComponent(<AIChat sessionId="s1" />, { store: authedStore() });

    await screen.findByText('Start a conversation with your AI assistant');
    await user.type(screen.getByTestId('ai-composer-input'), 'do it');
    await user.keyboard('{Enter}');

    const confirmBtn = await screen.findByTestId('tool-proposal-confirm');
    await user.click(confirmBtn);

    await waitFor(() => expect(screen.getByTestId('tool-proposal-applied')).toBeInTheDocument());
    expect(screen.getByText('Task completed!')).toBeInTheDocument();
  });

  it('recovers the thread when the error-state retry succeeds', async () => {
    let attempt = 0;
    server.use(
      http.get(SESSION, () => {
        attempt += 1;
        return attempt === 1
          ? HttpResponse.json({ data: null, error: { code: 'AI_UNAVAILABLE', message: 'x' } }, { status: 503 })
          : HttpResponse.json(
              sessionEnvelope([
                { id: 'm1', role: 'assistant', content: 'recovered', createdAt: '2026-07-01T00:00:00Z' },
              ])
            );
      })
    );

    const user = userEvent.setup();
    renderComponent(<AIChat sessionId="s1" />, { store: authedStore() });

    await user.click(await screen.findByTestId('ai-chat-retry'));

    expect(await screen.findByText('recovered')).toBeInTheDocument();
    expect(screen.getByTestId('ai-composer-input')).toBeInTheDocument();
  });
});
