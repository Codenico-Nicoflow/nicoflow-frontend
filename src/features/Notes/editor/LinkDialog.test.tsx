import { renderComponent } from '__tests__/renderComponent';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Editor } from '@tiptap/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TiptapDoc } from '@/lib/types';

import { createNoteExtensions } from './extensions';
import { LinkDialog } from './LinkDialog';

const collectLinks = (doc: TiptapDoc): NonNullable<TiptapDoc['marks']> => [
  ...(doc.marks?.filter(mark => mark.type === 'link') ?? []),
  ...(doc.content?.flatMap(collectLinks) ?? []),
];

let editor: Editor;

beforeEach(() => {
  editor = new Editor({
    extensions: createNoteExtensions({ placeholder: 'Write something…' }),
    content: '<p>select me</p>',
  });
  editor.commands.setTextSelection({ from: 1, to: 10 });
});

afterEach(() => editor.destroy());

describe('LinkDialog', () => {
  it('opens with the protocol rule stated rather than hidden behind a failed submit', () => {
    renderComponent(<LinkDialog editor={editor} open onOpenChange={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Add link' })).toBeInTheDocument();
    expect(screen.getByText(/Only http, https and mailto addresses are allowed/)).toBeInTheDocument();
  });

  // The https:// stub is a starting point, not a URL — saving it would mark the
  // selection with a link that goes nowhere.
  it('keeps saving disabled until the field holds more than the protocol stub', () => {
    renderComponent(<LinkDialog editor={editor} open onOpenChange={vi.fn()} />);

    expect(screen.getByTestId('note-link-save')).toBeDisabled();
  });

  it('rejects a javascript: URL inline and refuses to save it', async () => {
    const user = userEvent.setup();
    renderComponent(<LinkDialog editor={editor} open onOpenChange={vi.fn()} />);

    await user.clear(screen.getByTestId('note-link-input'));
    await user.type(screen.getByTestId('note-link-input'), 'javascript:alert(1)');

    expect(await screen.findByRole('alert')).toHaveTextContent(/isn't allowed/);
    expect(screen.getByTestId('note-link-input')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByTestId('note-link-save')).toBeDisabled();
    expect(collectLinks(editor.getJSON() as TiptapDoc)).toHaveLength(0);
  });

  it('applies an allowed URL to the selection and closes', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderComponent(<LinkDialog editor={editor} open onOpenChange={onOpenChange} />);

    await user.clear(screen.getByTestId('note-link-input'));
    await user.type(screen.getByTestId('note-link-input'), 'https://nicoflow.app/docs');
    await user.click(screen.getByTestId('note-link-save'));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    const links = collectLinks(editor.getJSON() as TiptapDoc);
    expect(links).toHaveLength(1);
    expect(links[0]?.attrs?.href).toBe('https://nicoflow.app/docs');
  });

  it('leaves the document alone when cancelled', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderComponent(<LinkDialog editor={editor} open onOpenChange={onOpenChange} />);

    await user.clear(screen.getByTestId('note-link-input'));
    await user.type(screen.getByTestId('note-link-input'), 'https://nicoflow.app/docs');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(collectLinks(editor.getJSON() as TiptapDoc)).toHaveLength(0);
  });

  it('seeds the field from the link under the caret and can remove it', async () => {
    editor.commands.setLink({ href: 'https://example.com/existing' });
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderComponent(<LinkDialog editor={editor} open onOpenChange={onOpenChange} />);

    expect(screen.getByTestId('note-link-input')).toHaveValue('https://example.com/existing');

    await user.click(screen.getByRole('button', { name: 'Remove link' }));

    expect(collectLinks(editor.getJSON() as TiptapDoc)).toHaveLength(0);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
