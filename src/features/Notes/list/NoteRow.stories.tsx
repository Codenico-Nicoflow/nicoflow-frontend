import type { Meta, StoryObj } from '@storybook/react';
import { NotebookPen } from 'lucide-react';
import { expect, within } from 'storybook/test';

import { EmptyState } from '@/components';
import type { INote } from '@/lib/types';

import { NoteRow } from './NoteRow';

const meta: Meta<typeof NoteRow> = {
  title: 'Notes/NoteRow',
  component: NoteRow,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  // No MemoryRouter — the router comes from the global preview decorator.
  decorators: [
    Story => (
      <div className="w-[560px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof NoteRow>;

const note = (overrides: Partial<INote> = {}): INote => ({
  id: 'n1',
  projectId: 'p1',
  title: 'Meeting minutes — 3 March',
  excerpt: 'We agreed to ship the notes surface before the editor, so the list can be reviewed on its own.',
  version: 4,
  createdAt: '2026-03-01T08:00:00Z',
  updatedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  ...overrides,
});

export const Default: Story = {
  args: { note: note(), onOpen: () => {} },
};

// The excerpt is the server's 200-char plain-text summary; long ones clamp to
// two lines rather than pushing the row open.
export const LongExcerpt: Story = {
  args: {
    note: note({
      excerpt:
        'A long stretch of reference material that runs well past the width of the row and has to clamp rather than reflow the list. '.repeat(
          2
        ),
    }),
    onOpen: () => {},
  },
};

// A note created but not yet titled or written — the common state right after
// the create affordance routes into the editor.
export const UntitledAndEmpty: Story = {
  args: { note: note({ title: '', excerpt: '' }), onOpen: () => {} },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Untitled note')).toBeInTheDocument();
    await expect(canvas.getByText('Empty note')).toBeInTheDocument();
  },
};

export const Empty: StoryObj = {
  render: () => (
    <EmptyState
      icon={NotebookPen}
      title="No notes yet"
      description="Notes are for reference material that outlives a task — meeting minutes, research, decisions."
      data-testid="notes-empty"
    />
  ),
};
