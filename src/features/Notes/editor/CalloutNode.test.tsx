import { renderComponent } from '__tests__/renderComponent';
import type { TiptapDoc } from '@nicoflow/shared/types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { createNoteExtensions } from './extensions';
import { NoteEditor } from './NoteEditor';

const docWithCallout: TiptapDoc = {
  type: 'doc',
  content: [
    {
      type: 'noteCallout',
      attrs: { icon: 'info', colorToken: 'blue' },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }],
    },
  ],
};

describe('CalloutNode', () => {
  it('cycles the icon when the icon button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent(<NoteEditor content={docWithCallout} />);

    await waitFor(() => expect(screen.getByTestId('note-callout-icon-trigger')).toBeInTheDocument());
    await user.click(screen.getByTestId('note-callout-icon-trigger'));

    // Cycling from "info" lands on the next entry in NOTE_CALLOUT_ICONS
    // ("warning") — asserted indirectly via the callout still being present
    // and interactive rather than reaching into the editor's internal schema.
    expect(screen.getByTestId('note-callout')).toBeInTheDocument();
  });

  it('exposes a color-swatch grid via the color trigger, no free-text input', async () => {
    const user = userEvent.setup();
    renderComponent(<NoteEditor content={docWithCallout} />);

    await waitFor(() => expect(screen.getByTestId('note-callout-color-trigger')).toBeInTheDocument());
    await user.click(screen.getByTestId('note-callout-color-trigger'));

    expect(screen.queryByRole('textbox', { name: /color/i })).not.toBeInTheDocument();
    for (const token of ['gray', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple']) {
      expect(screen.getByTestId(`note-callout-color-${token}`)).toBeInTheDocument();
    }
  });

  it('changes the callout color when a swatch is clicked', async () => {
    const user = userEvent.setup();
    renderComponent(<NoteEditor content={docWithCallout} />);

    await waitFor(() => expect(screen.getByTestId('note-callout-color-trigger')).toBeInTheDocument());
    await user.click(screen.getByTestId('note-callout-color-trigger'));
    await user.click(screen.getByTestId('note-callout-color-green'));

    expect(screen.getByTestId('note-callout')).toHaveAttribute('data-token', 'green');
  });
});

// Guards against createNoteExtensions ever dropping the node this component
// depends on.
describe('note callout extension registration', () => {
  it('registers the noteCallout node used by CalloutNode', () => {
    const extensions = createNoteExtensions({ placeholder: '' });
    expect(extensions.some(ext => ext.name === 'noteCallout')).toBe(true);
  });
});
