import { renderComponent } from '__tests__/renderComponent';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { NoteEditor } from './NoteEditor';

describe('DatePickerControl', () => {
  it('opens a calendar popover from the toolbar trigger, no free-text input', async () => {
    const user = userEvent.setup();
    renderComponent(<NoteEditor content={{ type: 'doc', content: [{ type: 'paragraph' }] }} />);

    await waitFor(() => expect(screen.getByTestId('note-date-mention-trigger')).toBeInTheDocument());
    await user.click(screen.getByTestId('note-date-mention-trigger'));

    expect(await screen.findByRole('grid')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /date/i })).not.toBeInTheDocument();
  });

  it('inserts a date-mention chip when a day is picked', async () => {
    const user = userEvent.setup();
    renderComponent(<NoteEditor content={{ type: 'doc', content: [{ type: 'paragraph' }] }} />);

    await waitFor(() => expect(screen.getByTestId('note-date-mention-trigger')).toBeInTheDocument());
    await user.click(screen.getByTestId('note-date-mention-trigger'));

    const grid = await screen.findByRole('grid');
    const dayButtons = within(grid)
      .getAllByRole('button')
      .filter(button => /^\d+$/.test(button.textContent ?? ''));
    expect(dayButtons.length).toBeGreaterThan(0);
    await user.click(dayButtons[0]!);

    await waitFor(() => expect(screen.getByTestId('note-date-mention')).toBeInTheDocument());
  });
});
