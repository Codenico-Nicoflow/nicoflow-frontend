import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { ProjectEmptyState } from '.';

const meta: Meta<typeof ProjectEmptyState> = {
  title: 'Project/states/EmptyState',
  component: ProjectEmptyState,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof ProjectEmptyState>;

export const Default: Story = {
  args: { onAddProject: () => {} },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No projects yet')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: /create your first project/i }));
  },
};
