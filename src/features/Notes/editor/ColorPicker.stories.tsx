import { useEffect, useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';
import { Editor } from '@tiptap/core';

import { ColorPicker, type ColorPickerVariant } from './ColorPicker';
import { createNoteExtensions } from './extensions';

// Use the global theme toolbar toggle (top of the Storybook UI) to check both
// themes — every swatch is a CSS custom property, so no story-level decorator
// is needed for it to repaint correctly.
const WithEditor = ({ variant }: { variant: ColorPickerVariant }) => {
  const [editor, setEditor] = useState<Editor | null>(null);

  useEffect(() => {
    const instance = new Editor({
      extensions: createNoteExtensions({ placeholder: 'Start writing…' }),
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Sample text' }] }] },
    });
    instance.commands.setTextSelection({ from: 1, to: 12 });
    setEditor(instance);
    return () => instance.destroy();
  }, []);

  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 rounded-md border p-1">
      <ColorPicker editor={editor} variant={variant} activeToken={null} />
    </div>
  );
};

const meta: Meta<typeof WithEditor> = {
  title: 'Notes/ColorPicker',
  component: WithEditor,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof WithEditor>;

export const TextColor: Story = { args: { variant: 'text' } };

export const Highlight: Story = { args: { variant: 'highlight' } };
