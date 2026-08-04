import { describe, expect, it } from 'vitest';

import { EMPTY_TIPTAP_DOC, withEditableBody } from './tiptap';

describe('withEditableBody', () => {
  // The bug this exists for: the server stores exactly EMPTY_TIPTAP_DOC for a
  // new note, and a doc with no children renders as a literally empty
  // ProseMirror — nowhere to put the caret, and no node for the placeholder
  // decoration to attach to. Every new note opened as a dead surface.
  it('seeds a paragraph into the empty document the server stores', () => {
    expect(withEditableBody(EMPTY_TIPTAP_DOC)).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph' }],
    });
  });

  it('seeds a paragraph when content is absent entirely', () => {
    expect(withEditableBody({ type: 'doc' })).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph' }],
    });
  });

  it('leaves a document that already has content untouched', () => {
    const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'kept' }] }] };

    expect(withEditableBody(doc)).toEqual(doc);
  });

  it('does not mutate the document it is given', () => {
    const doc = { ...EMPTY_TIPTAP_DOC };

    withEditableBody(doc);

    expect(doc.content).toEqual([]);
  });
});
