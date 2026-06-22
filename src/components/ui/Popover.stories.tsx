import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen, userEvent, within } from 'storybook/test';

import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const meta: Meta<typeof Popover> = {
  title: 'UI/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm text-foreground">Quick settings live here.</p>
      </PopoverContent>
    </Popover>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /open popover/i }));
    await expect(await screen.findByText('Quick settings live here.')).toBeInTheDocument();
  },
};
