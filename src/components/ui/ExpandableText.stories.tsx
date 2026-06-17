import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { ExpandableText } from './expandable-text';

const LONG =
  'Nicoflow is a GTD-inspired task manager: capture into the inbox, process into tasks that live in projects under areas of responsibility, then execute via Today / Tomorrow / Next 7 Days. This description is intentionally long so the component truncates it past the maxLength threshold and reveals a show-more toggle.';

const meta: Meta<typeof ExpandableText> = {
  title: 'UI/ExpandableText',
  component: ExpandableText,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: { maxLength: { control: 'number' } },
  decorators: [Story => <div className="w-96">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof ExpandableText>;

export const Truncated: Story = {
  args: { children: LONG, maxLength: 120 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button');
    await expect(toggle).toBeInTheDocument();
    await userEvent.click(toggle);
    await expect(canvas.getByText(/Next 7 Days/)).toBeInTheDocument();
  },
};

export const Short: Story = {
  args: { children: 'A short note that never truncates.', maxLength: 150 },
};
