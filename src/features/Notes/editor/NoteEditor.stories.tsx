import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import type { TiptapDoc } from '@/lib/types';

import { NoteEditor } from './NoteEditor';

const meta: Meta<typeof NoteEditor> = {
  title: 'Notes/NoteEditor',
  component: NoteEditor,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  // No MemoryRouter here — the router comes from the global preview decorator,
  // and nesting a second one breaks navigation in the story (house gotcha).
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

const richDoc: TiptapDoc = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Weekly review' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Reference material lives here — see ' },
        {
          type: 'text',
          text: 'the GTD guide',
          marks: [{ type: 'link', attrs: { href: 'https://example.com/gtd' } }],
        },
        { type: 'text', text: '.' },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Clear the inbox' }] }],
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Review every project' }] }],
        },
      ],
    },
  ],
};

export const Default: Story = {
  args: { content: richDoc },
};

// The empty-doc default the server stores for a note created without content —
// content is NOT NULL server-side, so the editor never sees null.
export const Empty: Story = {
  args: { content: { type: 'doc', content: [] } },
};

export const ReadOnly: Story = {
  args: { content: richDoc, editable: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('toolbar')).not.toBeInTheDocument();
  },
};

// Every toolbar control is icon-only, so each one carries an accessible name.
export const ToolbarAccessibleNames: Story = {
  args: { content: richDoc },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toolbar = await canvas.findByRole('toolbar', { name: 'Formatting' });

    for (const button of within(toolbar).getAllByRole('button')) {
      await expect(button).toHaveAccessibleName();
    }
  },
};
