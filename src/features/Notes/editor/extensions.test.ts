import type { TiptapDoc } from '@nicoflow/shared/types';
import { Editor } from '@tiptap/core';
import { describe, expect, it, vi } from 'vitest';

import { createNoteExtensions, isAllowedLinkProtocol, openLinkFromEvent } from './extensions';

const makeEditor = (content?: TiptapDoc) =>
  new Editor({
    extensions: createNoteExtensions({ placeholder: 'Write something…' }),
    content: content ?? { type: 'doc', content: [] },
  });

// Walks the document looking for a node type, so assertions read as "is this
// node in the document at all", at any depth.
const hasNodeType = (doc: TiptapDoc, type: string): boolean =>
  doc.type === type || (doc.content?.some(child => hasNodeType(child, type)) ?? false);

const collectMarks = (doc: TiptapDoc, type: string): NonNullable<TiptapDoc['marks']> => {
  const own = doc.marks?.filter(mark => mark.type === type) ?? [];
  const nested = doc.content?.flatMap(child => collectMarks(child, type)) ?? [];
  return [...own, ...nested];
};

describe('note editor schema', () => {
  it('registers the formatting nodes and marks the toolbar exposes', () => {
    const editor = makeEditor();
    const { schema } = editor;

    for (const node of [
      'paragraph',
      'heading',
      'bulletList',
      'orderedList',
      'codeBlock',
      'blockquote',
      'table',
      'taskList',
      'taskItem',
    ]) {
      expect(schema.nodes[node], `${node} should be registered`).toBeDefined();
    }
    for (const mark of ['bold', 'italic', 'strike', 'code', 'link']) {
      expect(schema.marks[mark], `${mark} should be registered`).toBeDefined();
    }

    editor.destroy();
  });

  // Leaving Image unregistered is what enforces the no-inline-images scope: an
  // unregistered node is dropped on parse rather than rendered broken.
  it('does not register an image node', () => {
    const editor = makeEditor();

    expect(editor.schema.nodes.image).toBeUndefined();

    editor.destroy();
  });

  it('drops an image when HTML containing an img is parsed in', () => {
    const editor = makeEditor();

    editor.commands.setContent('<p>before</p><img src="https://example.com/cat.png" alt="cat"><p>after</p>');
    const doc = editor.getJSON() as TiptapDoc;

    expect(hasNodeType(doc, 'image')).toBe(false);
    expect(editor.getText()).toContain('before');
    expect(editor.getText()).toContain('after');

    editor.destroy();
  });

  // JSON parsing is ATOMIC, unlike HTML parsing: ProseMirror rejects the whole
  // document rather than the single bad node, so an image in stored JSON yields
  // an empty doc, not a doc-minus-image. Containment still holds — nothing
  // unexpected renders — but the blast radius is the note, which is why
  // NoteEditor enables enableContentCheck and surfaces it instead of autosaving
  // the blank over the stored document.
  it('rejects the whole document when an image node is present in stored JSON', () => {
    const editor = makeEditor({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'kept' }] },
        { type: 'image', attrs: { src: 'https://example.com/cat.png' } },
      ],
    });

    expect(hasNodeType(editor.getJSON() as TiptapDoc, 'image')).toBe(false);
    expect(editor.getText()).toBe('');

    editor.destroy();
  });

  // AC5: unknown content in stored JSON is contained by the schema, not rendered.
  it('drops an unknown node type from stored JSON without throwing', () => {
    const editor = makeEditor({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'survivor' }] },
        { type: 'someFutureNode', content: [{ type: 'text', text: 'dropped' }] },
      ],
    });

    expect(hasNodeType(editor.getJSON() as TiptapDoc, 'someFutureNode')).toBe(false);

    editor.destroy();
  });

  it('reports a content error rather than silently blanking the note', () => {
    let errored = false;
    const editor = new Editor({
      extensions: createNoteExtensions({ placeholder: 'Write something…' }),
      content: {
        type: 'doc',
        content: [{ type: 'someFutureNode', content: [{ type: 'text', text: 'dropped' }] }],
      },
      enableContentCheck: true,
      onContentError: () => {
        errored = true;
      },
    });

    expect(errored).toBe(true);

    editor.destroy();
  });

  // Unknown ATTRIBUTES on a known node degrade gently — stripped, node kept.
  it('strips unknown attributes but keeps the node', () => {
    const editor = makeEditor({
      type: 'doc',
      content: [{ type: 'paragraph', attrs: { onclick: 'alert(1)' }, content: [{ type: 'text', text: 'hi' }] }],
    });

    const doc = editor.getJSON() as TiptapDoc;

    expect(editor.getText()).toBe('hi');
    expect(JSON.stringify(doc)).not.toContain('onclick');

    editor.destroy();
  });
});

