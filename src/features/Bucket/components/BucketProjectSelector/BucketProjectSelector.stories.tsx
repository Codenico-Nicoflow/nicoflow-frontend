import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { makeProject } from '@/mocks/handlers';

import { BucketProjectSelector } from '.';

const meta: Meta<typeof BucketProjectSelector> = {
  title: 'Bucket/BucketProjectSelector',
  component: BucketProjectSelector,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [Story => <div className="w-72">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof BucketProjectSelector>;

const projects = [makeProject({ id: 'p1', name: 'Marketing' }), makeProject({ id: 'p2', name: 'Engineering' })];

export const Default: Story = {
  render: () => {
    const Wrapper = () => {
      const [id, setId] = useState<string | undefined>(undefined);
      return <BucketProjectSelector projects={projects} selectedProjectId={id} setSelectedProjectId={setId} />;
    };
    return <Wrapper />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Project *')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('combobox'));
  },
};
