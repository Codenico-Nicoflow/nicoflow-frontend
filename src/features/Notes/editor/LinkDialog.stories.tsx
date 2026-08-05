import { useEffect, useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { Editor } from '@tiptap/core';
import { expect, userEvent, within } from 'storybook/test';

import { createNoteExtensions } from './extensions';
import { LinkDialog } from './LinkDialog';

const WithEditor = ({ href }: { href?: string }) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const instance = new Editor({
      extensions: createNoteExtensions({ placeholder: 'Start writing…' }),
      content: '<p>select me</p>',
    });
    instance.commands.setTextSelection({ from: 1, to: 10 });
    if (href) instance.commands.setLink({ href });
    setEditor(instance);
    return () => instance.destroy();
  }, [href]);

  if (!editor) return null;

  return <LinkDialog editor={editor} open={open} onOpenChange={setOpen} />;
};

const meta: Meta<typeof WithEditor> = {
  title: 'Notes/LinkDialog',
  component: WithEditor,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof WithEditor>;

// Replaces window.prompt, which couldn't be styled, blocked the tab, and could
// only explain a rejected URL after it had already closed.
export const Default: Story = {};

// The dialog portals out of the canvas, and several stories in a run have one
// mounted at once — so every query is scoped to this story's own dialog rather
// than to document.body, which would match a sibling story's leftover DOM.
const openDialog = async () => {
  const dialogs = await within(document.body).findAllByTestId('note-link-dialog');
  return within(dialogs.at(-1) as HTMLElement);
};

// Editing an existing link starts from its current href, and offers removal.
export const EditingAnExistingLink: Story = {
  args: { href: 'https://example.com/existing' },
  play: async () => {
    const dialog = await openDialog();

    await expect(dialog.getByTestId('note-link-input')).toHaveValue('https://example.com/existing');
    await expect(dialog.getByRole('button', { name: 'Remove link' })).toBeInTheDocument();
  },
};

// The rule is stated up front and enforced next to the field, rather than as a
// toast fired after the dialog has closed.
export const RejectsADisallowedProtocol: Story = {
  play: async () => {
    const dialog = await openDialog();
    const input = dialog.getByTestId('note-link-input');

    await userEvent.clear(input);
    await userEvent.type(input, 'javascript:alert(1)');

    await expect(await dialog.findByRole('alert')).toBeInTheDocument();
    await expect(dialog.getByTestId('note-link-save')).toBeDisabled();
  },
};

export const EnablesSavingForAnAllowedUrl: Story = {
  play: async () => {
    const dialog = await openDialog();
    const input = dialog.getByTestId('note-link-input');

    await userEvent.clear(input);
    await userEvent.type(input, 'https://nicoflow.app/docs');

    await expect(dialog.getByTestId('note-link-save')).toBeEnabled();
  },
};
