import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CreateNoteBody } from './CreateNoteBody';

// Matches the real wire shape the backend emits for a create_note tool call.
const validBlocks = [
  { kind: 'heading', text: 'Agenda', level: 1 },
  { kind: 'bulletList', items: ['Discuss budget', 'Plan roadmap'] },
];

describe('CreateNoteBody', () => {
  it('renders the editor preview when input has a valid blocks array', () => {
    renderComponent(<CreateNoteBody input={{ projectId: 'p-1', title: 'Meeting Notes', blocks: validBlocks }} />);
    expect(screen.getByLabelText('Note preview')).toBeInTheDocument();
  });

  it('renders nothing when blocks is missing', () => {
    renderComponent(<CreateNoteBody input={{ title: 'No blocks' }} />);
    expect(screen.queryByLabelText('Note preview')).not.toBeInTheDocument();
  });

  it('renders nothing when input is not an object', () => {
    renderComponent(<CreateNoteBody input={null} />);
    expect(screen.queryByLabelText('Note preview')).not.toBeInTheDocument();
  });

  it('renders nothing when blocks is an empty array', () => {
    renderComponent(<CreateNoteBody input={{ blocks: [] }} />);
    expect(screen.queryByLabelText('Note preview')).not.toBeInTheDocument();
  });

  it('renders nothing when blocks contains an unknown kind', () => {
    renderComponent(<CreateNoteBody input={{ blocks: [{ kind: 'unknown' }] }} />);
    expect(screen.queryByLabelText('Note preview')).not.toBeInTheDocument();
  });

  it('renders a paragraph block', () => {
    renderComponent(<CreateNoteBody input={{ blocks: [{ kind: 'paragraph', text: 'Hello' }] }} />);
    expect(screen.getByLabelText('Note preview')).toBeInTheDocument();
  });

  it('renders a taskList block', () => {
    renderComponent(
      <CreateNoteBody
        input={{
          blocks: [
            {
              kind: 'taskList',
              tasks: [
                { text: 'Buy milk', checked: false },
                { text: 'Done', checked: true },
              ],
            },
          ],
        }}
      />
    );
    expect(screen.getByLabelText('Note preview')).toBeInTheDocument();
  });
});
