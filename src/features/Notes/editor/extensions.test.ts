import { Editor } from '@tiptap/core';
import { describe, expect, it, vi } from 'vitest';

import type { TiptapDoc } from '@/lib/types';

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

    for (const node of ['paragraph', 'heading', 'bulletList', 'orderedList', 'codeBlock', 'blockquote', 'table']) {
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
});
