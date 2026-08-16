import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import type { IBucket } from '@nicoflow/shared/types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { makeBucket } from '@/mocks/handlers';

import Bucket from './Bucket';

const API = 'http://localhost:8080/v1';

// A tiny in-memory bucket store so create/process mutations flow back through getBuckets.
const seedServer = (initial: IBucket[]) => {
  let items = [...initial];
  server.use(
    http.get(`${API}/bucket`, () => HttpResponse.json({ data: { items }, error: null })),
    http.post(`${API}/bucket`, async ({ request }) => {
      const { content } = (await request.json()) as { content: string };
      const created = makeBucket({ id: `b-${items.length + 1}`, content });
      items = [...items, created];
      return HttpResponse.json({ data: created, error: null });
    }),
    http.post(`${API}/bucket/:id/process`, ({ params }) => {
      const id = String(params['id']);
      items = items.map(b =>
        b.id === id ? { ...b, processedAt: '2026-07-13T00:00:00Z', processingResult: 'trash' } : b
      );
      return HttpResponse.json({
        data: { ...makeBucket({ id }), processedAt: '2026-07-13T00:00:00Z', processingResult: 'trash' },
        error: null,
      });
    })
  );
};

describe('Bucket page — capture → inbox → process → archived', () => {
  beforeEach(() => {
    // No projects → the process dialog only allows Trash, which needs no task form.
    server.use(http.get(`${API}/projects`, () => HttpResponse.json({ data: { items: [] }, error: null })));
  });

  it('captured content lands in the inbox tab', async () => {
    seedServer([]);
    const user = userEvent.setup();
    renderComponent(<Bucket />);

    const input = await screen.findByPlaceholderText(/capture anything/i);
    await user.type(input, 'A brand new thought');
    await user.click(screen.getByRole('button', { name: /add to bucket/i }));

    await waitFor(() => {
      const panel = screen.getByTestId('bucket-inbox-panel');
      expect(within(panel).getByText('A brand new thought')).toBeInTheDocument();
    });
  });

  it('processing an inbox item as trash moves it to the archived tab', async () => {
    seedServer([makeBucket({ id: 'b1', content: 'Old thought to trash' })]);
    const user = userEvent.setup();
    renderComponent(<Bucket />);

    const inboxPanel = await screen.findByTestId('bucket-inbox-panel');
    await waitFor(() => expect(within(inboxPanel).getByText('Old thought to trash')).toBeInTheDocument());

    // Click the card to open its actions menu, then Process.
    await user.click(within(inboxPanel).getByText('Old thought to trash'));
    await user.click(await screen.findByRole('menuitem', { name: /process/i }));

    // In the process dialog choose Trash, then confirm (create).
    await user.click(await screen.findByRole('button', { name: 'Trash' }));
    await user.click(screen.getByRole('button', { name: /create/i }));

    // The archived tab now carries the processed item.
    await user.click(screen.getByTestId('bucket-tab-archived'));
    await waitFor(() => {
      const archived = screen.getByTestId('bucket-archived-panel');
      expect(within(archived).getByText('Old thought to trash')).toBeInTheDocument();
    });
  });
});
