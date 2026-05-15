import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { DialogFieldGrid } from '.';

const meta: Meta<typeof DialogFieldGrid> = {
  title: 'Components/Presentational/DialogFieldGrid',
  component: DialogFieldGrid,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    columns: { control: 'select', options: [1, 2] },
    className: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof DialogFieldGrid>;

const Placeholder = ({ label }: { label: string }) => (
  <div className="h-10 rounded-md border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
    {label}
  </div>
);

export const SingleColumn: Story = {
  render: () => (
    <div className="w-[400px]">
      <DialogFieldGrid columns={1}>
        <Placeholder label="Field 1" />
        <Placeholder label="Field 2" />
        <Placeholder label="Field 3" />
      </DialogFieldGrid>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Field 1')).toBeInTheDocument();
    await expect(canvas.getByText('Field 3')).toBeInTheDocument();
  },
};

export const TwoColumns: Story = {
  render: () => (
    <div className="w-[400px]">
      <DialogFieldGrid columns={2}>
        <Placeholder label="Field 1" />
        <Placeholder label="Field 2" />
        <Placeholder label="Field 3" />
        <Placeholder label="Field 4" />
      </DialogFieldGrid>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Field 1')).toBeInTheDocument();
    await expect(canvas.getByText('Field 2')).toBeInTheDocument();
    await expect(canvas.getByText('Field 3')).toBeInTheDocument();
    await expect(canvas.getByText('Field 4')).toBeInTheDocument();
  },
};
