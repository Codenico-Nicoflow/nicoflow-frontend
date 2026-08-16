import React from 'react';

import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { type Control, FormProvider, useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DueDateField } from '.';

const API = 'http://localhost:8080/v1';
const envelope = <T,>(data: T) => ({ data, error: null });

interface TestFormValues {
  dueDate?: Date;
}

function TestForm({ children }: { children: (control: Control<TestFormValues>) => React.ReactNode }) {
  const methods = useForm<TestFormValues>({ defaultValues: { dueDate: undefined } });
  return (
    <FormProvider {...methods}>
      <form>{children(methods.control)}</form>
    </FormProvider>
  );
}

describe('DueDateField', () => {
  it('renders label and trigger button with placeholder text', () => {
    renderComponent(<TestForm>{control => <DueDateField control={control} />}</TestForm>);

    expect(screen.getByText('Due Date')).toBeInTheDocument();
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('shows "(Optional)" when optional={true}', () => {
    renderComponent(<TestForm>{control => <DueDateField control={control} optional={true} />}</TestForm>);

    expect(screen.getByText('(Optional)')).toBeInTheDocument();
  });

  it('does not show clear button when no value is set', () => {
    renderComponent(<TestForm>{control => <DueDateField control={control} />}</TestForm>);

    expect(screen.queryByTestId('due-date-clear-button')).not.toBeInTheDocument();
  });

  it('shows clear button when the field has a preset value', () => {
    const TestWithValue = () => {
      const methods = useForm<TestFormValues>({ defaultValues: { dueDate: new Date('2025-12-31') } });
      return (
        <FormProvider {...methods}>
          <form>
            <DueDateField control={methods.control} />
          </form>
        </FormProvider>
      );
    };

    renderComponent(<TestWithValue />);

    expect(screen.getByTestId('due-date-clear-button')).toBeInTheDocument();
    expect(screen.queryByText('Pick a date')).not.toBeInTheDocument();
  });

  it('clicking clear resets the UI — placeholder returns and clear button disappears', async () => {
    const user = userEvent.setup();

    const TestWithValue = () => {
      const methods = useForm<TestFormValues>({ defaultValues: { dueDate: new Date('2025-12-31') } });
      return (
        <FormProvider {...methods}>
          <form>
            <DueDateField control={methods.control} />
          </form>
        </FormProvider>
      );
    };

    renderComponent(<TestWithValue />);

    // Precondition: a date is shown, no placeholder.
    expect(screen.queryByText('Pick a date')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('due-date-clear-button'));

    // The bug: clearing updated form state but not the UI. Assert the UI actually resets.
    expect(await screen.findByText('Pick a date')).toBeInTheDocument();
    expect(screen.queryByTestId('due-date-clear-button')).not.toBeInTheDocument();
  });

  it('renders custom label', () => {
    renderComponent(<TestForm>{control => <DueDateField control={control} label="Deadline" />}</TestForm>);

    expect(screen.getByText('Deadline')).toBeInTheDocument();
  });

  describe('NLP text-input mode', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('does not fire a request until 400ms of inactivity has passed', async () => {
      let requestCount = 0;
      server.use(
        http.post(`${API}/nlp/parse-date`, () => {
          requestCount += 1;
          return HttpResponse.json(envelope({ date: '2026-06-19', confidence: 'high', display: 'next friday' }));
        })
      );

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderComponent(<TestForm>{control => <DueDateField control={control} />}</TestForm>);

      await user.click(screen.getByTestId('due-date-nlp-toggle'));
      await user.type(screen.getByTestId('due-date-nlp-input'), 'next friday');

      expect(requestCount).toBe(0);

      act(() => vi.advanceTimersByTime(450));
      await waitFor(() => expect(requestCount).toBe(1));
    });

    it('high confidence: shows a confirmation chip, and confirming sets the date field', async () => {
      server.use(
        http.post(`${API}/nlp/parse-date`, () =>
          HttpResponse.json(envelope({ date: '2026-06-19', confidence: 'high', display: 'next friday' }))
        )
      );

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderComponent(<TestForm>{control => <DueDateField control={control} />}</TestForm>);

      await user.click(screen.getByTestId('due-date-nlp-toggle'));
      await user.type(screen.getByTestId('due-date-nlp-input'), 'next friday');
      act(() => vi.advanceTimersByTime(450));

      await waitFor(() => expect(screen.getByTestId('due-date-nlp-chip')).toBeInTheDocument());

      await user.click(screen.getByTestId('due-date-nlp-confirm'));

      // Confirming switches back to calendar mode and shows the resolved date.
      await waitFor(() => expect(screen.queryByTestId('due-date-nlp-input')).not.toBeInTheDocument());
      expect(screen.queryByText('Pick a date')).not.toBeInTheDocument();
    });

    it('low confidence: shows a "did you mean" prompt without applying a date', async () => {
      server.use(
        http.post(`${API}/nlp/parse-date`, () =>
          HttpResponse.json(envelope({ date: null, confidence: 'low', display: null }))
        )
      );

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderComponent(<TestForm>{control => <DueDateField control={control} />}</TestForm>);

      await user.click(screen.getByTestId('due-date-nlp-toggle'));
      await user.type(screen.getByTestId('due-date-nlp-input'), 'asdfghjkl');
      act(() => vi.advanceTimersByTime(450));

      await waitFor(() => expect(screen.getByTestId('due-date-nlp-did-you-mean')).toBeInTheDocument());
      expect(screen.queryByTestId('due-date-nlp-chip')).not.toBeInTheDocument();
    });

    it('silent error: a failed request shows no chip, no toast, and leaves the input usable', async () => {
      server.use(http.post(`${API}/nlp/parse-date`, () => HttpResponse.json(envelope(null), { status: 500 })));

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderComponent(<TestForm>{control => <DueDateField control={control} />}</TestForm>);

      await user.click(screen.getByTestId('due-date-nlp-toggle'));
      const input = screen.getByTestId('due-date-nlp-input');
      await user.type(input, 'next friday');
      act(() => vi.advanceTimersByTime(450));

      // Give the rejected promise a tick to settle, then assert nothing rendered.
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.queryByTestId('due-date-nlp-chip')).not.toBeInTheDocument();
      expect(screen.queryByTestId('due-date-nlp-did-you-mean')).not.toBeInTheDocument();
      expect(input).toBeEnabled();
    });

    it('stale-result clearing: a new keystroke clears a showing chip immediately, before the next response lands', async () => {
      server.use(
        http.post(`${API}/nlp/parse-date`, () =>
          HttpResponse.json(envelope({ date: '2026-06-19', confidence: 'high', display: 'next friday' }))
        )
      );

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderComponent(<TestForm>{control => <DueDateField control={control} />}</TestForm>);

      await user.click(screen.getByTestId('due-date-nlp-toggle'));
      await user.type(screen.getByTestId('due-date-nlp-input'), 'next friday');
      act(() => vi.advanceTimersByTime(450));
      await waitFor(() => expect(screen.getByTestId('due-date-nlp-chip')).toBeInTheDocument());

      // One more keystroke — the stale chip must vanish synchronously, before
      // the new debounce window even elapses.
      await user.type(screen.getByTestId('due-date-nlp-input'), '!');
      expect(screen.queryByTestId('due-date-nlp-chip')).not.toBeInTheDocument();
    });

    it('the calendar/text toggle switches modes both ways', async () => {
      const user = userEvent.setup();
      renderComponent(<TestForm>{control => <DueDateField control={control} />}</TestForm>);

      await user.click(screen.getByTestId('due-date-nlp-toggle'));
      expect(screen.getByTestId('due-date-nlp-input')).toBeInTheDocument();

      await user.click(screen.getByTestId('due-date-calendar-toggle'));
      expect(screen.queryByTestId('due-date-nlp-input')).not.toBeInTheDocument();
      expect(screen.getByTestId('due-date-trigger')).toBeInTheDocument();
    });
  });
});
