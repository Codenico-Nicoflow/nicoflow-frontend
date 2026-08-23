import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Editor } from '@tiptap/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ColorPicker } from './ColorPicker';
import { NOTE_COLOR_TOKENS } from './colorTokens';
import { createNoteExtensions } from './extensions';

let editor: Editor;

beforeEach(() => {
  editor = new Editor({
    extensions: createNoteExtensions({ placeholder: 'Write something…' }),
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }] },
  });
  editor.commands.setTextSelection({ from: 1, to: 6 });
});

afterEach(() => editor.destroy());

const openPicker = async (variant: 'text' | 'highlight') => {
  const user = userEvent.setup();
  renderComponent(<ColorPicker editor={editor} variant={variant} activeToken={null} />);
  await user.click(screen.getByTestId(`note-${variant}-color-trigger`));
  return user;
};

describe('ColorPicker', () => {
  // AC3: the only controls are the fixed swatch grid and a Default entry — no
  // free-text color input anywhere in either picker.
  it.each(['text', 'highlight'] as const)('exposes only fixed swatches, no hex/RGB input, for %s', async variant => {
    await openPicker(variant);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/hex|rgb/i)).not.toBeInTheDocument();

    for (const token of NOTE_COLOR_TOKENS) {
      expect(screen.getByTestId(`note-${variant}-color-${token}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId(`note-${variant}-color-default`)).toBeInTheDocument();
  });

  it('applies a text-color token when a swatch is clicked', async () => {
    const user = await openPicker('text');

    await user.click(screen.getByTestId('note-text-color-yellow'));

    expect(editor.isActive('textColor', { color: 'yellow' })).toBe(true);
  });

  it('applies a highlight token when a swatch is clicked', async () => {
    const user = await openPicker('highlight');

    await user.click(screen.getByTestId('note-highlight-color-brown'));

    expect(editor.isActive('highlight', { color: 'brown' })).toBe(true);
  });

  it('clears the mark when Default is clicked', async () => {
    editor.commands.setNoteTextColor('red');
    const user = await openPicker('text');

    await user.click(screen.getByTestId('note-text-color-default'));

    expect(editor.isActive('textColor')).toBe(false);
  });
});
