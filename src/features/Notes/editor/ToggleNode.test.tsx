import { renderComponent } from '__tests__/renderComponent';
import type { TiptapDoc } from '@nicoflow/shared/types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { createNoteExtensions } from './extensions';
import { NoteEditor } from './NoteEditor';

const docWithToggle: TiptapDoc = {
  type: 'doc',
  content: [
    {
      type: 'noteToggle',
      attrs: { open: true },
      content: [
        { type: 'noteToggleSummary', content: [{ type: 'text', text: 'Click for details' }] },
        { type: 'noteToggleContent', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'the body' }] }] },
      ],
    },
  ],
};

describe('ToggleNode', () => {
  it('renders expanded with its summary and content visible', async () => {
    renderComponent(<NoteEditor content={docWithToggle} />);

    await waitFor(() => expect(screen.getByTestId('note-toggle')).toBeInTheDocument());

    expect(screen.getByTestId('note-toggle')).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('note-toggle-trigger')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Click for details')).toBeInTheDocument();
    expect(screen.getByText('the body')).toBeInTheDocument();
  });

  it('collapses on click, hiding the content but keeping the summary visible', async () => {
    const user = userEvent.setup();
    renderComponent(<NoteEditor content={docWithToggle} />);

    await waitFor(() => expect(screen.getByTestId('note-toggle-trigger')).toBeInTheDocument());
    await user.click(screen.getByTestId('note-toggle-trigger'));

    expect(screen.getByTestId('note-toggle')).toHaveAttribute('data-open', 'false');
    expect(screen.getByTestId('note-toggle-trigger')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Click for details')).toBeInTheDocument();
  });

  it('expands again on a second click', async () => {
    const user = userEvent.setup();
    renderComponent(<NoteEditor content={docWithToggle} />);

    await waitFor(() => expect(screen.getByTestId('note-toggle-trigger')).toBeInTheDocument());
    await user.click(screen.getByTestId('note-toggle-trigger'));
    await user.click(screen.getByTestId('note-toggle-trigger'));

    expect(screen.getByTestId('note-toggle')).toHaveAttribute('data-open', 'true');
  });
});

// Guards against createNoteExtensions ever dropping the nodes this component
// depends on.
describe('note toggle extension registration', () => {
  it('registers the noteToggle node group used by ToggleNode', () => {
    const extensions = createNoteExtensions({ placeholder: '' });
    const names = extensions.map(ext => ext.name);

    expect(names).toContain('noteToggle');
    expect(names).toContain('noteToggleSummary');
    expect(names).toContain('noteToggleContent');
  });
});
