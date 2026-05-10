import type { Meta, StoryObj } from '@storybook/react';
import { Edit, Star, Trash2 } from 'lucide-react';

import { ItemActionsMenu } from '.';

const meta: Meta<typeof ItemActionsMenu> = {
  title: 'Components/Actions/ItemActionsMenu',
  component: ItemActionsMenu,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
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
};

export const SingleAction: Story = {
  args: {
    actions: [{ label: 'Edit', icon: Edit, onClick: () => {} }],
  },
};

export const DisabledAction: Story = {
  args: {
    actions: [
      { label: 'Edit', icon: Edit, onClick: () => {} },
      { label: 'Delete', icon: Trash2, onClick: () => {}, destructive: true, disabled: true },
    ],
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
};
