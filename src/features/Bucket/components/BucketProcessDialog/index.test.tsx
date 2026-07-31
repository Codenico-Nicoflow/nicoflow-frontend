import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { FORM_DIALOG_SUBMIT_BUTTON } from '@/lib/test_ids';
import { makeBucket } from '@/mocks/handlers';

import { BucketProcessDialog } from './index';

const API = 'http://localhost:8080/v1';

const withOneProject = () =>
  server.use(
    http.get(`${API}/projects`, () =>
      HttpResponse.json({ data: { items: [{ id: 'p1', name: 'Inbox project' }] }, error: null })
    )
  );

describe('BucketProcessDialog pre-fill (parseBucketContent)', () => {
  it('pre-fills the task title from the first line and notes from the rest', async () => {
    withOneProject();
    const bucket = makeBucket({ id: 'b1', content: 'Buy milk\nfrom the corner shop' });

    renderComponent(<BucketProcessDialog bucket={bucket} open onOpenChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('name-input')).toHaveValue('Buy milk');
    });
    expect(screen.getByTestId('description-textarea')).toHaveValue('from the corner shop');
  });

  it('pre-fills only the title when the content is a single line', async () => {
    withOneProject();
    const bucket = makeBucket({ id: 'b2', content: 'Call the dentist' });

    renderComponent(<BucketProcessDialog bucket={bucket} open onOpenChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('name-input')).toHaveValue('Call the dentist');
    });
    expect(screen.getByTestId('description-textarea')).toHaveValue('');
  });
});

describe('BucketProcessDialog scheduling', () => {
  it('sends the picked scheduledFor with the rest of the task details', async () => {
    withOneProject();
    let body: { taskDetails?: { scheduledFor?: string; energy?: string; rollsOver?: boolean } } | undefined;
    server.use(
      http.post(`${API}/bucket/b3/process`, async ({ request }) => {
        body = (await request.json()) as typeof body;
        return HttpResponse.json({ data: makeBucket({ id: 'b3' }), error: null });
      })
    );

    const user = userEvent.setup();
    renderComponent(
      <BucketProcessDialog bucket={makeBucket({ id: 'b3', content: 'Book flights' })} open onOpenChange={() => {}} />
    );

    await waitFor(() => expect(screen.getByTestId('name-input')).toHaveValue('Book flights'));

    // Past days are disabled, so pick the last selectable cell — the day button
    // inside the gridcell is what actually commits the date.
    await user.click(screen.getByTestId('scheduled-for-trigger'));
    const cells = within(screen.getByTestId('scheduled-for-calendar'))
      .getAllByRole('gridcell')
      .filter(cell => cell.getAttribute('aria-disabled') !== 'true' && cell.textContent);
    await user.click(within(cells[cells.length - 1]!).getByRole('button'));
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => expect(body?.taskDetails?.scheduledFor).toMatch(/^\d{4}-\d{2}-\d{2}$/));
    // The dialog's other scheduling inputs must survive the trip too — they were
    // rendered but silently dropped before.
    expect(body?.taskDetails?.energy).toBe('medium');
    expect(body?.taskDetails?.rollsOver).toBe(true);
  });
});
