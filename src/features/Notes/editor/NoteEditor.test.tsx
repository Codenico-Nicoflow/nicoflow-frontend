import { renderComponent } from '__tests__/renderComponent';
import type { TiptapDoc } from '@nicoflow/shared/types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { NoteEditor } from './NoteEditor';

// jsdom has no elementFromPoint; ProseMirror calls it on every mousedown to map
// a click to a document position, and the throw escapes as an unhandled error
// that fails the run even when the assertions pass. Scoped to this file rather
// than the global setup on purpose: Radix's hideOthers also calls it, and a
// blanket `() => null` makes it aria-hidden its own focus guards, which trips
// the BottomNav axe suite.
const hadElementFromPoint = 'elementFromPoint' in document;

beforeAll(() => {
  if (!hadElementFromPoint) document.elementFromPoint = () => null;
});

afterAll(() => {
  if (!hadElementFromPoint) Reflect.deleteProperty(document, 'elementFromPoint');
});

const docWith = (text: string): TiptapDoc => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

describe('NoteEditor', () => {
  it('renders the stored document', async () => {
    renderComponent(<NoteEditor content={docWith('reference material')} />);

    await waitFor(() => expect(screen.getByText('reference material')).toBeInTheDocument());
  });

  it('exposes the editing surface and toolbar to assistive tech', async () => {
    renderComponent(<NoteEditor content={docWith('hello')} />);

    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument());
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument();
  });

  // AC6: icon-only controls need accessible names, and toggles need a state a
  // screen reader can read — colour alone doesn't carry it.
  it('gives every toolbar control an accessible name and a pressed state', async () => {
    renderComponent(<NoteEditor content={docWith('hello')} />);

    const toolbar = await screen.findByRole('toolbar', { name: 'Formatting' });
    const buttons = within(toolbar).getAllByRole('button');

    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button).toHaveAccessibleName();
    }
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('applies bold through the toolbar and reports the new document', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderComponent(<NoteEditor content={docWith('hello')} onChange={onChange} />);

    await screen.findByRole('textbox');
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Control>}a{/Control}');
    await user.click(screen.getByRole('button', { name: 'Bold' }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const latest = onChange.mock.calls.at(-1)?.[0] as TiptapDoc;
    expect(JSON.stringify(latest)).toContain('bold');
  });

  // Tiptap v3 does not re-render on transactions, so a toolbar reading
  // isActive() during render froze at its first-render value: applying bold left
  // the button reporting unpressed, and the table group never appeared.
  it('keeps the pressed state in step with the document', async () => {
    const user = userEvent.setup();
    renderComponent(<NoteEditor content={docWith('hello')} />);

    await screen.findByRole('textbox');
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Control>}a{/Control}');
    await user.click(screen.getByRole('button', { name: 'Bold' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true'));
  });

  // The table operations are only meaningful inside a table, so the group is
  // absent until the caret is in one.
  it('reveals the table menu only once the document has a table', async () => {
    const user = userEvent.setup();
    renderComponent(<NoteEditor content={docWith('hello')} />);

    await screen.findByRole('textbox');
    expect(screen.queryByTestId('note-table-menu')).not.toBeInTheDocument();

    await user.click(screen.getByRole('textbox'));
    await user.click(screen.getByRole('button', { name: 'Insert table' }));

    await waitFor(() => expect(screen.getByTestId('note-table-menu')).toBeInTheDocument());
  });

  // The server stores {type:'doc',content:[]} for every new note. Rendered
  // as-is that is an empty ProseMirror with no paragraph — no caret target, and
  // no node for the placeholder to attach to, so a new note opened dead.
  it('gives the server default empty document something to type into', async () => {
    renderComponent(<NoteEditor content={{ type: 'doc', content: [] }} />);

    const textbox = await screen.findByRole('textbox');
    await waitFor(() => expect(textbox.querySelector('p')).not.toBeNull());
    expect(textbox.querySelector('p')).toHaveAttribute('data-placeholder', 'Start writing…');
  });

  it('hides the toolbar when the editor is read-only', async () => {
    renderComponent(<NoteEditor content={docWith('hello')} editable={false} />);

    await waitFor(() => expect(screen.getByText('hello')).toBeInTheDocument());
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  // A document ProseMirror can't parse comes back empty. Reporting it is what
  // lets the page stop autosaving that blank over the real stored note.
  it('reports a content error for a document it cannot parse', async () => {
    const onContentError = vi.fn();
    renderComponent(
      <NoteEditor content={{ type: 'doc', content: [{ type: 'someFutureNode' }] }} onContentError={onContentError} />
    );

    await waitFor(() => expect(onContentError).toHaveBeenCalled());
  });
});
