import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { FORM_DIALOG_SUBMIT_BUTTON } from '@/lib/test_ids';
import { makeSubtask, makeTask } from '@/mocks/handlers';

import TaskDialog from './TaskDialog';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const envelope = <T,>(data: T) => ({ data, error: null });
const items = <T,>(list: T[]) => ({ data: { items: list }, error: null });

const API = 'http://localhost:8080/v1';

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
});

describe('TaskDialog — edit mode', () => {
  const task = makeTask({ id: 'task-9', title: 'Existing task', energy: 'medium' });

  it('pre-populates from the task and shows the scheduling block', async () => {
    server.use(http.get(`${API}/tasks/task-9/subtasks`, () => HttpResponse.json(items([]))));

    renderComponent(<TaskDialog open onOpenChange={vi.fn()} projectId="project-1" task={task} />);

    await waitFor(() => expect(screen.getByPlaceholderText('Enter task name')).toHaveValue('Existing task'));
    expect(screen.getByTestId('scheduling-block')).toBeInTheDocument();
  });

  it('adds, toggles and deletes a subtask through the accordion', async () => {
    const subtask = makeSubtask({ id: 'sub-1', taskId: 'task-9', title: 'Draft outline' });
    let toggledDone: unknown = undefined;
    let deleted = false;

    server.use(
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
});
