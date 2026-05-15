import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { ModeToggle } from '.';

const meta: Meta<typeof ModeToggle> = {
  title: 'Components/Theme/ModeToggle',
  component: ModeToggle,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof ModeToggle>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const toggleBtn = canvas.getByRole('button');
    await expect(toggleBtn).toBeInTheDocument();
    await user.click(toggleBtn);
    const dropdown = document.querySelector('[role="menu"]');
    await expect(dropdown).toBeTruthy();
  },
};

export const DarkMode: Story = {
  parameters: { globals: { theme: 'dark' } },
};
