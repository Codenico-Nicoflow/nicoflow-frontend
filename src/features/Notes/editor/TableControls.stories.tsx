import { useEffect, useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { Editor } from '@tiptap/core';
import { expect, userEvent, within } from 'storybook/test';

import { createNoteExtensions } from './extensions';
import { TableControls } from './TableControls';

// The component drives a real editor, so the story builds one rather than
// mocking it — the assertions are about what the commands do to a document.
const WithEditor = ({ open = true }: { open?: boolean }) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isOpen, setOpen] = useState(open);

  useEffect(() => {
    const instance = new Editor({
      extensions: createNoteExtensions({ placeholder: 'Start writing…' }),
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
    });
    instance.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
    setEditor(instance);
    return () => instance.destroy();
  }, []);

  if (!editor) return null;

  return (
    <div className="flex w-[720px] items-center gap-1 rounded-md border p-1">
      <TableControls editor={editor} open={isOpen} onOpenChange={setOpen} />
    </div>
  );
};

const meta: Meta<typeof WithEditor> = {
  title: 'Notes/TableControls',
  component: WithEditor,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof WithEditor>;

export const Closed: Story = { args: { open: false } };

export const Open: Story = { args: { open: true } };

// The whole reason this is a menu and not a row of icons: add-column-before,
// add-column-after and delete-column are indistinguishable as glyphs at 16px.
export const EveryOperationIsNamedInWords: Story = {
  args: { open: true },
  play: async () => {
    // The menu portals out of the canvas, and sibling stories may have one open
    // in the same run — scope to the last mounted menu, not to document.body.
    const menus = await within(document.body).findAllByRole('menu');
    const body = within(menus.at(-1) as HTMLElement);

    for (const label of [
      'Add column before',
      'Add column after',
      'Add row before',
      'Add row after',
      'Toggle header row',
      'Merge or split cells',
      'Delete column',
      'Delete row',
      'Delete table',
    ]) {
      await expect(body.getByRole('menuitem', { name: label })).toBeInTheDocument();
    }
  },
};

export const OpensFromTheTrigger: Story = {
  args: { open: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByTestId('note-table-menu'));

    await expect((await within(document.body).findAllByRole('menu')).length).toBeGreaterThan(0);
  },
};
