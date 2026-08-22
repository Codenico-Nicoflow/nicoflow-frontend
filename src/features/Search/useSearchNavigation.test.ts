import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useSearchNavigation } from './useSearchNavigation';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('useSearchNavigation', () => {
  it('navigates to /notes/:id for a note result', () => {
    const { result } = renderHook(() => useSearchNavigation());

    result.current({
      kind: 'note',
      item: { id: 'note-1', title: 'Meeting minutes', excerpt: 'excerpt', projectName: 'Alpha', projectId: 'proj-1' },
    });

    expect(mockNavigate).toHaveBeenCalledWith('/notes/note-1');
  });
});
