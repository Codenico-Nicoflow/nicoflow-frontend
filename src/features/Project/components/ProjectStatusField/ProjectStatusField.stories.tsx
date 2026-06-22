import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { expect, within } from 'storybook/test';

import { Form } from '@/components/ui/form';
import type { ProjectFormData } from '@/lib/utils';

import { ProjectStatusField } from '.';

type StoryArgs = { value: 'active' | 'completed' | 'archived' };

const seed = (status: StoryArgs['value']): Partial<ProjectFormData> => ({
  name: 'Demo',
  areaId: 'area-1',
  folderIcon: 'folder',
  status,
});

const meta: Meta<StoryArgs> = {
  title: 'Project/ProjectStatusField',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { value: 'active' },
  argTypes: {
    value: { control: 'select', options: ['active', 'completed', 'archived'], description: 'Seeds the status.' },
  },
  render: ({ value }) => {
    const Demo = () => {
      const form = useForm<ProjectFormData>({ defaultValues: seed(value) });
      return (
        <Form {...form}>
          <form className="w-[360px]">
            <ProjectStatusField control={form.control} />
          </form>
        </Form>
      );
    };
    return <Demo />;
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Active: Story = {
  args: { value: 'active' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toHaveTextContent(/active/i);
  },
};

export const Completed: Story = {
  args: { value: 'completed' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toHaveTextContent(/completed/i);
  },
};

export const Archived: Story = { args: { value: 'archived' } };
