import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeTask } from '@/mocks/handlers';

import { useTaskRecurrenceActions } from './useTaskRecurrenceActions';

const envelope = <T,>(data: T) => ({ data, error: null });

// Minimal harness: renders the hook's dialogs + buttons to trigger actions.
const Harness = ({ task = makeTask() }) => {
  const { isRecurringInstance, skip, endSeries, dialogs } = useTaskRecurrenceActions(task);
  return (
    <>
      <div data-testid="is-recurring">{String(isRecurringInstance)}</div>
      <button onClick={skip} data-testid="trigger-skip">
        Skip
      </button>
      <button onClick={endSeries} data-testid="trigger-end-series">
        End series
      </button>
      {dialogs}
    </>
  );
};

describe('useTaskRecurrenceActions', () => {
  it('reports isRecurringInstance=false for a plain task', () => {
    renderComponent(<Harness task={makeTask()} />);
    expect(screen.getByTestId('is-recurring')).toHaveTextContent('false');
  });

  it('reports isRecurringInstance=true for a task with a recurrenceRuleId', () => {
    renderComponent(<Harness task={makeTask({ recurrenceRuleId: 'rule-1' })} />);
    expect(screen.getByTestId('is-recurring')).toHaveTextContent('true');
  });

  it('opens skip confirm dialog when skip() is called', async () => {
    const user = userEvent.setup();
    renderComponent(<Harness task={makeTask({ recurrenceRuleId: 'rule-1' })} />);
    await user.click(screen.getByTestId('trigger-skip'));
    expect(await screen.findByTestId('skip-occurrence-dialog-content')).toBeInTheDocument();
  });

  it('opens end-series confirm dialog when endSeries() is called', async () => {
    const user = userEvent.setup();
    renderComponent(<Harness task={makeTask({ recurrenceRuleId: 'rule-1' })} />);
    await user.click(screen.getByTestId('trigger-end-series'));
    expect(await screen.findByTestId('end-series-dialog-content')).toBeInTheDocument();
  });

  it('calls POST /tasks/:id/skip and dismisses dialog on confirm', async () => {
    const task = makeTask({ id: 'task-x', recurrenceRuleId: 'rule-1' });
    server.use(http.post('http://localhost:8080/v1/tasks/task-x/skip', () => HttpResponse.json(envelope(task))));
    const user = userEvent.setup();
    renderComponent(<Harness task={task} />);
    await user.click(screen.getByTestId('trigger-skip'));
    await user.click(screen.getByRole('button', { name: /skip/i }));
    await waitFor(() => expect(screen.queryByTestId('skip-occurrence-dialog-content')).not.toBeInTheDocument());
  });

  it('calls DELETE /recurrence-rules/:id and dismisses dialog on end-series confirm', async () => {
    const task = makeTask({ id: 'task-x', recurrenceRuleId: 'rule-99' });
    server.use(
      http.delete('http://localhost:8080/v1/recurrence-rules/rule-99', () => new HttpResponse(null, { status: 204 }))
    );
    const user = userEvent.setup();
    renderComponent(<Harness task={task} />);
    await user.click(screen.getByTestId('trigger-end-series'));
    await user.click(screen.getByRole('button', { name: /end series/i }));
    await waitFor(() => expect(screen.queryByTestId('end-series-dialog-content')).not.toBeInTheDocument());
  });
});
