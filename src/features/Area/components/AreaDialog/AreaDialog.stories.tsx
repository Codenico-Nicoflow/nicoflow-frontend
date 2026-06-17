import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen } from 'storybook/test';

import { mockArea } from '@/stories/mocks';

import { AreaDialog } from '.';

const meta: Meta<typeof AreaDialog> = {
  title: 'Area/AreaDialog',
  component: AreaDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { open: true, onOpenChange: () => {} },
};
export default meta;

type Story = StoryObj<typeof AreaDialog>;

export const Create: Story = {
  play: async () => {
    await expect(await screen.findByText('Create New Area')).toBeInTheDocument();
    await expect(screen.getByText('Area Name')).toBeInTheDocument();
  },
};

export const Edit: Story = {
  args: { area: mockArea({ name: 'Work', color: '#4f46e5' }) },
  play: async () => {
    await expect(await screen.findByText('Edit Area')).toBeInTheDocument();
    await expect(screen.getByDisplayValue('Work')).toBeInTheDocument();
  },
};
