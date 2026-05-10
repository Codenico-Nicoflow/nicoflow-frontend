import type { Meta, StoryObj } from '@storybook/react';

import { DialogFieldGrid } from '.';

const meta: Meta<typeof DialogFieldGrid> = {
  title: 'Components/Presentational/DialogFieldGrid',
  component: DialogFieldGrid,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
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
};
