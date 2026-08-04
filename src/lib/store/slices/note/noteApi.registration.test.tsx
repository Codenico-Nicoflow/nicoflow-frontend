import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { useGetNotesQuery } from '@/lib/store';

const API = 'http://localhost:8080/v1';

// An unregistered slice fails silently in tests and stories rather than in the
// app: the hook never resolves instead of throwing. Rendering a real consumer
// through the shared helper is the only thing that catches it, so this asserts
// resolution rather than the reducer key being present.
const NotesProbe = () => {
  const { data, isLoading } = useGetNotesQuery({ projectId: 'p1' });

  if (isLoading) return <p>loading</p>;
  return <p>{data?.length ?? 0} notes</p>;
};

describe('noteApi registration', () => {
  it('resolves through the shared test render helper', async () => {
    server.use(
      http.get(`${API}/notes`, () =>
        HttpResponse.json({
          data: [
            {
              id: 'n1',
              projectId: 'p1',
              title: 'Note',
              excerpt: 'x',
              version: 1,
              createdAt: '2026-03-01T08:00:00Z',
              updatedAt: '2026-03-01T08:00:00Z',
            },
          ],
          error: null,
        })
      )
    );

    renderComponent(<NotesProbe />);

    await waitFor(() => expect(screen.getByText('1 notes')).toBeInTheDocument());
  });
});
