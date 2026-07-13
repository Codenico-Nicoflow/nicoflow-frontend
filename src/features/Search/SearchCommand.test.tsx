import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SearchCommand } from './SearchCommand';

const API = 'http://localhost:8080/v1';

const mockResults = {
  tasks: [
    {
      id: 'task-1',
      title: 'Bucket task',
      excerpt: 'A task about bucket',
      projectName: 'Project A',
      projectId: 'proj-1',
    },
  ],
  projects: [{ id: 'proj-1', name: 'Project Alpha', areaName: 'Work' }],
  areas: [{ id: 'area-1', name: 'Work Area' }],
};

const envelope = <T,>(data: T) => ({ data, error: null });

const renderOpen = (onSelect = vi.fn(), onOpenChange = vi.fn()) =>
  renderComponent(<SearchCommand open={true} onOpenChange={onOpenChange} onSelect={onSelect} />);

describe('SearchCommand', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the search input when open', () => {
    renderOpen();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('does NOT fire a network request for 1-char input', async () => {
    let requestCount = 0;
    server.use(
      http.get(`${API}/search`, () => {
        requestCount += 1;
        return HttpResponse.json(envelope(mockResults));
      })
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderOpen();

    await user.type(screen.getByTestId('search-input'), 'b');
    act(() => vi.advanceTimersByTime(300));

    expect(requestCount).toBe(0);
  });

  it('fires exactly ONE request after debounce for a multi-char burst', async () => {
    let requestCount = 0;
    server.use(
      http.get(`${API}/search`, () => {
        requestCount += 1;
        return HttpResponse.json(envelope({ tasks: [], projects: [], areas: [] }));
      })
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderOpen();

    const input = screen.getByTestId('search-input');
    // Rapid burst
    await user.type(input, 'bu');
    await user.type(input, 'ck');
    await user.type(input, 'et');

    // Debounce has NOT elapsed yet — still 0 requests
    expect(requestCount).toBe(0);

    // Let the 200 ms debounce fire
    act(() => vi.advanceTimersByTime(250));

    await waitFor(() => expect(requestCount).toBe(1));
  });

  it('shows grouped results after a successful search', async () => {
    server.use(http.get(`${API}/search`, () => HttpResponse.json(envelope(mockResults))));

    vi.useRealTimers();
    const user = userEvent.setup();
    renderOpen();

    await user.type(screen.getByTestId('search-input'), 'bucket');

    await waitFor(() => expect(screen.getByTestId('result-task-task-1')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('result-project-proj-1')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('result-area-area-1')).toBeInTheDocument());
  });

  it('shows loading indicator while isFetching for ≥2-char query', async () => {
    // Never resolves — keeps the request in-flight
    server.use(http.get(`${API}/search`, () => new Promise(() => undefined)));

    vi.useRealTimers();
    const user = userEvent.setup();
    renderOpen();

    await user.type(screen.getByTestId('search-input'), 'bu');

    await waitFor(() => expect(screen.getByTestId('search-loading')).toBeInTheDocument());
  });

  it('shows empty state when results are empty after a settled query', async () => {
    server.use(http.get(`${API}/search`, () => HttpResponse.json(envelope({ tasks: [], projects: [], areas: [] }))));

    vi.useRealTimers();
    const user = userEvent.setup();
    renderOpen();

    await user.type(screen.getByTestId('search-input'), 'zzz');

    await waitFor(() => expect(screen.getByTestId('search-empty')).toBeInTheDocument());
  });

  it('calls onSelect with the correct payload and closes the palette', async () => {
    server.use(http.get(`${API}/search`, () => HttpResponse.json(envelope(mockResults))));

    vi.useRealTimers();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderComponent(<SearchCommand open={true} onOpenChange={onOpenChange} onSelect={onSelect} />);

    await user.type(screen.getByTestId('search-input'), 'bucket');
    await waitFor(() => expect(screen.getByTestId('result-task-task-1')).toBeInTheDocument());

    await user.click(screen.getByTestId('result-task-task-1'));

    expect(onSelect).toHaveBeenCalledWith({ kind: 'task', item: mockResults.tasks[0] });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
