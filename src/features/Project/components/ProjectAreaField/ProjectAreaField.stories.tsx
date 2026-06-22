import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { expect, userEvent, within } from 'storybook/test';

import type { ProjectFormData } from '@/lib/utils';
import { makeArea } from '@/mocks/handlers';
import { StoryFormWrapper } from '@/stories/helpers';

import { ProjectAreaField } from '.';

const meta: Meta<typeof ProjectAreaField> = {
  title: 'Project/ProjectAreaField',
  component: ProjectAreaField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof ProjectAreaField>;

const defaults: Partial<ProjectFormData> = { name: 'Demo', folderIcon: 'folder', status: 'active', areaId: '' };

const areasHandler = (items: ReturnType<typeof makeArea>[]) =>
  http.get('http://localhost:8080/v1/areas', () => HttpResponse.json({ data: { items, nextCursor: '' }, error: null }));

export const WithAreas: Story = {
  parameters: {
    msw: {
      handlers: [
        areasHandler([makeArea({ id: 'area-1', name: 'Work' }), makeArea({ id: 'area-2', name: 'Personal' })]),
      ],
    },
  },
  render: () => (
    <StoryFormWrapper<ProjectFormData> defaultValues={defaults}>
      {control => <ProjectAreaField control={control} />}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Area')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('combobox'));
  },
};

export const Empty: Story = {
  parameters: { msw: { handlers: [areasHandler([])] } },
  render: () => (
    <StoryFormWrapper<ProjectFormData> defaultValues={defaults}>
      {control => <ProjectAreaField control={control} />}
    </StoryFormWrapper>
  ),
};
