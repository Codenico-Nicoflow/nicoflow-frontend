import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen } from 'storybook/test';

import { ProjectDeleteDialog } from '.';

const meta: Meta<typeof ProjectDeleteDialog> = {
  title: 'Project/ProjectDeleteDialog',
  component: ProjectDeleteDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { open: true, onOpenChange: () => {}, projectId: 'project-1', projectName: 'Website Redesign' },
};
export default meta;

type Story = StoryObj<typeof ProjectDeleteDialog>;

export const Default: Story = {
  play: async () => {
    // "Delete Project" is both the title and the confirm button label.
    await expect((await screen.findAllByText('Delete Project')).length).toBeGreaterThan(0);
    await expect(screen.getByText(/website redesign/i)).toBeInTheDocument();
  },
};
