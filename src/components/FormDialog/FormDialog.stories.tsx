import type { Meta, StoryObj } from '@storybook/react';
import { Folder } from 'lucide-react';
import { expect, screen } from 'storybook/test';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { FormDialog } from '.';

const SampleFields = () => (
  <div className="space-y-4">
    <div className="space-y-1.5">
      <Label>Name</Label>
      <Input placeholder="Enter name..." />
    </div>
    <div className="space-y-1.5">
      <Label>Description</Label>
      <Input placeholder="Enter description..." />
    </div>
  </div>
);

// Renders open so the Controls panel drives the live dialog.
const meta: Meta<typeof FormDialog> = {
  title: 'Components/Dialogs/FormDialog',
  component: FormDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    onOpenChange: () => {},
    onSubmit: () => {},
    title: 'Create Project',
    description: 'Add a new project to your workspace.',
    icon: Folder,
    isEditMode: false,
    isLoading: false,
    hasChanges: true,
    maxWidth: 'md',
    children: <SampleFields />,
  },
  argTypes: {
    maxWidth: { control: 'select', options: ['sm', 'md', 'lg', 'xl', '2xl'] },
    isEditMode: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    hasChanges: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof FormDialog>;

export const CreateMode: Story = {
  play: async () => {
    await expect(await screen.findByText('Create Project')).toBeInTheDocument();
    await expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  },
};

export const EditMode: Story = {
  args: { isEditMode: true, title: 'Edit Project', description: undefined },
  play: async () => {
    await expect(await screen.findByText('Edit Project')).toBeInTheDocument();
    await expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  },
};

export const EditModeNoChanges: Story = {
  args: { isEditMode: true, title: 'Edit Project', hasChanges: false },
  play: async () => {
    await expect(await screen.findByRole('button', { name: /save changes/i })).toBeDisabled();
  },
};

export const Loading: Story = {
  args: { title: 'Creating Project...', isLoading: true },
  play: async () => {
    await expect(await screen.findByText(/creating\.\.\./i)).toBeInTheDocument();
  },
};

export const WideDialog: Story = { args: { title: 'Create Task', maxWidth: 'xl' } };
