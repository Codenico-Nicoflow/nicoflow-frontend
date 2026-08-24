import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { FORM_DIALOG_SUBMIT_BUTTON } from '@/lib/test_ids';
import { makeBucket, makeUser } from '@/mocks/handlers';

import { BucketProcessDialog } from './index';

// uploadToS3 is raw XHR outside RTK Query — mocked at the module seam.
const uploadToS3 = vi.hoisted(() => vi.fn());
vi.mock('@/lib/utils', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return { ...actual, uploadToS3 };
});

const proStore = () => createMockStore({ auth: { user: makeUser({ status: 'premium' }) } });

const API = 'http://localhost:8080/v1';

const withOneProject = () =>
  server.use(
    http.get(`${API}/projects`, () =>
      HttpResponse.json({ data: { items: [{ id: 'p1', name: 'Inbox project' }] }, error: null })
    )
  );

// Choosing "Task" (the default type) and continuing swaps this dialog out for
// TaskDialog in create mode — TaskDialog owns the fields from here on.
const continueToTaskDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));
};

// TaskDialog always shows its own project picker on a project-less create —
// bucket processing never pins one via `projectId`, since the item could file
// into any project.
const pickTaskDialogProject = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByTestId('select-trigger'));
  await user.click(await screen.findByRole('option', { name }));
};

