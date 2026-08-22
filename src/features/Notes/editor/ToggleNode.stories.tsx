import type { TiptapDoc } from '@nicoflow/shared/types';
import type { Meta, StoryObj } from '@storybook/react';

import { NoteEditor } from './NoteEditor';

// Renders through the real editor rather than the bare node in isolation —
// the toggle is a NodeView, so its collapse/expand chevron only makes sense
// wired into a live Tiptap instance. Use the global theme toolbar toggle to
// check both themes: the border/chrome are the same design tokens the rest
// of the editor already uses, so no story-level decorator is needed.
const meta: Meta<typeof NoteEditor> = {
  title: 'Notes/ToggleBlock',
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

const docWithToggles: TiptapDoc = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Meeting notes.' }] },
    {
      type: 'noteToggle',
      attrs: { open: true },
      content: [
        { type: 'noteToggleSummary', content: [{ type: 'text', text: 'Expanded — click to collapse' }] },
        {
          type: 'noteToggleContent',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'This body is visible right now.' }] }],
        },
      ],
    },
    {
      type: 'noteToggle',
      attrs: { open: false },
      content: [
        { type: 'noteToggleSummary', content: [{ type: 'text', text: 'Collapsed — click to expand' }] },
        {
          type: 'noteToggleContent',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'This body starts hidden.' }] }],
        },
      ],
    },
  ],
};

export const Default: Story = {
  args: { content: docWithToggles },
};
