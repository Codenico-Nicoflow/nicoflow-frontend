import type { Meta, StoryObj } from '@storybook/react';
import { Edit, Star, Trash2 } from 'lucide-react';
import { expect, userEvent, within } from 'storybook/test';

import { ItemActionsMenu } from '.';

const meta: Meta<typeof ItemActionsMenu> = {
  title: 'Components/Actions/ItemActionsMenu',
  component: ItemActionsMenu,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    align: { control: 'select', options: ['start', 'center', 'end'] },
  },
};
export default meta;

type Story = StoryObj<typeof ItemActionsMenu>;

export const Default: Story = {
  args: {
    actions: [
      { label: 'Edit', icon: Edit, onClick: () => {} },
      { label: 'Favourite', icon: Star, onClick: () => {} },
      { label: 'Delete', icon: Trash2, onClick: () => {}, destructive: true },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const trigger = canvas.getByRole('button');
    await user.click(trigger);
    await expect(canvas.getByText('Edit')).toBeInTheDocument();
    await expect(canvas.getByText('Favourite')).toBeInTheDocument();
    await expect(canvas.getByText('Delete')).toBeInTheDocument();
  },
};

export const SingleAction: Story = {
  args: {
    actions: [{ label: 'Edit', icon: Edit, onClick: () => {} }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    await user.click(canvas.getByRole('button'));
    await expect(canvas.getByText('Edit')).toBeInTheDocument();
  },
};

export const DisabledAction: Story = {
  args: {
    actions: [
      { label: 'Edit', icon: Edit, onClick: () => {} },
      { label: 'Delete', icon: Trash2, onClick: () => {}, destructive: true, disabled: true },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    await user.click(canvas.getByRole('button'));
    const deleteItem = canvas.getByText('Delete').closest('[role="menuitem"]');
    await expect(deleteItem).toHaveAttribute('data-disabled');
  },
};

export const AlignStart: Story = {
  args: {
    align: 'start',
    actions: [
      { label: 'Edit', icon: Edit, onClick: () => {} },
      { label: 'Delete', icon: Trash2, onClick: () => {}, destructive: true },
    ],
  },
};

export const OpenByDefault: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    actions: [
      { label: 'Edit', icon: Edit, onClick: () => {} },
      { label: 'Favourite', icon: Star, onClick: () => {} },
      { label: 'Delete', icon: Trash2, onClick: () => {}, destructive: true },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Edit')).toBeInTheDocument();
    await expect(canvas.getByText('Delete')).toBeInTheDocument();
  },
};
