import { createMockStore } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import type { TiptapDoc } from '@nicoflow/shared/types';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SaveStatus } from './types';
import { useNoteAutosave } from './useNoteAutosave';

const API = 'http://localhost:8080/v1';
const DEBOUNCE = 1500;

const doc = (text: string): TiptapDoc => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

const detail = (version: number) => ({
  id: 'n1',
  projectId: 'p1',
  title: 'Note',
  content: doc('body'),
  version,
  createdAt: '2026-03-01T08:00:00Z',
  updatedAt: '2026-03-01T08:00:00Z',
});

const wrapper = ({ children }: { children: ReactNode }) => <Provider store={createMockStore()}>{children}</Provider>;

const renderAutosave = (initialVersion = 1) =>
  renderHook(() => useNoteAutosave({ noteId: 'n1', initialVersion, debounceMs: DEBOUNCE }), { wrapper });

beforeEach(() => {
  // shouldAdvanceTime keeps the microtask queue draining under fake timers —
  // without it awaited RTK Query promises never settle and every test times out.
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useNoteAutosave debounce', () => {
  it('sends nothing while edits keep arriving, then exactly one save', async () => {
    let calls = 0;
    server.use(
      http.patch(`${API}/notes/n1`, () => {
        calls += 1;
        return HttpResponse.json({ data: detail(2), error: null });
      })
    );

    const { result } = renderAutosave();

    result.current.save({ content: doc('a') });
    vi.advanceTimersByTime(DEBOUNCE - 100);
    result.current.save({ content: doc('ab') });
    vi.advanceTimersByTime(DEBOUNCE - 100);
    result.current.save({ content: doc('abc') });

    expect(calls).toBe(0);

    vi.advanceTimersByTime(DEBOUNCE);

    await waitFor(() => expect(calls).toBe(1));
  });

  it('coalesces title and content edits into one request body', async () => {
    let body: unknown = null;
    server.use(
      http.patch(`${API}/notes/n1`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: detail(2), error: null });
      })
    );

    const { result } = renderAutosave(3);

    result.current.save({ title: 'Renamed' });
    result.current.save({ content: doc('body') });
    vi.advanceTimersByTime(DEBOUNCE);

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toEqual({ version: 3, title: 'Renamed', content: doc('body') });
  });
});

describe('useNoteAutosave status', () => {
  it('reports unsaved, then saving, then saved — never saved before the response', async () => {
    let resolve: (() => void) | undefined;
    server.use(
      http.patch(`${API}/notes/n1`, async () => {
        await new Promise<void>(r => {
          resolve = r;
        });
        return HttpResponse.json({ data: detail(2), error: null });
      })
    );

    const { result } = renderAutosave();
    expect(result.current.status).toBe(SaveStatus.IDLE);

    result.current.save({ content: doc('a') });
    await waitFor(() => expect(result.current.status).toBe(SaveStatus.UNSAVED));

    vi.advanceTimersByTime(DEBOUNCE);
    await waitFor(() => expect(result.current.status).toBe(SaveStatus.SAVING));

    resolve?.();
    await waitFor(() => expect(result.current.status).toBe(SaveStatus.SAVED));
  });

  it('surfaces an oversized body as an error status, not a silent no-op', async () => {
    server.use(
      http.patch(`${API}/notes/n1`, () =>
        HttpResponse.json({ data: null, error: { code: 'INVALID_INPUT', message: 'too large' } }, { status: 422 })
      )
    );

    const { result } = renderAutosave();

    result.current.save({ content: doc('enormous') });
    vi.advanceTimersByTime(DEBOUNCE);

    await waitFor(() => expect(result.current.status).toBe(SaveStatus.ERROR));
    expect(result.current.isConflicted).toBe(false);
  });
});

describe('useNoteAutosave version tracking', () => {
  it('adopts the version from a successful save and sends it on the next one', async () => {
    const versions: number[] = [];
    let next = 4;
    server.use(
      http.patch(`${API}/notes/n1`, async ({ request }) => {
        const body = (await request.json()) as { version: number };
        versions.push(body.version);
        return HttpResponse.json({ data: detail(next++), error: null });
      })
    );

    const { result } = renderAutosave(3);

    result.current.save({ content: doc('first') });
    vi.advanceTimersByTime(DEBOUNCE);
    await waitFor(() => expect(result.current.version).toBe(4));

    result.current.save({ content: doc('second') });
    vi.advanceTimersByTime(DEBOUNCE);
    await waitFor(() => expect(versions).toHaveLength(2));

    expect(versions).toEqual([3, 4]);
  });
});