describe('note editor link allowlist', () => {
  it.each(['https://example.com', 'http://example.com', 'mailto:a@b.co'])('accepts %s', url => {
    expect(isAllowedLinkProtocol(url)).toBe(true);
  });

  it.each(['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', '//evil.example.com'])(
    'rejects %s',
    url => {
      expect(isAllowedLinkProtocol(url)).toBe(false);
    }
  );

  it('strips a javascript: link when parsed from HTML', () => {
    const editor = makeEditor();

    editor.commands.setContent('<p><a href="javascript:alert(1)">click me</a></p>');
    const links = collectMarks(editor.getJSON() as TiptapDoc, 'link');

    expect(links).toHaveLength(0);
    expect(editor.getText()).toContain('click me');

    editor.destroy();
  });

  it('strips a data: link when parsed from HTML', () => {
    const editor = makeEditor();

    editor.commands.setContent('<p><a href="data:text/html;base64,PHNjcmlwdD4=">click me</a></p>');

    expect(collectMarks(editor.getJSON() as TiptapDoc, 'link')).toHaveLength(0);

    editor.destroy();
  });

  it('keeps an https link and renders it with the safe rel/target attributes', () => {
    const editor = makeEditor();

    editor.commands.setContent('<p><a href="https://example.com">example</a></p>');
    const links = collectMarks(editor.getJSON() as TiptapDoc, 'link');

    expect(links).toHaveLength(1);
    expect(links[0]?.attrs?.href).toBe('https://example.com');

    const html = editor.getHTML();
    expect(html).toContain('rel="noopener noreferrer nofollow"');
    expect(html).toContain('target="_blank"');

    editor.destroy();
  });

  it('refuses to apply a javascript: link through the setLink command', () => {
    const editor = makeEditor();

    editor.commands.setContent('<p>select me</p>');
    editor.commands.selectAll();
    editor.commands.setLink({ href: 'javascript:alert(1)' });

    expect(collectMarks(editor.getJSON() as TiptapDoc, 'link')).toHaveLength(0);

    editor.destroy();
  });
});

describe('openLinkFromEvent', () => {
  const clickOn = (html: string, init: MouseEventInit = {}) => {
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.append(host);
    const anchor = host.querySelector('a') as HTMLAnchorElement;
    const event = new MouseEvent('click', { bubbles: true, ...init });
    Object.defineProperty(event, 'target', { value: anchor });
    const handled = openLinkFromEvent(event);
    host.remove();
    return handled;
  };

  // A plain click must place the caret instead, or link text can never be edited.
  it('ignores a click without a modifier', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    expect(clickOn('<a href="https://example.com">x</a>')).toBe(false);
    expect(open).not.toHaveBeenCalled();

    open.mockRestore();
  });

  it('opens an allowed link in a new tab on ctrl-click', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    expect(clickOn('<a href="https://example.com">x</a>', { ctrlKey: true })).toBe(true);
    expect(open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');

    open.mockRestore();
  });

  // The href is stored content, so the allowlist is re-checked at the moment of
  // navigation rather than trusted from the DOM.
  it('refuses to navigate to a javascript: href even on ctrl-click', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    expect(clickOn('<a href="javascript:alert(1)">x</a>', { ctrlKey: true })).toBe(false);
    expect(open).not.toHaveBeenCalled();

    open.mockRestore();
  });
});

