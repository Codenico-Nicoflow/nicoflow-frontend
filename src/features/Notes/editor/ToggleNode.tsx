import { mergeAttributes, Node } from '@tiptap/core';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

// Three-node group: the container carries the persisted `open` boolean (AC2 —
// collapsed/expanded is stored state, not local React state, so it survives a
// reload), the summary is the always-visible header, and the content is the
// collapsible body. Modeled on the callout's Node.create + NodeView shape
// (CalloutNode.tsx, NIC-1969) rather than the native HTML <details> element,
// since ProseMirror needs its own schema nodes to allow nested block content
// inside the collapsible body.
//
// The collapse itself is CSS, not conditional React unmounting: NodeViewContent
// renders both child nodes unconditionally (ProseMirror owns that DOM and
// expects it present), and editor.css hides noteToggleContent's rendered
// element when the container's data-open is "false". That keeps the document
// structurally intact — and still editable/selectable by ProseMirror — while
// visually collapsed.
const parseOpen = (value: string | null): boolean => value !== 'false';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteToggle: {
      setNoteToggle: () => ReturnType;
    };
  }
}

const ToggleView = ({ node, updateAttributes }: NodeViewProps) => {
  const open = Boolean(node.attrs.open);

  return (
    <NodeViewWrapper data-note-toggle="" data-open={open} data-testid="note-toggle" className="my-2">
      <button
        type="button"
        contentEditable={false}
        // Pending i18n (notes.json has no "toggle" key yet) — see NIC-1970 PR
        // notes on avoiding another cross-repo publish round-trip for one label.
        aria-label="Toggle"
        aria-expanded={open}
        data-testid="note-toggle-trigger"
        className="float-start -ms-5 mt-0.5"
        onClick={() => updateAttributes({ open: !open })}
      >
        <ChevronRight className={cn('h-4 w-4 transition-transform', open && 'rotate-90')} aria-hidden="true" />
      </button>
      <NodeViewContent />
    </NodeViewWrapper>
  );
};

// The summary holds only inline content (the header text, with rich marks like
// bold/links) — it never nests block content, so it needs no NodeView of its
// own, just a plain renderHTML/parseHTML pair.
const NoteToggleSummary = Node.create({
  name: 'noteToggleSummary',
  content: 'inline*',
  marks: '_',

  parseHTML() {
    return [{ tag: 'div[data-note-toggle-summary]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-note-toggle-summary': '', class: 'font-medium' }), 0];
  },
});

const NoteToggleContent = Node.create({
  name: 'noteToggleContent',
  content: 'block+',

  parseHTML() {
    return [{ tag: 'div[data-note-toggle-content]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-note-toggle-content': '' }), 0];
  },
});

const NoteToggle = Node.create({
  name: 'noteToggle',
  group: 'block',
  content: 'noteToggleSummary noteToggleContent',
  defining: true,

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: element => parseOpen(element.getAttribute('data-open')),
        renderHTML: attributes => ({ 'data-open': String(Boolean(attributes.open)) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-note-toggle]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-note-toggle': '' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleView);
  },

  addCommands() {
    return {
      setNoteToggle:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { open: true },
            content: [
              { type: 'noteToggleSummary', content: [] },
              { type: 'noteToggleContent', content: [{ type: 'paragraph' }] },
            ],
          }),
    };
  },
});

export const NOTE_TOGGLE_NODES = [NoteToggle, NoteToggleSummary, NoteToggleContent];
