import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { Folder } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { FormDialog } from '.';

const meta: Meta<typeof FormDialog> = {
  title: 'Components/Dialogs/FormDialog',
  component: FormDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof FormDialog>;

const DialogWrapper = ({
  children,
}: {
  children: (props: { open: boolean; onOpenChange: (v: boolean) => void }) => React.ReactNode;
}) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex flex-col items-center gap-4">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open Dialog
      </Button>
      {children({ open, onOpenChange: setOpen })}
    </div>
  );
};

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

export const CreateMode: Story = {
  render: () => (
    <DialogWrapper>
      {({ open, onOpenChange }) => (
        <FormDialog
          open={open}
          onOpenChange={onOpenChange}
          title="Create Project"
          description="Add a new project to your workspace."
          icon={Folder}
          isEditMode={false}
          onSubmit={() => onOpenChange(false)}
        >
          <SampleFields />
        </FormDialog>
      )}
    </DialogWrapper>
  ),
};

export const EditMode: Story = {
  render: () => (
    <DialogWrapper>
      {({ open, onOpenChange }) => (
        <FormDialog
          open={open}
          onOpenChange={onOpenChange}
          title="Edit Project"
          icon={Folder}
          isEditMode
          hasChanges
          onSubmit={() => onOpenChange(false)}
        >
          <SampleFields />
        </FormDialog>
      )}
    </DialogWrapper>
  ),
};

export const EditModeNoChanges: Story = {
  render: () => (
    <DialogWrapper>
      {({ open, onOpenChange }) => (
        <FormDialog
          open={open}
          onOpenChange={onOpenChange}
          title="Edit Project"
          icon={Folder}
          isEditMode
          hasChanges={false}
          onSubmit={() => onOpenChange(false)}
        >
          <SampleFields />
        </FormDialog>
      )}
    </DialogWrapper>
  ),
};

export const Loading: Story = {
  render: () => (
    <FormDialog open onOpenChange={() => {}} title="Creating Project..." icon={Folder} isLoading onSubmit={() => {}}>
      <SampleFields />
    </FormDialog>
  ),
};

export const WideDialog: Story = {
  render: () => (
    <DialogWrapper>
      {({ open, onOpenChange }) => (
        <FormDialog
          open={open}
          onOpenChange={onOpenChange}
          title="Create Task"
          description="Add a detailed task with all fields."
          maxWidth="xl"
          onSubmit={() => onOpenChange(false)}
        >
          <SampleFields />
        </FormDialog>
      )}
    </DialogWrapper>
  ),
};
