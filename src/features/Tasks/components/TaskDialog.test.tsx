import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FORM_DIALOG_SUBMIT_BUTTON } from '@/lib/test_ids';
import { makeSubtask, makeTask, makeUser } from '@/mocks/handlers';

import TaskDialog from './TaskDialog';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// uploadToS3 is raw XHR outside RTK Query — mocked at the module seam, same as
// AttachmentSection's own tests. The real transport has its own unit test.
const uploadToS3 = vi.hoisted(() => vi.fn());
vi.mock('@/lib/utils', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return { ...actual, uploadToS3 };
});

const envelope = <T,>(data: T) => ({ data, error: null });
const items = <T,>(list: T[]) => ({ data: { items: list }, error: null });

const API = 'http://localhost:8080/v1';

const proStore = () => createMockStore({ auth: { user: makeUser({ status: 'premium' }) } });
const freeStore = () => createMockStore({ auth: { user: makeUser({ status: 'regular' }) } });

afterEach(() => uploadToS3.mockReset());

describe('TaskDialog — create mode', () => {
  it('creates a task with energy + soft scheduledFor and posts to the project', async () => {
    let postedBody: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API}/projects/project-1/tasks`, async ({ request }) => {
        postedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(envelope(makeTask({ title: 'Write spec' })), { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderComponent(<TaskDialog open onOpenChange={vi.fn()} projectId="project-1" />);

    await user.type(screen.getByPlaceholderText('Enter task name'), 'Write spec');
    await user.click(screen.getByTestId('energy-option-deep'));
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(postedBody).toMatchObject({ title: 'Write spec', energy: 'deep', rollsOver: true });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows the inline upgrade CTA (no generic error toast) on PLAN_LIMIT_EXCEEDED', async () => {
    server.use(
      http.post(`${API}/projects/project-1/tasks`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'PLAN_LIMIT_EXCEEDED', message: 'plan limit exceeded' } },
          { status: 403 }
        )
      )
    );

    const user = userEvent.setup();
    renderComponent(<TaskDialog open onOpenChange={vi.fn()} projectId="project-1" />);

    await user.type(screen.getByPlaceholderText('Enter task name'), 'Blocked task');
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => expect(screen.getByTestId('plan-limit-alert')).toBeInTheDocument());
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('names the time when the refused field was the time, not the task count', async () => {
    server.use(
      http.post(`${API}/projects/project-1/tasks`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'PLAN_LIMIT_EXCEEDED', message: 'timed scheduling requires pro' } },
          { status: 403 }
        )
      )
    );

    const user = userEvent.setup();
    renderComponent(<TaskDialog open onOpenChange={vi.fn()} projectId="project-1" />);

    await user.type(screen.getByPlaceholderText('Enter task name'), 'Timed task');
    // A date first — the time input is inert without one.
    await user.click(screen.getByTestId('scheduled-for-trigger'));
    await user.click(within(screen.getByTestId('scheduled-for-calendar')).getAllByRole('gridcell')[20]!);
    fireEvent.change(screen.getByTestId('scheduled-time-input'), { target: { value: '09:00' } });
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    const alert = await screen.findByTestId('plan-limit-alert');
    expect(alert).toHaveTextContent(/time/i);
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('TaskDialog — edit mode', () => {
  const task = makeTask({ id: 'task-9', title: 'Existing task', energy: 'medium' });

  it('pre-populates from the task and shows the scheduling block', async () => {
    server.use(
      http.get(`${API}/tasks/task-9/subtasks`, () => HttpResponse.json(items([]))),
      http.get(`${API}/attachments`, () => HttpResponse.json(envelope([])))
    );

    renderComponent(<TaskDialog open onOpenChange={vi.fn()} projectId="project-1" task={task} />);

    await waitFor(() => expect(screen.getByPlaceholderText('Enter task name')).toHaveValue('Existing task'));
    expect(screen.getByTestId('scheduling-block')).toBeInTheDocument();
  });

  it('changes time and duration from the form — the keyboard path to move and resize', async () => {
    const scheduled = makeTask({
      id: 'task-10',
      title: 'Standup',
      scheduledFor: '2026-08-05',
      scheduledTime: '09:00',
      estimatedMinutes: 30,
    });
    let patchBody: Record<string, unknown> | undefined;
    server.use(
      http.get(`${API}/tasks/task-10/subtasks`, () => HttpResponse.json(items([]))),
      http.get(`${API}/attachments`, () => HttpResponse.json(envelope([]))),
      http.patch(`${API}/tasks/task-10`, async ({ request }) => {
        patchBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(envelope({ ...scheduled, ...patchBody }));
      })
    );

    const user = userEvent.setup();
    renderComponent(<TaskDialog open onOpenChange={vi.fn()} projectId="project-1" task={scheduled} />);

    const timeInput = await screen.findByTestId('scheduled-time-input');
    expect(timeInput).toHaveValue('09:00');
    fireEvent.change(timeInput, { target: { value: '11:00' } });
    await user.click(screen.getByTestId('chip-60'));
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => expect(patchBody).toMatchObject({ scheduledTime: '11:00', estimatedMinutes: 60 }));
  });

  it('adds, toggles and deletes a subtask through the accordion', async () => {
    const subtask = makeSubtask({ id: 'sub-1', taskId: 'task-9', title: 'Draft outline' });
    let toggledDone: unknown = undefined;
    let deleted = false;

    server.use(
      http.get(`${API}/attachments`, () => HttpResponse.json(envelope([]))),
      http.get(`${API}/tasks/task-9/subtasks`, () => HttpResponse.json(items([subtask]))),
      http.post(`${API}/tasks/task-9/subtasks`, async ({ request }) => {
        const body = (await request.json()) as { title: string };
        return HttpResponse.json(envelope(makeSubtask({ id: 'sub-2', title: body.title, position: 1 })), {
          status: 201,
        });
      }),
      http.patch(`${API}/tasks/task-9/subtasks/sub-1`, async ({ request }) => {
        const body = (await request.json()) as { done?: boolean };
        toggledDone = body.done;
        return HttpResponse.json(envelope({ ...subtask, done: body.done ?? false }));
      }),
      http.delete(`${API}/tasks/task-9/subtasks/sub-1`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const user = userEvent.setup();
    renderComponent(<TaskDialog open onOpenChange={vi.fn()} projectId="project-1" task={task} />);

    // Existing subtask renders (ordered by position).
    await waitFor(() => expect(screen.getByTestId('subtask-row-sub-1')).toBeInTheDocument());

    // Toggle done.
    await user.click(screen.getByTestId('subtask-checkbox-sub-1'));
    await waitFor(() => expect(toggledDone).toBe(true));

    // Add a new one.
    await user.type(screen.getByTestId('subtask-add-input'), 'Second subtask');
    await user.click(screen.getByTestId('subtask-add-button'));
    await waitFor(() => expect(screen.getByTestId('subtask-add-input')).toHaveValue(''));

    // Delete the first.
    await user.click(within(screen.getByTestId('subtask-row-sub-1')).getByTestId('subtask-delete-sub-1'));
    await waitFor(() => expect(deleted).toBe(true));
  });

  it('shows the recurrence field in edit mode', async () => {
    server.use(
      http.get(`${API}/tasks/task-9/subtasks`, () => HttpResponse.json(items([]))),
      http.get(`${API}/attachments`, () => HttpResponse.json(envelope([])))
    );

    renderComponent(<TaskDialog open onOpenChange={vi.fn()} projectId="project-1" task={task} />);

    expect(await screen.findByTestId('recurrence-toggle')).toBeInTheDocument();
  });

  it('shows the project picker pre-selected with the task current project', async () => {
    server.use(
      http.get(`${API}/tasks/task-9/subtasks`, () => HttpResponse.json(items([]))),
      http.get(`${API}/attachments`, () => HttpResponse.json(envelope([]))),
      http.get(`${API}/projects`, () =>
        HttpResponse.json(
          items([
            { id: 'project-1', name: 'Current Project' },
            { id: 'project-2', name: 'Other Project' },
          ])
        )
      )
    );

    renderComponent(<TaskDialog open onOpenChange={vi.fn()} projectId="project-1" task={task} />);

    await waitFor(() => expect(screen.getByTestId('select-trigger')).toHaveTextContent('Current Project'));
  });

  it('reassigns the project and saves projectId in the update payload', async () => {
    let patchBody: Record<string, unknown> | undefined;
    server.use(
      http.get(`${API}/tasks/task-9/subtasks`, () => HttpResponse.json(items([]))),
      http.get(`${API}/attachments`, () => HttpResponse.json(envelope([]))),
      http.get(`${API}/projects`, () =>
        HttpResponse.json(
          items([
            { id: 'project-1', name: 'Current Project' },
            { id: 'project-2', name: 'Other Project' },
          ])
        )
      ),
      http.patch(`${API}/tasks/task-9`, async ({ request }) => {
        patchBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(envelope({ ...task, ...patchBody }));
      })
    );

    const user = userEvent.setup();
    renderComponent(<TaskDialog open onOpenChange={vi.fn()} projectId="project-1" task={task} />);

    await waitFor(() => expect(screen.getByTestId('select-trigger')).toHaveTextContent('Current Project'));
    await user.click(screen.getByTestId('select-trigger'));
    await user.click(await screen.findByRole('option', { name: 'Other Project' }));
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => expect(patchBody).toMatchObject({ projectId: 'project-2' }));
  });

  it('saving recurrence on edit calls createRecurrenceRule, not a plain task update', async () => {
    let createRuleBody: Record<string, unknown> | undefined;
    let taskPatched = false;
    server.use(
      http.get(`${API}/tasks/task-9/subtasks`, () => HttpResponse.json(items([]))),
      http.get(`${API}/attachments`, () => HttpResponse.json(envelope([]))),
      http.post(`${API}/projects/project-1/recurrence-rules`, async ({ request }) => {
        createRuleBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(envelope({ id: 'rule-1', ...createRuleBody }), { status: 201 });
      }),
      http.patch(`${API}/tasks/task-9`, () => {
        taskPatched = true;
        return HttpResponse.json(envelope(task));
      })
    );

    const user = userEvent.setup();
    renderComponent(<TaskDialog open onOpenChange={vi.fn()} projectId="project-1" task={task} />);

    await screen.findByTestId('recurrence-toggle');
    await user.click(screen.getByTestId('recurrence-toggle'));
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(createRuleBody).toMatchObject({ title: 'Existing task' });
    expect(taskPatched).toBe(false);
  });
});

describe('TaskDialog — delegated create (onCreateSubmit)', () => {
  const withProject = () =>
    server.use(http.get(`${API}/projects`, () => HttpResponse.json(items([{ id: 'p1', name: 'My Project' }]))));

  it('shows scheduledTime, recurrence, and attachments fields in delegated-create mode', async () => {
    withProject();
    const onCreateSubmit = vi.fn().mockResolvedValue(undefined);
    renderComponent(<TaskDialog open onOpenChange={vi.fn()} onCreateSubmit={onCreateSubmit} />, {
      store: proStore(),
    });

    // The project picker is visible (no projectId → needsProjectPicker) — wait for it.
    await waitFor(() => expect(screen.getByTestId('select-trigger')).toBeInTheDocument());
    expect(screen.getByTestId('scheduling-block')).toBeInTheDocument();
    expect(screen.getByTestId('scheduled-time-input')).toBeInTheDocument();
    expect(screen.getByTestId('recurrence-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('staged-attachment-picker')).toBeInTheDocument();
  });

  it('passes recurrence as the third argument to onCreateSubmit', async () => {
    withProject();
    const onCreateSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderComponent(<TaskDialog open onOpenChange={vi.fn()} onCreateSubmit={onCreateSubmit} />, {
      store: proStore(),
    });

    await waitFor(() => expect(screen.getByTestId('select-trigger')).toBeInTheDocument());
    await user.type(screen.getByPlaceholderText('Enter task name'), 'Recurring task');
    await user.click(screen.getByTestId('recurrence-toggle'));
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => expect(onCreateSubmit).toHaveBeenCalled());
    const [, , passedRecurrence] = onCreateSubmit.mock.calls[0] as [unknown, unknown, { freq: string } | null];
    expect(passedRecurrence).not.toBeNull();
    expect(passedRecurrence?.freq).toBeDefined();
  });

  it('uploads staged files using the taskId returned by onCreateSubmit', async () => {
    withProject();
    uploadToS3.mockResolvedValue(undefined);
    const onCreateSubmit = vi.fn().mockResolvedValue({ taskId: 'delegated-task-1' });
    let uploadUrlBody: Record<string, unknown> | undefined;

    server.use(
      http.post(`${API}/attachments/upload-url`, async ({ request }) => {
        uploadUrlBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          envelope({ url: 'https://s3.test', headers: { 'Content-Type': 'application/pdf' }, s3Key: 's3/k' })
        );
      }),
      http.post(`${API}/attachments`, () =>
        HttpResponse.json(
          envelope({
            id: 'att-2',
            ownerType: 'task',
            ownerId: 'delegated-task-1',
            fileName: 'brief.pdf',
            fileSize: 4,
            mimeType: 'application/pdf',
            createdAt: '2026-08-24T00:00:00Z',
          }),
          { status: 201 }
        )
      )
    );

    const user = userEvent.setup();
    renderComponent(<TaskDialog open onOpenChange={vi.fn()} onCreateSubmit={onCreateSubmit} />, {
      store: proStore(),
    });

    await waitFor(() => expect(screen.getByTestId('select-trigger')).toBeInTheDocument());
    await user.type(screen.getByPlaceholderText('Enter task name'), 'Delegated task');
    await user.upload(
      screen.getByTestId('upload-zone-input'),
      new File(['data'], 'brief.pdf', { type: 'application/pdf' })
    );
    await screen.findByTestId('staged-file-0');
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => expect(onCreateSubmit).toHaveBeenCalled());
    await waitFor(() =>
      expect(uploadUrlBody).toMatchObject({ ownerType: 'task', ownerId: 'delegated-task-1', fileName: 'brief.pdf' })
    );
  });

  it('skips staged-file upload when onCreateSubmit returns void', async () => {
    withProject();
    const onCreateSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderComponent(<TaskDialog open onOpenChange={vi.fn()} onCreateSubmit={onCreateSubmit} />, {
      store: proStore(),
    });

    await waitFor(() => expect(screen.getByTestId('select-trigger')).toBeInTheDocument());
    await user.type(screen.getByPlaceholderText('Enter task name'), 'No upload');
    await user.upload(
      screen.getByTestId('upload-zone-input'),
      new File(['data'], 'skip.pdf', { type: 'application/pdf' })
    );
    await screen.findByTestId('staged-file-0');
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => expect(onCreateSubmit).toHaveBeenCalled());
    expect(uploadToS3).not.toHaveBeenCalled();
  });
});

describe('TaskDialog — create mode staged attachments', () => {
  const pdf = (name: string) => new File(['data'], name, { type: 'application/pdf' });

  it('renders the staged attachment picker in create mode', () => {
    renderComponent(<TaskDialog open onOpenChange={vi.fn()} projectId="project-1" />, { store: freeStore() });
    expect(screen.getByTestId('staged-attachment-picker')).toBeInTheDocument();
  });

  it('shows the locked Pro-gate state for a free-plan user, blocking file selection', () => {
    renderComponent(<TaskDialog open onOpenChange={vi.fn()} projectId="project-1" />, { store: freeStore() });

    expect(screen.getByTestId('attachment-pro-gate')).toBeInTheDocument();
    expect(screen.queryByTestId('upload-zone')).not.toBeInTheDocument();
    expect(screen.queryByTestId('upload-zone-input')).not.toBeInTheDocument();
  });

  it('lets a Pro user stage a file locally without uploading it yet', async () => {
    const user = userEvent.setup();
    renderComponent(<TaskDialog open onOpenChange={vi.fn()} projectId="project-1" />, { store: proStore() });

    expect(screen.getByTestId('upload-zone')).toBeInTheDocument();
    const input = screen.getByTestId('upload-zone-input');
    await user.upload(input, pdf('spec.pdf'));

    expect(await screen.findByTestId('staged-file-0')).toHaveTextContent('spec.pdf');
    expect(uploadToS3).not.toHaveBeenCalled();
  });

  it('uploads staged files with the new task id as ownerId after a successful create', async () => {
    uploadToS3.mockResolvedValue(undefined);
    let uploadUrlBody: Record<string, unknown> | undefined;
    let confirmBody: Record<string, unknown> | undefined;

    server.use(
      http.post(`${API}/projects/project-1/tasks`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(envelope(makeTask({ id: 'new-task-1', title: body.title as string })), {
          status: 201,
        });
      }),
      http.post(`${API}/attachments/upload-url`, async ({ request }) => {
        uploadUrlBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          envelope({ url: 'https://s3.test', headers: { 'Content-Type': 'application/pdf' }, s3Key: 's3/k' })
        );
      }),
      http.post(`${API}/attachments`, async ({ request }) => {
        confirmBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          envelope({
            id: 'att-1',
            ownerType: 'task',
            ownerId: 'new-task-1',
            fileName: 'spec.pdf',
            fileSize: 4,
            mimeType: 'application/pdf',
            createdAt: '2026-08-24T00:00:00Z',
          }),
          { status: 201 }
        );
      })
    );

    const user = userEvent.setup();
    renderComponent(<TaskDialog open onOpenChange={vi.fn()} projectId="project-1" />, { store: proStore() });

    await user.type(screen.getByPlaceholderText('Enter task name'), 'Write spec');
    await user.upload(screen.getByTestId('upload-zone-input'), pdf('spec.pdf'));
    await screen.findByTestId('staged-file-0');
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => expect(confirmBody).toMatchObject({ s3Key: 's3/k', fileName: 'spec.pdf' }));
    expect(uploadUrlBody).toMatchObject({ ownerType: 'task', ownerId: 'new-task-1', fileName: 'spec.pdf' });
  });

  it('leaves staged files intact when task creation itself fails', async () => {
    server.use(
      http.post(`${API}/projects/project-1/tasks`, () =>
        HttpResponse.json({ data: null, error: { code: 'INTERNAL', message: 'boom' } }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    renderComponent(<TaskDialog open onOpenChange={vi.fn()} projectId="project-1" />, { store: proStore() });

    await user.type(screen.getByPlaceholderText('Enter task name'), 'Retry me');
    await user.upload(screen.getByTestId('upload-zone-input'), pdf('spec.pdf'));
    await screen.findByTestId('staged-file-0');
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByTestId('staged-file-0')).toHaveTextContent('spec.pdf');
    expect(uploadToS3).not.toHaveBeenCalled();
  });

  it('closes the dialog and toasts per failed file when creation succeeds but an upload fails', async () => {
    uploadToS3.mockRejectedValue(new Error('network error'));
    const onOpenChange = vi.fn();

    server.use(
      http.post(`${API}/projects/project-1/tasks`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(envelope(makeTask({ id: 'new-task-2', title: body.title as string })), {
          status: 201,
        });
      }),
      http.post(`${API}/attachments/upload-url`, () =>
        HttpResponse.json(
          envelope({ url: 'https://s3.test', headers: { 'Content-Type': 'application/pdf' }, s3Key: 's3/k' })
        )
      )
    );

    const user = userEvent.setup();
    renderComponent(<TaskDialog open onOpenChange={onOpenChange} projectId="project-1" />, { store: proStore() });

    await user.type(screen.getByPlaceholderText('Enter task name'), 'Task with broken upload');
    await user.upload(screen.getByTestId('upload-zone-input'), pdf('broken.pdf'));
    await screen.findByTestId('staged-file-0');
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('broken.pdf')));
  });
});
