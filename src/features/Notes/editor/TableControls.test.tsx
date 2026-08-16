import { renderComponent } from '__tests__/renderComponent';
import type { TiptapDoc } from '@nicoflow/shared/types';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Editor } from '@tiptap/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createNoteExtensions } from './extensions';
import { TableControls } from './TableControls';

const countCells = (doc: TiptapDoc, type: 'tableRow' | 'tableCell' | 'tableHeader'): number =>
  (doc.type === type ? 1 : 0) + (doc.content?.reduce((sum, child) => sum + countCells(child, type), 0) ?? 0);

const hasNodeType = (doc: TiptapDoc, type: string): boolean =>
  doc.type === type || (doc.content?.some(child => hasNodeType(child, type)) ?? false);

let editor: Editor;

beforeEach(() => {
  editor = new Editor({
    extensions: createNoteExtensions({ placeholder: 'Write something…' }),
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
  });
  editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
});

afterEach(() => editor.destroy());

const openMenu = async () => {
  const user = userEvent.setup();
  renderComponent(<TableControls editor={editor} open onOpenChange={vi.fn()} />);
  return user;
};

describe('TableControls', () => {
  // The operations these replace were three near-identical column glyphs at
  // 16px. Words are the point of the menu, so assert they are actually words.
  it('names every table operation in words rather than icons alone', async () => {
    await openMenu();

    for (const label of [
      'Add column before',
      'Add column after',
      'Add row before',
      'Add row after',
      'Toggle header row',
      'Merge or split cells',
      'Delete column',
      'Delete row',
      'Delete table',
    ]) {
      expect(screen.getByRole('menuitem', { name: label })).toBeInTheDocument();
    }
  });

  it('adds a column', async () => {
    const user = await openMenu();
    const before = countCells(editor.getJSON() as TiptapDoc, 'tableCell');

    await user.click(screen.getByRole('menuitem', { name: 'Add column after' }));

    expect(countCells(editor.getJSON() as TiptapDoc, 'tableCell')).toBeGreaterThan(before);
  });

  it('adds a row', async () => {
    const user = await openMenu();
    const before = countCells(editor.getJSON() as TiptapDoc, 'tableRow');

    await user.click(screen.getByRole('menuitem', { name: 'Add row after' }));

    expect(countCells(editor.getJSON() as TiptapDoc, 'tableRow')).toBe(before + 1);
  });

  it('deletes a row', async () => {
    const user = await openMenu();
    const before = countCells(editor.getJSON() as TiptapDoc, 'tableRow');

    await user.click(screen.getByRole('menuitem', { name: 'Delete row' }));

    expect(countCells(editor.getJSON() as TiptapDoc, 'tableRow')).toBe(before - 1);
  });

  it('deletes the whole table', async () => {
    const user = await openMenu();

    await user.click(screen.getByRole('menuitem', { name: 'Delete table' }));

    expect(hasNodeType(editor.getJSON() as TiptapDoc, 'table')).toBe(false);
  });

  it('reports the menu closing so the caller can unmount the group', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderComponent(<TableControls editor={editor} open onOpenChange={onOpenChange} />);

    await user.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
