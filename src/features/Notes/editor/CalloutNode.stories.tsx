import type { TiptapDoc } from '@nicoflow/shared/types';
import type { Meta, StoryObj } from '@storybook/react';

import { NoteEditor } from './NoteEditor';

// Renders through the real editor rather than the bare node in isolation —
// the callout is a NodeView, so its icon-cycle button and content editing
// only make sense wired into a live Tiptap instance. Use the global theme
// toolbar toggle to check both themes: the background tint is a CSS custom
// property (--note-highlight-*, shared with the highlight mark), so no
// story-level decorator is needed for it to repaint correctly.
const meta: Meta<typeof NoteEditor> = {
  title: 'Notes/CalloutAndDivider',
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

const docWithBlocks: TiptapDoc = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Notes on the migration plan.' }] },
    {
      type: 'callout',
      attrs: { icon: 'warning', colorToken: 'yellow' },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'This step is irreversible once started.' }] }],
    },
    { type: 'horizontalRule' },
    {
      type: 'callout',
      attrs: { icon: 'idea', colorToken: 'blue' },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Consider a feature flag for rollback.' }] }],
    },
  ],
};

export const Default: Story = {
  args: { content: docWithBlocks },
};