describe('note editor commands', () => {
  it('toggles inline marks', () => {
    const editor = makeEditor();
    editor.commands.setContent('<p>text</p>');
    editor.commands.selectAll();

    editor.commands.toggleBold();
    expect(editor.isActive('bold')).toBe(true);

    editor.commands.toggleItalic();
    expect(editor.isActive('italic')).toBe(true);

    editor.destroy();
  });

  // Asserted against the document rather than isActive(): selectAll leaves the
  // selection spanning the trailing empty paragraph, so isActive reports false
  // even though the block converted correctly.
  const withSelectedParagraph = (run: (editor: Editor) => void, expectedNode: string) => {
    const editor = makeEditor();
    editor.commands.setContent('<p>text</p>');
    editor.commands.setTextSelection({ from: 1, to: 5 });

    run(editor);

    expect(hasNodeType(editor.getJSON() as TiptapDoc, expectedNode)).toBe(true);
    editor.destroy();
  };

  it('converts a paragraph to a heading', () => {
    withSelectedParagraph(editor => editor.commands.toggleHeading({ level: 2 }), 'heading');
  });

  it('converts a paragraph to a bulleted list', () => {
    withSelectedParagraph(editor => editor.commands.toggleBulletList(), 'bulletList');
  });

  it('converts a paragraph to a numbered list', () => {
    withSelectedParagraph(editor => editor.commands.toggleOrderedList(), 'orderedList');
  });

  it('converts a paragraph to a code block', () => {
    withSelectedParagraph(editor => editor.commands.toggleCodeBlock(), 'codeBlock');
  });

  it('inserts a table', () => {
    const editor = makeEditor();

    editor.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: true });

    expect(hasNodeType(editor.getJSON() as TiptapDoc, 'table')).toBe(true);

    editor.destroy();
  });

  it('enables column resizing on the table extension', () => {
    const editor = makeEditor();

    expect(editor.extensionManager.extensions.find(ext => ext.name === 'table')?.options.resizable).toBe(true);

    editor.destroy();
  });

  // colwidth is how a resized column's width survives a save/reload round trip
  // — it lives on the tableCell/tableHeader attrs and travels inside the stored
  // content JSON, no separate persistence path.
  it('round-trips a resized column width through stored JSON', () => {
    const stored: TiptapDoc = {
      type: 'doc',
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', attrs: { colwidth: [240] }, content: [{ type: 'paragraph' }] },
                { type: 'tableCell', attrs: { colwidth: null }, content: [{ type: 'paragraph' }] },
              ],
            },
          ],
        },
      ],
    };

    const editor = makeEditor(stored);
    const doc = editor.getJSON() as TiptapDoc;
    const cells = doc.content?.[0]?.content?.[0]?.content;

    expect(cells?.[0]?.attrs?.colwidth).toEqual([240]);

    editor.destroy();
  });

  it('converts a paragraph to a checklist', () => {
    withSelectedParagraph(editor => editor.commands.toggleTaskList(), 'taskList');
  });

  it('tracks a task item as checked', () => {
    const editor = makeEditor();
    editor.commands.setContent('<p>buy milk</p>');
    editor.commands.setTextSelection({ from: 1, to: 9 });
    editor.commands.toggleTaskList();

    editor.commands.updateAttributes('taskItem', { checked: true });
    const doc = editor.getJSON() as TiptapDoc;

    const taskItem = doc.content?.[0]?.content?.[0];
    expect(taskItem?.type).toBe('taskItem');
    expect(taskItem?.attrs?.checked).toBe(true);

    editor.destroy();
  });
});

describe('note text-color and highlight marks', () => {
  const withSelectedText = (editor: Editor) => {
    editor.commands.setContent('<p>colored text</p>');
    editor.commands.setTextSelection({ from: 1, to: 13 });
  };

  // AC1: applying a swatch stores the token name, not a computed color — that's
  // what lets the same mark re-resolve to a different hex per theme (AC4) with
  // no re-render logic; the CSS attribute selectors in editor.css do the rest.
  it('applies a text-color token to selected text', () => {
    const editor = makeEditor();
    withSelectedText(editor);

    editor.commands.setNoteTextColor('amber');
    const marks = collectMarks(editor.getJSON() as TiptapDoc, 'noteTextColor');

    expect(marks).toHaveLength(1);
    expect(marks[0]?.attrs?.token).toBe('amber');

    editor.destroy();
  });

  it('applies a highlight token to selected text', () => {
    const editor = makeEditor();
    withSelectedText(editor);

    editor.commands.setNoteHighlight('teal');
    const marks = collectMarks(editor.getJSON() as TiptapDoc, 'noteHighlight');

    expect(marks).toHaveLength(1);
    expect(marks[0]?.attrs?.token).toBe('teal');

    editor.destroy();
  });

  // AC2: the two marks are independent — applying one never displaces the other.
  it('coexists with an existing text-color mark when a highlight is applied', () => {
    const editor = makeEditor();
    withSelectedText(editor);

    editor.commands.setNoteTextColor('blue');
    editor.commands.setNoteHighlight('green');
    const doc = editor.getJSON() as TiptapDoc;

    expect(collectMarks(doc, 'noteTextColor')[0]?.attrs?.token).toBe('blue');
    expect(collectMarks(doc, 'noteHighlight')[0]?.attrs?.token).toBe('green');

    editor.destroy();
  });

  it('clears a text-color mark via unsetNoteTextColor', () => {
    const editor = makeEditor();
    withSelectedText(editor);
    editor.commands.setNoteTextColor('red');

    editor.commands.unsetNoteTextColor();

    expect(collectMarks(editor.getJSON() as TiptapDoc, 'noteTextColor')).toHaveLength(0);

    editor.destroy();
  });

  // The allowlist is enforced at the parse boundary (parseHTML), same posture
  // as the link mark's protocol allowlist — an out-of-palette token can never
  // reach the DOM as a raw attribute value.
  it('drops an out-of-palette token when parsed from stored HTML', () => {
    const editor = makeEditor();

    editor.commands.setContent('<p><span data-note-text-color data-token="magenta">x</span></p>');
    const marks = collectMarks(editor.getJSON() as TiptapDoc, 'noteTextColor');

    expect(marks[0]?.attrs?.token ?? null).toBeNull();

    editor.destroy();
  });

  it('round-trips a text-color token through stored JSON', () => {
    const stored: TiptapDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'hi', marks: [{ type: 'noteTextColor', attrs: { token: 'purple' } }] }],
        },
      ],
    };

    const editor = makeEditor(stored);
    const marks = collectMarks(editor.getJSON() as TiptapDoc, 'noteTextColor');

    expect(marks[0]?.attrs?.token).toBe('purple');

    editor.destroy();
  });
});

