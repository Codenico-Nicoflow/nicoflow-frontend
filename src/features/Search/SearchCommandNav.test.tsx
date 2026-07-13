import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRecentSearches } from './recentSearches';
import { SearchCommand } from './SearchCommand';

const API = 'http://localhost:8080/v1';

const mockResults = {
  tasks: [{ id: 'task-1', title: 'My Task', excerpt: 'excerpt', projectName: 'Alpha', projectId: 'proj-1' }],
  projects: [{ id: 'proj-1', name: 'Project Alpha', areaName: 'Work' }],
  areas: [{ id: 'area-1', name: 'Work Area' }],
};

const envelope = <T,>(data: T) => ({ data, error: null });

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  clearRecentSearches();
  mockNavigate.mockClear();
  server.use(http.get(`${API}/search`, () => HttpResponse.json(envelope(mockResults))));
});

afterEach(() => {
  clearRecentSearches();
});

describe('SearchCommand — navigation', () => {
  it('calls navigate with /projects/:id when a project result is selected', async () => {
    const onOpenChange = vi.fn();
    const onSelect = vi.fn();
    const user = userEvent.setup();

    renderComponent(<SearchCommand open={true} onOpenChange={onOpenChange} onSelect={onSelect} />);

    await user.type(screen.getByTestId('search-input'), 'alpha');
    await waitFor(() => expect(screen.getByTestId('result-project-proj-1')).toBeInTheDocument());

    await user.click(screen.getByTestId('result-project-proj-1'));

    expect(onSelect).toHaveBeenCalledWith({ kind: 'project', item: mockResults.projects[0] });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes the palette after selecting any result', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    renderComponent(<SearchCommand open={true} onOpenChange={onOpenChange} />);
    await user.type(screen.getByTestId('search-input'), 'task');
    await waitFor(() => expect(screen.getByTestId('result-task-task-1')).toBeInTheDocument());
    await user.click(screen.getByTestId('result-task-task-1'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('SearchCommand — recent searches', () => {
  it('shows the Recent group when input is empty and recent list is non-empty', () => {
    const recent = ['bucket', 'alpha'];

    renderComponent(<SearchCommand open={true} onOpenChange={vi.fn()} recent={recent} />);

    expect(screen.getByTestId('group-recent')).toBeInTheDocument();
    expect(screen.getByTestId('result-recent-bucket')).toBeInTheDocument();
    expect(screen.getByTestId('result-recent-alpha')).toBeInTheDocument();
  });

  it('hides the Recent group when input is non-empty', async () => {
    const user = userEvent.setup();
    renderComponent(<SearchCommand open={true} onOpenChange={vi.fn()} recent={['bucket']} />);

    await user.type(screen.getByTestId('search-input'), 'x');
    expect(screen.queryByTestId('group-recent')).not.toBeInTheDocument();
  });

  it('does not render the Recent group when list is empty', () => {
    renderComponent(<SearchCommand open={true} onOpenChange={vi.fn()} recent={[]} />);

    expect(screen.queryByTestId('group-recent')).not.toBeInTheDocument();
  });

  it('fills the input when a recent term is clicked', async () => {
    const user = userEvent.setup();
    const onRecentSelect = vi.fn();

    renderComponent(
      <SearchCommand open={true} onOpenChange={vi.fn()} recent={['bucket']} onRecentSelect={onRecentSelect} />
    );

    await user.click(screen.getByTestId('result-recent-bucket'));

    await waitFor(() => {
      const input = screen.getByTestId('search-input') as HTMLInputElement;
      expect(input.value).toBe('bucket');
    });
  });
});
