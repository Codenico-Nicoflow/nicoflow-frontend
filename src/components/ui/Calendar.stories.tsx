import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { Calendar } from './calendar';

const meta: Meta<typeof Calendar> = {
  title: 'UI/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  render: () => {
    const Wrapper = () => {
      const [date, setDate] = useState<Date | undefined>(new Date(2026, 5, 17));
      return <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />;
    };
    return <Wrapper />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('grid')).toBeInTheDocument();
  },
};
