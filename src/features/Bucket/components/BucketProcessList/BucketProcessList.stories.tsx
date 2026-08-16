import { useState } from 'react';

import { BUCKET_PROCESSING_OPTIONS, type ProcessingResult } from '@nicoflow/shared/types';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { BucketProcessList } from '.';

const meta: Meta<typeof BucketProcessList> = {
  title: 'Bucket/BucketProcessList',
  component: BucketProcessList,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [Story => <div className="w-[30rem]">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof BucketProcessList>;

export const Default: Story = {
  render: () => {
    const Wrapper = () => {
      const [selected, setSelected] = useState<ProcessingResult>('task');
      return (
        <BucketProcessList
          processingOptions={BUCKET_PROCESSING_OPTIONS}
          selectedType={selected}
          setSelectedType={setSelected}
        />
      );
    };
    return <Wrapper />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Task')).toBeInTheDocument();
    await userEvent.click(canvas.getByText('Trash'));
  },
};
