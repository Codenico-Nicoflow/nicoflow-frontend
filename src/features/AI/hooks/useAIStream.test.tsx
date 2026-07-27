import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { aiApi } from '@/lib/store';

import { createMockStore } from '../../../../__tests__/renderComponent';

import { useAIStream } from './useAIStream';

// Build one SSE `data:` frame (the terminating blank line is the delimiter).
const frame = (obj: unknown) => `data: ${JSON.stringify(obj)}\n\n`;

// A controllable response body: push() feeds a chunk to the reader, close() ends
// the stream, and error() rejects the in-flight read (models a dropped socket).
// Chunks are queued so a read that arrives before a push still resolves.
const controllableStream = () => {
  const encoder = new TextEncoder();
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });
  return {
    stream,
    push: (text: string) => controller.enqueue(encoder.encode(text)),
    close: () => controller.close(),
    error: () => controller.error(new Error('dropped')),
  };
};

const okResponse = (body: ReadableStream<Uint8Array>): Response =>
  ({ ok: true, status: 200, body }) as unknown as Response;

const errorResponse = (status: number, code: string): Response =>
  ({
    ok: false,
    status,
    body: null,
    json: async () => ({ data: null, error: { code, message: 'nope' } }),
  }) as unknown as Response;

const wrapper = (store: ReturnType<typeof createMockStore>) => {
  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  return Wrapper;
};

const renderStream = () => {
  const store = createMockStore({ auth: { token: 'tok', user: null, isLoading: false } });
  const dispatchSpy = vi.spyOn(store, 'dispatch');
  const view = renderHook(() => useAIStream(), { wrapper: wrapper(store) });
  return { ...view, store, dispatchSpy };
};

describe('useAIStream', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('crypto', { randomUUID: (() => `id-${Math.random()}`) as Crypto['randomUUID'] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('appends an optimistic user turn and a streaming assistant turn on send', async () => {
    const io = controllableStream();
    fetchMock.mockResolvedValue(okResponse(io.stream));

    const { result } = renderStream();
    result.current.send('s1', 'hello');

    await waitFor(() => expect(result.current.pending).toHaveLength(2));
    const [user, assistant] = result.current.pending;
    expect(user).toMatchObject({ role: 'user', content: 'hello' });
    expect(assistant).toMatchObject({ role: 'assistant', content: '' });
    io.close();
  });

  it('accumulates delta text then finalizes on done, upserting usage and invalidating the session', async () => {
    const io = controllableStream();
    fetchMock.mockResolvedValue(okResponse(io.stream));

    const { result, store, dispatchSpy } = renderStream();
    const outcome = result.current.send('s1', 'hi');

    io.push(frame({ type: 'delta', text: 'Hel' }));
    io.push(frame({ type: 'delta', text: 'lo!' }));
    await waitFor(() => {
      const assistant = result.current.pending.find(m => m.role === 'assistant');
      expect(assistant?.content).toBe('Hello!');
    });

    const usage = { used: 3, limit: 500, scope: 'month' as const, month: '2026-07' };
    io.push(frame({ type: 'done', messageId: 'msg-9', usage }));
    io.close();

    await waitFor(() => {
      const assistant = result.current.pending.find(m => m.role === 'assistant');
      expect(assistant?.status).toBe('done');
    });
    expect(await outcome).toBe('done');

    // usage written straight into the getAIUsage cache
    const cached = aiApi.endpoints.getAIUsage.select()(store.getState()).data;
    expect(cached).toEqual(usage);
    // and the session tag invalidated so persisted history refetches
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: expect.stringContaining('invalidateTags') })
    );
    expect(result.current.isStreaming).toBe(false);
  });

  it('keeps the partial and flags the assistant turn on a terminal error event', async () => {
    const io = controllableStream();
    fetchMock.mockResolvedValue(okResponse(io.stream));

    const { result } = renderStream();
    const outcome = result.current.send('s1', 'hi');

    io.push(frame({ type: 'delta', text: 'partial' }));
    io.push(frame({ type: 'error', code: 'AI_PROVIDER_ERROR' }));
    io.close();

    expect(await outcome).toBe('error');
    await waitFor(() => {
      const assistant = result.current.pending.find(m => m.role === 'assistant');
      expect(assistant).toMatchObject({ content: 'partial', status: 'error' });
    });
  });

  it('abort() aborts the fetch and keeps the partial rendered', async () => {
    const io = controllableStream();
    // fetch honours the abort signal: reject the read with an AbortError-like throw.
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      init.signal?.addEventListener('abort', () => io.error());
      return Promise.resolve(okResponse(io.stream));
    });

    const { result } = renderStream();
    const outcome = result.current.send('s1', 'hi');

    io.push(frame({ type: 'delta', text: 'so far' }));
    await waitFor(() => {
      const assistant = result.current.pending.find(m => m.role === 'assistant');
      expect(assistant?.content).toBe('so far');
    });

    result.current.abort();
    expect(await outcome).toBe('aborted');
    await waitFor(() => {
      const assistant = result.current.pending.find(m => m.role === 'assistant');
      expect(assistant).toMatchObject({ content: 'so far', status: 'done' });
    });
    expect(result.current.isStreaming).toBe(false);
  });

  it('maps a pre-stream error to a retryable user turn keyed by error.code, not status', async () => {
    fetchMock.mockResolvedValue(errorResponse(429, 'AI_LIMIT_REACHED'));

    const { result } = renderStream();
    const outcome = result.current.send('s1', 'hi');

    expect(await outcome).toBe('error');
    await waitFor(() => {
      const user = result.current.pending.find(m => m.role === 'user');
      expect(user).toMatchObject({ status: 'error', errorCode: 'AI_LIMIT_REACHED' });
    });
  });

  it('rejects a second send while a stream is in flight (one-in-flight guard)', async () => {
    const io = controllableStream();
    fetchMock.mockResolvedValue(okResponse(io.stream));

    const { result } = renderStream();
    result.current.send('s1', 'first');
    await waitFor(() => expect(result.current.isStreaming).toBe(true));

    expect(await result.current.send('s1', 'second')).toBe('error');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    io.close();
  });

  it('retry() re-sends the last failed turn', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(502, 'AI_PROVIDER_ERROR'));

    const { result } = renderStream();
    expect(await result.current.send('s1', 'hi')).toBe('error');

    const io = controllableStream();
    fetchMock.mockResolvedValue(okResponse(io.stream));
    const retried = result.current.retry();
    io.push(frame({ type: 'delta', text: 'ok' }));
    io.push(frame({ type: 'done', messageId: 'm2', usage: { used: 1, limit: 5, scope: 'lifetime', month: null } }));
    io.close();

    expect(await retried).toBe('done');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
