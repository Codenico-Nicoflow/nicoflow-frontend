import { renderComponent } from '__tests__/renderComponent';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { TiptapDoc } from '@/lib/types';

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
