import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

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

describe('BucketProcessDialog note destination', () => {
  const pickNote = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'Note' }));
  };

  it('offers Note as a selectable destination alongside Task and Trash', async () => {
    withOneProject();
    renderComponent(<BucketProcessDialog bucket={makeBucket({ id: 'b1' })} open onOpenChange={() => {}} />);

    const note = await screen.findByRole('button', { name: 'Note' });

    expect(note).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Task' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trash' })).toBeInTheDocument();
  });

  it('prefills the title and body from the captured text', async () => {
    withOneProject();
    const user = userEvent.setup();
    const bucket = makeBucket({ id: 'b1', content: 'Research pricing\nCompare three vendors' });

    renderComponent(<BucketProcessDialog bucket={bucket} open onOpenChange={() => {}} />);
    await screen.findByRole('button', { name: 'Note' });
    await pickNote(user);

    // Title takes the first line only (single-line input); the body keeps it all.
    expect(screen.getByTestId('process-note-title')).toHaveValue('Research pricing');
    expect(screen.getByTestId('process-note-body')).toHaveValue('Research pricing\nCompare three vendors');
  });

  // Capture allows 500 chars; a note title caps at 255. The field shows the
  // truncated value so the user sees what will actually be saved.
  it('truncates a 400-character capture to 255 in the title field', async () => {
    withOneProject();
    const user = userEvent.setup();
    const bucket = makeBucket({ id: 'b1', content: 'x'.repeat(400) });

    renderComponent(<BucketProcessDialog bucket={bucket} open onOpenChange={() => {}} />);
    await screen.findByRole('button', { name: 'Note' });
    await pickNote(user);

    expect((screen.getByTestId('process-note-title') as HTMLInputElement).value).toHaveLength(255);
    expect((screen.getByTestId('process-note-body') as HTMLTextAreaElement).value).toHaveLength(400);
  });

  it('posts the note payload with the selected project', async () => {
    withOneProject();
    let body: { processingResult?: string; projectId?: string; noteDetails?: { title?: string } } | undefined;
    server.use(
      http.post(`${API}/bucket/b1/process`, async ({ request }) => {
        body = (await request.json()) as typeof body;
        return HttpResponse.json({ data: makeBucket({ id: 'b1', createdNoteId: 'n9' }), error: null });
      })
    );

    const user = userEvent.setup();
    renderComponent(
      <BucketProcessDialog
        bucket={makeBucket({ id: 'b1', content: 'Captured thought' })}
        open
        onOpenChange={() => {}}
      />
    );

    await screen.findByRole('button', { name: 'Note' });
    await pickNote(user);
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => expect(body).toBeDefined());
    expect(body?.processingResult).toBe('note');
    expect(body?.projectId).toBe('p1');
    expect(body?.noteDetails?.title).toBe('Captured thought');
  });

  it('blocks submitting when there is no project to file the note under', async () => {
    server.use(http.get(`${API}/projects`, () => HttpResponse.json({ data: { items: [] }, error: null })));
    const user = userEvent.setup();

    renderComponent(<BucketProcessDialog bucket={makeBucket({ id: 'b1' })} open onOpenChange={() => {}} />);

    await screen.findByRole('button', { name: 'Note' });
    await pickNote(user);

    expect(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON)).toBeDisabled();
    expect(screen.queryByTestId('process-note-title')).not.toBeInTheDocument();
  });

  it('surfaces a 409 when the item was already processed elsewhere', async () => {
    withOneProject();
    server.use(
      http.post(`${API}/bucket/b1/process`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'CONFLICT', message: 'bucket item is already processed' } },
          { status: 409 }
        )
      )
    );

    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderComponent(
      <BucketProcessDialog bucket={makeBucket({ id: 'b1', content: 'Captured' })} open onOpenChange={onOpenChange} />
    );

    await screen.findByRole('button', { name: 'Note' });
    await pickNote(user);
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    // The dialog stays open on failure rather than closing over a lost edit.
    await waitFor(() => expect(onOpenChange).not.toHaveBeenCalledWith(false));
  });
});
