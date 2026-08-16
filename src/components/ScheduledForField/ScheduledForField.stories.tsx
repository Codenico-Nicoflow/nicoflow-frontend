import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { useForm } from 'react-hook-form';
import { expect, userEvent, within } from 'storybook/test';

import { Form } from '@/components/ui/form';

import { ScheduledForField } from '.';

const API = 'http://localhost:8080/v1';
const envelope = <T,>(data: T) => ({ data, error: null });

type ScheduledForForm = { scheduledFor?: string | null };

type StoryArgs = {
  /** ISO date string ('' = no date). */
  value: string;
  label: string;
  optional: boolean;
  delay: number;
};

const meta: Meta<StoryArgs> = {
  title: 'Components/Fields/ScheduledForField',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { value: '', label: 'Scheduled for', optional: true, delay: 0.15 },
  argTypes: {
    value: { control: 'text', description: "ISO date that seeds the field (e.g. '2026-06-15'); empty = none." },
    label: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
  render: ({ value, ...props }) => {
    const Demo = () => {
      const form = useForm<ScheduledForForm>({ defaultValues: { scheduledFor: value || undefined } });
      return (
        <Form {...form}>
          <form className="w-[360px]">
            <ScheduledForField control={form.control} {...props} />
          </form>
        </Form>
      );
    };
    return <Demo />;
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/pick a date/i)).toBeInTheDocument();
  },
};

export const WithDate: Story = {
  args: { value: '2026-06-15' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/june/i)).toBeInTheDocument();
  },
};

// Text-input mode (NIC-1932): high-confidence parse → chip → confirm.
export const NLPHighConfidence: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post(`${API}/nlp/parse-date`, () =>
          HttpResponse.json(envelope({ date: '2026-06-19', confidence: 'high', display: 'next friday' }))
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTestId('scheduled-for-nlp-toggle'));
    await userEvent.type(await canvas.findByTestId('scheduled-for-nlp-input'), 'next friday');
    await expect(await canvas.findByTestId('scheduled-for-nlp-chip', {}, { timeout: 2000 })).toBeInTheDocument();
  },
};

// Low-confidence parse → "did you mean" prompt, no date auto-applied.
export const NLPLowConfidence: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post(`${API}/nlp/parse-date`, () =>
          HttpResponse.json(envelope({ date: null, confidence: 'low', display: null }))
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTestId('scheduled-for-nlp-toggle'));
    await userEvent.type(await canvas.findByTestId('scheduled-for-nlp-input'), 'asdfghjkl');
    await expect(
      await canvas.findByTestId('scheduled-for-nlp-did-you-mean', {}, { timeout: 2000 })
    ).toBeInTheDocument();
  },
};
