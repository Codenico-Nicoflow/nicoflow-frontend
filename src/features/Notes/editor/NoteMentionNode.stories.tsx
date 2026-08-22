import type { TiptapDoc } from '@nicoflow/shared/types';
import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';

import { NoteEditor } from './NoteEditor';

const API = 'http://localhost:8080/v1';

// Renders through the real editor — the chip is a NodeView, so it only makes
// sense mounted in a live Tiptap instance. Its existence check hits
// GET /notes/:id, so each story mocks that response to force the live vs.
// soft-orphan state rather than depending on real backend data.
const meta: Meta<typeof NoteEditor> = {
  title: 'Notes/NoteMention',
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

const docWithMention = (noteId: string, title: string): TiptapDoc => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'See ' },
        { type: 'noteMention', attrs: { noteId, titleSnapshot: title } },
        { type: 'text', text: ' for the full breakdown.' },
      ],
    },
  ],
});

export const Live: Story = {
  args: { content: docWithMention('n2', 'Q3 Roadmap') },
  parameters: {
    msw: {
      handlers: [
        http.get(`${API}/notes/n2`, () =>
          HttpResponse.json({
            data: {
              id: 'n2',
              projectId: 'p1',
              title: 'Q3 Roadmap',
              content: { type: 'doc', content: [{ type: 'paragraph' }] },
              version: 1,
              createdAt: '2026-03-01T08:00:00Z',
              updatedAt: '2026-03-01T08:00:00Z',
            },
            error: null,
          })
        ),
      ],
    },
  },
};

// The mentioned note has since been deleted (NIC-1972 AC3): the chip stays,
// greys out, and stops navigating — it never disappears or throws.
export const SoftOrphan: Story = {
  args: { content: docWithMention('n2', 'Deleted note') },
  parameters: {
    msw: {
      handlers: [
        http.get(`${API}/notes/n2`, () =>
          HttpResponse.json(
            { data: null, error: { code: 'RESOURCE_NOT_FOUND', message: 'not found' } },
            { status: 404 }
          )
        ),
      ],
    },
  },
};