describe('note callout and divider blocks', () => {
  // AC1: a default-icon/color callout renders and accepts rich-text content.
  it('inserts a callout with the default icon and color', () => {
    const editor = makeEditor();

    editor.commands.setNoteCallout();
    const doc = editor.getJSON() as TiptapDoc;

    expect(hasNodeType(doc, 'noteCallout')).toBe(true);
    const callout = doc.content?.find(node => node.type === 'noteCallout');
    expect(callout?.attrs?.icon).toBe('info');
    expect(callout?.attrs?.colorToken).toBe('blue');
    // Rich-text content: it's a paragraph the caret can type into, not opaque text.
    expect(callout?.content?.[0]?.type).toBe('paragraph');

    editor.destroy();
  });

  it('inserts a callout with a chosen icon and color', () => {
    const editor = makeEditor();

    editor.commands.setNoteCallout({ icon: 'warning', colorToken: 'amber' });
    const doc = editor.getJSON() as TiptapDoc;
    const callout = doc.content?.find(node => node.type === 'noteCallout');

    expect(callout?.attrs?.icon).toBe('warning');
    expect(callout?.attrs?.colorToken).toBe('amber');

    editor.destroy();
  });

  // AC2: changing icon/color after insertion, then round-tripping through
  // stored JSON (the save/reload path), keeps the change.
  it('round-trips an updated callout icon and color through stored JSON', () => {
    const editor = makeEditor();
    editor.commands.setNoteCallout();

    editor.commands.updateNoteCalloutAttrs({ icon: 'star', colorToken: 'green' });
    const updated = editor.getJSON() as TiptapDoc;

    const reloaded = makeEditor(updated);
    const callout = (reloaded.getJSON() as TiptapDoc).content?.find(node => node.type === 'noteCallout');

    expect(callout?.attrs?.icon).toBe('star');
    expect(callout?.attrs?.colorToken).toBe('green');

    editor.destroy();
    reloaded.destroy();
  });

  // Same allowlist-at-the-parse-boundary posture as the color marks: a
  // garbage icon or color token in stored HTML can't reach the DOM.
  it('falls back to the default icon and color for an out-of-palette value parsed from stored HTML', () => {
    const editor = makeEditor();

    editor.commands.setContent('<div data-note-callout data-icon="skull" data-token="magenta"><p>text</p></div>');
    const doc = editor.getJSON() as TiptapDoc;
    const callout = doc.content?.find(node => node.type === 'noteCallout');

    expect(callout?.attrs?.icon).toBe('info');
    expect(callout?.attrs?.colorToken).toBe('blue');

    editor.destroy();
  });

  // AC3: a divider renders as a horizontal rule and survives a reload.
  it('inserts a divider between blocks', () => {
    const editor = makeEditor();
    editor.commands.setContent('<p>before</p>');

    editor.commands.setHorizontalRule();
    editor.commands.insertContent('<p>after</p>');
    const doc = editor.getJSON() as TiptapDoc;

    expect(hasNodeType(doc, 'horizontalRule')).toBe(true);

    editor.destroy();
  });

  it('round-trips a divider through stored JSON', () => {
    const stored: TiptapDoc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'before' }] },
        { type: 'horizontalRule' },
        { type: 'paragraph', content: [{ type: 'text', text: 'after' }] },
      ],
    };

    const editor = makeEditor(stored);

    expect(hasNodeType(editor.getJSON() as TiptapDoc, 'horizontalRule')).toBe(true);

    editor.destroy();
  });
});
