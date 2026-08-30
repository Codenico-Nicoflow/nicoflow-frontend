import type { Meta, StoryObj } from '@storybook/react';

import { EditScopeDialog } from './EditScopeDialog';

const meta: Meta<typeof EditScopeDialog> = {
  title: 'Tasks/EditScopeDialog',
  component: EditScopeDialog,
  parameters: { layout: 'centered' },
  args: {
    open: true,
    onOpenChange: () => {},
    onChoose: () => {},
    isLoading: false,
  },
};
export default meta;

type Story = StoryObj<typeof EditScopeDialog>;

export const Default: Story = { name: 'Scope picker — idle' };

export const Loading: Story = {
  name: 'Scope picker — saving',
  args: { isLoading: true },
};
