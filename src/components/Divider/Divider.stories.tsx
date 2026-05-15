import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const divider =
      canvas.getByRole('separator', { hidden: true }) ?? canvasElement.querySelector('[data-testid="divider"]');
    await expect(divider ?? canvasElement.firstElementChild).toBeTruthy();
  },
};

export const InContext: Story = {
  render: () => (
    <div className="w-64 space-y-3">
      <p className="text-sm text-foreground">Section above</p>
      <Divider />
      <p className="text-sm text-muted-foreground">Section below</p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Section above')).toBeInTheDocument();
    await expect(canvas.getByText('Section below')).toBeInTheDocument();
  },
};
