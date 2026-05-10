import type { Meta, StoryObj } from '@storybook/react';

import { ModeToggle } from '.';

const meta: Meta<typeof ModeToggle> = {
  title: 'Components/Theme/ModeToggle',
  component: ModeToggle,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof ModeToggle>;

export const Default: Story = {};

export const DarkMode: Story = {
  parameters: { globals: { theme: 'dark' } },
};
