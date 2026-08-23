import type { TiptapDoc } from '@nicoflow/shared/types';
import type { Meta, StoryObj } from '@storybook/react';

import { NoteEditor } from './NoteEditor';

// Renders through the real editor — the chip is a NodeView, so it only makes
// sense mounted in a live Tiptap instance. Use the global theme toolbar
// toggle to check both themes: the chip uses bg-accent/text-accent-foreground
// (already theme-aware CSS custom properties), so no story-level decorator
// is needed for it to repaint correctly.
const meta: Meta<typeof NoteEditor> = {
  title: 'Notes/DateMention',
  component: NoteEditor,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    Story => (
      <div className="w-[720px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof NoteEditor>;

const docWithMention: TiptapDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Renewal is due ' },
        { type: 'dateMention', attrs: { date: '2026-09-15' } },
        { type: 'text', text: ' — check with billing before then.' },
      ],
    },
  ],
};

export const Default: Story = {
  args: { content: docWithMention },
};