describe('useNoteAutosave conflict', () => {
  it('halts permanently on 409 and never sends another request', async () => {
    let calls = 0;
    server.use(
      http.patch(`${API}/notes/n1`, () => {
        calls += 1;
        return HttpResponse.json({ data: null, error: { code: 'CONFLICT', message: 'stale' } }, { status: 409 });
      })
    );

    const { result } = renderAutosave();

    result.current.save({ content: doc('a') });
    vi.advanceTimersByTime(DEBOUNCE);

    await waitFor(() => expect(result.current.status).toBe(SaveStatus.CONFLICT));
    expect(result.current.isConflicted).toBe(true);
    expect(calls).toBe(1);

    // The user keeps typing — this is the retry-loop scenario the story exists
    // to prevent. Nothing further may reach the server.
    result.current.save({ content: doc('ab') });
    vi.advanceTimersByTime(DEBOUNCE * 5);
    result.current.save({ content: doc('abc') });
    vi.advanceTimersByTime(DEBOUNCE * 5);
    result.current.flush();
    vi.advanceTimersByTime(DEBOUNCE * 5);

    await waitFor(() => expect(result.current.status).toBe(SaveStatus.CONFLICT));
    expect(calls).toBe(1);
  });

  it('stays out of the saving state once conflicted', async () => {
    server.use(
      http.patch(`${API}/notes/n1`, () =>
        HttpResponse.json({ data: null, error: { code: 'CONFLICT', message: 'stale' } }, { status: 409 })
      )
    );

    const { result } = renderAutosave();
    result.current.save({ content: doc('a') });
    vi.advanceTimersByTime(DEBOUNCE);
    await waitFor(() => expect(result.current.isConflicted).toBe(true));

    result.current.save({ content: doc('b') });

    expect(result.current.status).toBe(SaveStatus.CONFLICT);
  });
});

describe('useNoteAutosave flush', () => {
  it('sends a pending edit immediately instead of waiting for the debounce', async () => {
    let calls = 0;
    server.use(
      http.patch(`${API}/notes/n1`, () => {
        calls += 1;
        return HttpResponse.json({ data: detail(2), error: null });
      })
    );

    const { result } = renderAutosave();

    result.current.save({ content: doc('a') });
    expect(calls).toBe(0);

    result.current.flush();

    await waitFor(() => expect(calls).toBe(1));
  });

  it('does not send anything when there is no pending edit', async () => {
    let calls = 0;
    server.use(
      http.patch(`${API}/notes/n1`, () => {
        calls += 1;
        return HttpResponse.json({ data: detail(2), error: null });
      })
    );

    const { result } = renderAutosave();
    result.current.flush();

    vi.advanceTimersByTime(DEBOUNCE * 2);
    expect(calls).toBe(0);
  });

  // AC6: closing the tab or navigating inside the debounce window must not
  // silently drop the last edit.
  it('flushes a pending edit on unmount', async () => {
    let calls = 0;
    server.use(
      http.patch(`${API}/notes/n1`, () => {
        calls += 1;
        return HttpResponse.json({ data: detail(2), error: null });
      })
    );

    const { result, unmount } = renderAutosave();

    result.current.save({ content: doc('unsaved work') });
    expect(calls).toBe(0);

    unmount();

    await waitFor(() => expect(calls).toBe(1));
  });

  // The unmount flush starts a request on the way out, so its response resolves
  // against a component that is already gone. Writing status there is a state
  // update on an unmounted tree — under test it lands after the environment is
  // torn down and fails the run as an unhandled rejection.
  it('does not update state once the response lands after unmount', async () => {
    let calls = 0;
    // Held open so the response is guaranteed to land after unmount, which is
    // the only ordering that reproduces the leak.
    let releaseRequest = () => {};
    const inFlight = new Promise<void>(resolve => {
      releaseRequest = resolve;
    });

    server.use(
      http.patch(`${API}/notes/n1`, async () => {
        calls += 1;
        await inFlight;
        return HttpResponse.json({ data: detail(2), error: null });
      })
    );

    const errors: unknown[] = [];
    const onError = (event: PromiseRejectionEvent | ErrorEvent) => errors.push(event);
    window.addEventListener('unhandledrejection', onError);
    window.addEventListener('error', onError);

    const { result, unmount } = renderAutosave();
    result.current.save({ content: doc('unsaved work') });
    unmount();

    await waitFor(() => expect(calls).toBe(1));
    releaseRequest();
    await waitFor(() => expect(errors).toHaveLength(0));

    window.removeEventListener('unhandledrejection', onError);
    window.removeEventListener('error', onError);
  });

  it('does not flush on unmount when conflicted', async () => {
    let calls = 0;
    server.use(
      http.patch(`${API}/notes/n1`, () => {
        calls += 1;
        return HttpResponse.json({ data: null, error: { code: 'CONFLICT', message: 'stale' } }, { status: 409 });
      })
    );

    const { result, unmount } = renderAutosave();

    result.current.save({ content: doc('a') });
    vi.advanceTimersByTime(DEBOUNCE);
    await waitFor(() => expect(result.current.isConflicted).toBe(true));

    result.current.save({ content: doc('b') });
    unmount();

    vi.advanceTimersByTime(DEBOUNCE * 2);
    expect(calls).toBe(1);
  });
});
