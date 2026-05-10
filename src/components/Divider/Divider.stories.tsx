import type { Meta, StoryObj } from '@storybook/react';

import { Divider } from '.';

const meta: Meta<typeof Divider> = {
  title: 'Components/Presentational/Divider',
  component: Divider,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Divider>;

export const Default: Story = {
  render: () => (
    <div className="w-64">
      <Divider />
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="w-64 space-y-3">
      <p className="text-sm text-foreground">Section above</p>
      <Divider />
      <p className="text-sm text-muted-foreground">Section below</p>
    </div>
  ),
};
