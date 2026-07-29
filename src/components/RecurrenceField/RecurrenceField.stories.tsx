import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen, userEvent } from 'storybook/test';

import { RecurrenceFreq } from '@/lib/types';

import { RecurrenceField } from './index';
import type { RecurrenceValue } from './types';

// The field is fully controlled, so each story owns the state it edits. No
// MemoryRouter here — the component doesn't route, and adding one masks
// accidental router coupling.
const Harness = ({ initial }: { initial: RecurrenceValue | null }) => {
  const [value, setValue] = useState<RecurrenceValue | null>(initial);
  return (
    <div className="max-w-md p-4">
      <RecurrenceField value={value} onChange={setValue} />
    </div>
  );
};

const meta: Meta<typeof RecurrenceField> = {
  title: 'Components/RecurrenceField',
  component: RecurrenceField,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof RecurrenceField>;

const weekly: RecurrenceValue = {
  freq: RecurrenceFreq.WEEKLY,
  interval: 2,
  byWeekday: [1, 4],
  byMonthday: null,
  startDate: '2026-03-02',
  endDate: null,
};

export const Off: Story = {
  render: () => <Harness initial={null} />,
  play: async () => {
    await expect(screen.getByTestId('recurrence-toggle')).not.toBeChecked();
  },
};

export const Weekly: Story = {
  render: () => <Harness initial={weekly} />,
  play: async () => {
    await expect(screen.getByTestId('recurrence-summary')).toHaveTextContent(/every 2 weeks/i);
  },
};

export const Monthly: Story = {
  render: () => (
    <Harness initial={{ ...weekly, freq: RecurrenceFreq.MONTHLY, interval: 1, byWeekday: [], byMonthday: 15 }} />
  ),
  play: async () => {
    await expect(screen.getByTestId('recurrence-monthday')).toBeInTheDocument();
  },
};

export const WithEndDate: Story = {
  render: () => <Harness initial={{ ...weekly, endDate: '2026-12-31' }} />,
  play: async () => {
    await expect(screen.getByTestId('recurrence-end-date')).toBeInTheDocument();
  },
};

// Turning the switch on reveals the editor with a sensible default schedule.
export const TogglingOn: Story = {
  render: () => <Harness initial={null} />,
  play: async () => {
    await userEvent.click(screen.getByTestId('recurrence-toggle'));
    await expect(await screen.findByTestId('recurrence-editor')).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="max-w-md p-4">
      <RecurrenceField value={weekly} onChange={() => {}} disabled />
    </div>
  ),
  play: async () => {
    await expect(screen.getByTestId('recurrence-interval')).toBeDisabled();
  },
};
