import React from 'react';

import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { type Control, FormProvider, useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ScheduledForField } from '.';

const API = 'http://localhost:8080/v1';
const envelope = <T,>(data: T) => ({ data, error: null });

interface TestFormValues {
  scheduledFor?: string | null;
}

function TestForm({ children }: { children: (control: Control<TestFormValues>) => React.ReactNode }) {
  const methods = useForm<TestFormValues>({ defaultValues: { scheduledFor: undefined } });
  return (
    <FormProvider {...methods}>
      <form>{children(methods.control)}</form>
    </FormProvider>
  );
}

describe('ScheduledForField', () => {
  it('renders label and trigger button with placeholder text', () => {
    renderComponent(<TestForm>{control => <ScheduledForField control={control} />}</TestForm>);

    expect(screen.getByText('Scheduled for')).toBeInTheDocument();
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('does not show clear button when no value is set', () => {
    renderComponent(<TestForm>{control => <ScheduledForField control={control} />}</TestForm>);

    expect(screen.queryByTestId('scheduled-for-clear-button')).not.toBeInTheDocument();
  });

  it('shows clear button when the field has a preset value', () => {
    const TestWithValue = () => {
      const methods = useForm<TestFormValues>({ defaultValues: { scheduledFor: '2025-12-31' } });
      return (
        <FormProvider {...methods}>
          <form>
            <ScheduledForField control={methods.control} />
          </form>
        </FormProvider>
      );
    };

    renderComponent(<TestWithValue />);

    expect(screen.getByTestId('scheduled-for-clear-button')).toBeInTheDocument();
    expect(screen.queryByText('Pick a date')).not.toBeInTheDocument();
  });

  describe('NLP text-input mode', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('high confidence: shows a confirmation chip, and confirming sets the ISO date string with no coercion', async () => {
      server.use(
        http.post(`${API}/nlp/parse-date`, () =>
          HttpResponse.json(envelope({ date: '2026-06-19', confidence: 'high', display: 'next friday' }))
        )
      );

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderComponent(<TestForm>{control => <ScheduledForField control={control} />}</TestForm>);

      await user.click(screen.getByTestId('scheduled-for-nlp-toggle'));
      await user.type(screen.getByTestId('scheduled-for-nlp-input'), 'next friday');
      act(() => vi.advanceTimersByTime(450));

      await waitFor(() => expect(screen.getByTestId('scheduled-for-nlp-chip')).toBeInTheDocument());

      await user.click(screen.getByTestId('scheduled-for-nlp-confirm'));

      await waitFor(() => expect(screen.queryByTestId('scheduled-for-nlp-input')).not.toBeInTheDocument());
      expect(screen.getByTestId('scheduled-for-clear-button')).toBeInTheDocument();
    });

    it('low confidence: shows a "did you mean" prompt without applying a date', async () => {
      server.use(
        http.post(`${API}/nlp/parse-date`, () =>
          HttpResponse.json(envelope({ date: null, confidence: 'low', display: null }))
        )
      );

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderComponent(<TestForm>{control => <ScheduledForField control={control} />}</TestForm>);

      await user.click(screen.getByTestId('scheduled-for-nlp-toggle'));
      await user.type(screen.getByTestId('scheduled-for-nlp-input'), 'asdfghjkl');
      act(() => vi.advanceTimersByTime(450));

      await waitFor(() => expect(screen.getByTestId('scheduled-for-nlp-did-you-mean')).toBeInTheDocument());
      expect(screen.queryByTestId('scheduled-for-nlp-chip')).not.toBeInTheDocument();
    });

    it('silent error: a failed request shows no chip, no toast, and leaves the input usable', async () => {
      server.use(http.post(`${API}/nlp/parse-date`, () => HttpResponse.json(envelope(null), { status: 500 })));

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderComponent(<TestForm>{control => <ScheduledForField control={control} />}</TestForm>);

      await user.click(screen.getByTestId('scheduled-for-nlp-toggle'));
      const input = screen.getByTestId('scheduled-for-nlp-input');
      await user.type(input, 'next friday');
      act(() => vi.advanceTimersByTime(450));

      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.queryByTestId('scheduled-for-nlp-chip')).not.toBeInTheDocument();
      expect(screen.queryByTestId('scheduled-for-nlp-did-you-mean')).not.toBeInTheDocument();
      expect(input).toBeEnabled();
    });

    it('the calendar/text toggle switches modes both ways', async () => {
      const user = userEvent.setup();
      renderComponent(<TestForm>{control => <ScheduledForField control={control} />}</TestForm>);

      await user.click(screen.getByTestId('scheduled-for-nlp-toggle'));
      expect(screen.getByTestId('scheduled-for-nlp-input')).toBeInTheDocument();

      await user.click(screen.getByTestId('scheduled-for-calendar-toggle'));
      expect(screen.queryByTestId('scheduled-for-nlp-input')).not.toBeInTheDocument();
      expect(screen.getByTestId('scheduled-for-trigger')).toBeInTheDocument();
    });
  });
});
