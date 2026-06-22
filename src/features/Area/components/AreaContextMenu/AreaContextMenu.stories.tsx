import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen, userEvent, within } from 'storybook/test';

import { mockArea } from '@/stories/mocks';

import { AreaContextMenu } from '.';

const meta: Meta<typeof AreaContextMenu> = {
  title: 'Area/AreaContextMenu',
  component: AreaContextMenu,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { area: mockArea({ name: 'Work' }), onEdit: () => {} },
  // The group-hover trigger is invisible until hovered; force it visible here.
  decorators: [Story => <div className="group/area">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof AreaContextMenu>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
    // Menu items portal to body.
    await expect(await screen.findByText('Edit Area')).toBeInTheDocument();
    await expect(screen.getByText('Delete Area')).toBeInTheDocument();
  },
};
