import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { makeHabit } from '@/mocks/handlers';

import { HabitFormDialog } from './HabitFormDialog';

const API = 'http://localhost:8080/v1';

describe('HabitFormDialog', () => {
  it('creates a quota habit with only the fields that shape needs', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post(`${API}/habits`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: makeHabit(), error: null }, { status: 201 });
      })
    );

    const onOpenChange = vi.fn();
    renderComponent(<HabitFormDialog open onOpenChange={onOpenChange} />);

    await user.type(screen.getByTestId('habit-name-input'), 'Read');
    await user.click(screen.getByTestId('habit-schedule-kind-weekly_quota'));
    await user.click(screen.getByRole('button', { name: /save|create/i }));

    await waitFor(() => expect(body).toBeDefined());
    expect(body).toMatchObject({ name: 'Read', scheduleKind: 'weekly_quota', timesPerWeek: 3 });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('reveals only the inputs the selected schedule kind needs', async () => {
    const user = userEvent.setup();
    renderComponent(<HabitFormDialog open onOpenChange={vi.fn()} />);

    // daily: nothing extra
    expect(screen.queryByTestId('habit-weekday-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('habit-times-per-week')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('habit-schedule-kind-weekdays'));
    expect(screen.getByTestId('habit-weekday-1')).toBeInTheDocument();
    expect(screen.queryByTestId('habit-times-per-week')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('habit-schedule-kind-weekly_quota'));
    expect(screen.getByTestId('habit-times-per-week')).toBeInTheDocument();
    expect(screen.queryByTestId('habit-weekday-1')).not.toBeInTheDocument();
  });

  // A byWeekday left over from an earlier selection would describe a different
  // schedule than the one the user is looking at.
  it('does not submit stale weekdays after switching to a quota', async () => {
    const user = userEvent.setup();
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(`${API}/habits`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: makeHabit(), error: null }, { status: 201 });
      })
    );

    renderComponent(<HabitFormDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByTestId('habit-name-input'), 'Read');
    await user.click(screen.getByTestId('habit-schedule-kind-weekdays'));
    await user.click(screen.getByTestId('habit-weekday-1'));
    await user.click(screen.getByTestId('habit-weekday-3'));
    await user.click(screen.getByTestId('habit-schedule-kind-weekly_quota'));
    await user.click(screen.getByRole('button', { name: /save|create/i }));

    await waitFor(() => expect(body).toBeDefined());
    expect(body).not.toHaveProperty('byWeekday');
    expect(body).toHaveProperty('timesPerWeek');
  });

  it('blocks a weekdays habit with no days selected', async () => {
    const user = userEvent.setup();
    let posted = false;
    server.use(
      http.post(`${API}/habits`, () => {
        posted = true;
        return HttpResponse.json({ data: makeHabit(), error: null }, { status: 201 });
      })
    );

    renderComponent(<HabitFormDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByTestId('habit-name-input'), 'Gym');
    await user.click(screen.getByTestId('habit-schedule-kind-weekdays'));
    await user.click(screen.getByRole('button', { name: /save|create/i }));

    expect(await screen.findByTestId('habit-weekday-error')).toBeInTheDocument();
    expect(posted).toBe(false);
  });

  it('requires a name', async () => {
    const user = userEvent.setup();
    renderComponent(<HabitFormDialog open onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /save|create/i }));

    expect(await screen.findByTestId('habit-name-error')).toBeInTheDocument();
  });

  // The user is mid-task: a disappearing toast can't carry an upgrade action,
  // so the wall is shown in place.
  it('shows the plan wall in the dialog rather than a toast', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API}/habits`, () =>
        HttpResponse.json({ data: null, error: { code: 'PLAN_LIMIT_EXCEEDED', message: 'limit' } }, { status: 403 })
      )
    );

    const onOpenChange = vi.fn();
    renderComponent(<HabitFormDialog open onOpenChange={onOpenChange} />);

    await user.type(screen.getByTestId('habit-name-input'), 'Read');
    await user.click(screen.getByRole('button', { name: /save|create/i }));

    expect(await screen.findByTestId('plan-limit-alert')).toBeInTheDocument();
    // The dialog stays open so the user can act on it.
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  // Absent, not disabled: a greyed-out control invites the user to wonder what
  // unlocks it.
  it('omits the polarity control on edit and explains why', () => {
    renderComponent(<HabitFormDialog open onOpenChange={vi.fn()} habit={makeHabit()} />);

    expect(screen.queryByTestId('habit-polarity-build')).not.toBeInTheDocument();
    expect(screen.getByTestId('habit-polarity-note')).toBeInTheDocument();
  });

  it('offers the polarity choice when creating', () => {
    renderComponent(<HabitFormDialog open onOpenChange={vi.fn()} />);

    expect(screen.getByTestId('habit-polarity-build')).toBeInTheDocument();
    expect(screen.getByTestId('habit-polarity-quit')).toBeInTheDocument();
  });

  it('prefills the form from the habit being edited', () => {
    renderComponent(
      <HabitFormDialog
        open
        onOpenChange={vi.fn()}
        habit={makeHabit({ name: 'Read', targetValue: 20, unit: 'minutes' })}
      />
    );

    expect(screen.getByTestId('habit-name-input')).toHaveValue('Read');
    expect(screen.getByTestId('habit-target-input')).toHaveValue(20);
    expect(screen.getByTestId('habit-unit-input')).toHaveValue('minutes');
  });

  it('sends the id in the path when editing', async () => {
    const user = userEvent.setup();
    let patched = false;
    server.use(
      http.patch(`${API}/habits/habit-1`, () => {
        patched = true;
        return HttpResponse.json({ data: makeHabit(), error: null });
      })
    );

    renderComponent(<HabitFormDialog open onOpenChange={vi.fn()} habit={makeHabit({ name: 'Read' })} />);

    await user.clear(screen.getByTestId('habit-name-input'));
    await user.type(screen.getByTestId('habit-name-input'), 'Read more');
    await user.click(screen.getByRole('button', { name: /save|update/i }));

    await waitFor(() => expect(patched).toBe(true));
  });

  // The server sends a namespace-qualified key ("habits.subject.reading") while
  // t() is bound to that namespace, so the prefix has to come off — otherwise
  // every tile renders the raw key instead of a word. Caught in a browser, not
  // by a test, which is why there is one now.
  it('translates subject labels rather than printing the raw key', async () => {
    server.use(
      http.get(`${API}/habits/subjects`, () =>
        HttpResponse.json({
          data: [{ slug: 'reading', labelKey: 'habits.subject.reading' }],
          error: null,
        })
      )
    );

    renderComponent(<HabitFormDialog open onOpenChange={vi.fn()} />);

    expect(await screen.findByRole('button', { name: 'Reading' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^habits\./ })).not.toBeInTheDocument();
  });

  // The catalog is served, so a build can meet a slug it has never seen. It must
  // render a fallback icon rather than a blank cell.
  it('renders an unknown subject slug with a fallback icon', async () => {
    server.use(
      http.get(`${API}/habits/subjects`, () =>
        HttpResponse.json({
          data: [{ slug: 'underwater_basket_weaving', labelKey: 'subject.custom' }],
          error: null,
        })
      )
    );

    renderComponent(<HabitFormDialog open onOpenChange={vi.fn()} />);

    expect(await screen.findByTestId('habit-subject-underwater_basket_weaving')).toBeInTheDocument();
  });
});