describe('BucketProcessDialog task delegation (opens TaskDialog)', () => {
  it('pre-fills the task title from the first line and notes from the rest', async () => {
    withOneProject();
    const bucket = makeBucket({ id: 'b1', content: 'Buy milk\nfrom the corner shop' });
    const user = userEvent.setup();

    renderComponent(<BucketProcessDialog bucket={bucket} open onOpenChange={() => {}} />);
    await screen.findByText(/buy milk/i);
    await continueToTaskDialog(user);

    await waitFor(() => {
      expect(screen.getByTestId('name-input')).toHaveValue('Buy milk');
    });
    expect(screen.getByTestId('description-textarea')).toHaveValue('from the corner shop');
  });

  it('pre-fills only the title when the content is a single line', async () => {
    withOneProject();
    const bucket = makeBucket({ id: 'b2', content: 'Call the dentist' });
    const user = userEvent.setup();

    renderComponent(<BucketProcessDialog bucket={bucket} open onOpenChange={() => {}} />);
    await screen.findByText(/call the dentist/i);
    await continueToTaskDialog(user);

    await waitFor(() => {
      expect(screen.getByTestId('name-input')).toHaveValue('Call the dentist');
    });
    expect(screen.getByTestId('description-textarea')).toHaveValue('');
  });

  it('sends the picked scheduledFor with the rest of the task details, and marks the bucket item processed', async () => {
    withOneProject();
    let body: { taskDetails?: { scheduledFor?: string; energy?: string; rollsOver?: boolean } } | undefined;
    server.use(
      http.post(`${API}/bucket/b3/process`, async ({ request }) => {
        body = (await request.json()) as typeof body;
        return HttpResponse.json({ data: makeBucket({ id: 'b3', createdTaskId: 't1' }), error: null });
      })
    );

    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderComponent(
      <BucketProcessDialog
        bucket={makeBucket({ id: 'b3', content: 'Book flights' })}
        open
        onOpenChange={onOpenChange}
      />
    );

    await screen.findByText(/book flights/i);
    await continueToTaskDialog(user);
    await waitFor(() => expect(screen.getByTestId('name-input')).toHaveValue('Book flights'));
    await pickTaskDialogProject(user, 'Inbox project');

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
    // Task creation and marking the bucket item processed happen in the same
    // POST /bucket/:id/process call — success closes the whole flow.
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('surfaces a plan-limit error inline on TaskDialog without closing the flow', async () => {
    withOneProject();
    server.use(
      http.post(`${API}/bucket/b1/process`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'PLAN_LIMIT_EXCEEDED', message: 'plan limit exceeded' } },
          { status: 403 }
        )
      )
    );

    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderComponent(
      <BucketProcessDialog
        bucket={makeBucket({ id: 'b1', content: 'Blocked task' })}
        open
        onOpenChange={onOpenChange}
      />
    );

    await screen.findByText(/blocked task/i);
    await continueToTaskDialog(user);
    await waitFor(() => expect(screen.getByTestId('name-input')).toHaveValue('Blocked task'));
    await pickTaskDialogProject(user, 'Inbox project');
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await screen.findByTestId('plan-limit-alert');
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('shows the scheduledTime input and recurrence toggle in delegated-create mode', async () => {
    withOneProject();
    const user = userEvent.setup();

    renderComponent(
      <BucketProcessDialog bucket={makeBucket({ id: 'b1', content: 'Timed task' })} open onOpenChange={() => {}} />
    );
    await screen.findByText(/timed task/i);
    await continueToTaskDialog(user);

    await waitFor(() => expect(screen.getByTestId('scheduling-block')).toBeInTheDocument());
    expect(screen.getByTestId('scheduled-time-input')).toBeInTheDocument();
    expect(screen.getByTestId('recurrence-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('staged-attachment-picker')).toBeInTheDocument();
  });

  it('sends scheduledTime through to processBucket when set', async () => {
    withOneProject();
    let body: { taskDetails?: { scheduledFor?: string; scheduledTime?: string } } | undefined;
    server.use(
      http.post(`${API}/bucket/b5/process`, async ({ request }) => {
        body = (await request.json()) as typeof body;
        return HttpResponse.json({ data: makeBucket({ id: 'b5', createdTaskId: 't5' }), error: null });
      })
    );

    const user = userEvent.setup();
    renderComponent(
      <BucketProcessDialog bucket={makeBucket({ id: 'b5', content: 'Stand-up' })} open onOpenChange={() => {}} />
    );

    await screen.findByText(/stand-up/i);
    await continueToTaskDialog(user);
    await waitFor(() => expect(screen.getByTestId('name-input')).toHaveValue('Stand-up'));
    await pickTaskDialogProject(user, 'Inbox project');

    // Pick a scheduled date so the time input becomes active.
    await user.click(screen.getByTestId('scheduled-for-trigger'));
    const cells = within(screen.getByTestId('scheduled-for-calendar'))
      .getAllByRole('gridcell')
      .filter(cell => cell.getAttribute('aria-disabled') !== 'true' && cell.textContent);
    await user.click(within(cells[cells.length - 1]!).getByRole('button'));

    fireEvent.change(screen.getByTestId('scheduled-time-input'), { target: { value: '14:00' } });
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => expect(body?.taskDetails?.scheduledTime).toBe('14:00'));
  });

  it('sends recurrence through to processBucket when set', async () => {
    withOneProject();
    let body: { taskDetails?: { recurrence?: { freq: string } } } | undefined;
    server.use(
      http.post(`${API}/bucket/b6/process`, async ({ request }) => {
        body = (await request.json()) as typeof body;
        return HttpResponse.json({ data: makeBucket({ id: 'b6', createdTaskId: 't6' }), error: null });
      })
    );

    const user = userEvent.setup();
    renderComponent(
      <BucketProcessDialog bucket={makeBucket({ id: 'b6', content: 'Daily standup' })} open onOpenChange={() => {}} />
    );

    await screen.findByText(/daily standup/i);
    await continueToTaskDialog(user);
    await waitFor(() => expect(screen.getByTestId('name-input')).toHaveValue('Daily standup'));
    await pickTaskDialogProject(user, 'Inbox project');

    await user.click(screen.getByTestId('recurrence-toggle'));
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => expect(body?.taskDetails?.recurrence?.freq).toBeDefined());
  });

  it('uploads staged files using the createdTaskId from processBucket response', async () => {
    withOneProject();
    uploadToS3.mockResolvedValue(undefined);
    let uploadUrlBody: Record<string, unknown> | undefined;

    server.use(
      http.post(`${API}/bucket/b7/process`, () =>
        HttpResponse.json({ data: makeBucket({ id: 'b7', createdTaskId: 'task-from-bucket' }), error: null })
      ),
      http.post(`${API}/attachments/upload-url`, async ({ request }) => {
        uploadUrlBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          data: { url: 'https://s3.test', headers: { 'Content-Type': 'application/pdf' }, s3Key: 's3/k' },
          error: null,
        });
      }),
      http.post(`${API}/attachments`, () =>
        HttpResponse.json(
          {
            data: {
              id: 'att-3',
              ownerType: 'task',
              ownerId: 'task-from-bucket',
              fileName: 'file.pdf',
              fileSize: 4,
              mimeType: 'application/pdf',
              createdAt: '2026-08-24T00:00:00Z',
            },
            error: null,
          },
          { status: 201 }
        )
      )
    );

    const user = userEvent.setup();
    renderComponent(
      <BucketProcessDialog
        bucket={makeBucket({ id: 'b7', content: 'With attachment' })}
        open
        onOpenChange={() => {}}
      />,
      { store: proStore() }
    );

    await screen.findByText(/with attachment/i);
    await continueToTaskDialog(user);
    await waitFor(() => expect(screen.getByTestId('name-input')).toHaveValue('With attachment'));
    await pickTaskDialogProject(user, 'Inbox project');

    await user.upload(
      screen.getByTestId('upload-zone-input'),
      new File(['data'], 'file.pdf', { type: 'application/pdf' })
    );
    await screen.findByTestId('staged-file-0');
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() =>
      expect(uploadUrlBody).toMatchObject({ ownerType: 'task', ownerId: 'task-from-bucket', fileName: 'file.pdf' })
    );
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
