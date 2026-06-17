import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import type { ProjectFormData } from '@/lib/utils';
import { StoryFormWrapper } from '@/stories/helpers';

import { ProjectStatusField } from '.';

const meta: Meta<typeof ProjectStatusField> = {
  title: 'Project/ProjectStatusField',
  component: ProjectStatusField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof ProjectStatusField>;

const defaults: Partial<ProjectFormData> = {
  name: 'Demo',
  areaId: 'area-1',
  folderIcon: 'folder',
  status: 'active',
};

export const Active: Story = {
  render: () => (
    <StoryFormWrapper<ProjectFormData> defaultValues={defaults}>
      {control => <ProjectStatusField control={control} />}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toHaveTextContent(/active/i);
  },
};

export const Completed: Story = {
  render: () => (
    <StoryFormWrapper<ProjectFormData> defaultValues={{ ...defaults, status: 'completed' }}>
      {control => <ProjectStatusField control={control} />}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toHaveTextContent(/completed/i);
  },
};
