import { useId } from 'react';

import type { TiptapDoc } from '@nicoflow/shared/types';
import { withEditableBody } from '@nicoflow/shared/types';
import { EditorContent, useEditor } from '@tiptap/react';
import { useTranslation } from 'react-i18next';

import { createNoteExtensions, openLinkFromEvent } from './extensions';
import { NoteToolbar } from './NoteToolbar';

import './editor.css';

export interface NoteEditorProps {
  content: TiptapDoc;
  onChange?: (doc: TiptapDoc) => void;
  editable?: boolean;
  /** Fires when stored JSON can't be parsed, so the page can stop autosaving over it. */
  onContentError?: () => void;
  /** The currently-open note's id, so @-mention typeahead excludes it from its own results (NIC-1972 AC4). */
  noteId?: string;
}

// The editor surface. Content flows in as TiptapDoc JSON and out as TiptapDoc
// JSON — there is no HTML round-trip and no dangerouslySetInnerHTML anywhere in
// this path. Rendering goes through the schema (see extensions.ts), which is
// what contains anything unexpected in a stored document.
export const NoteEditor = ({ content, onChange, editable = true, onContentError, noteId }: NoteEditorProps) => {
  const { t } = useTranslation('notes');
  const labelId = useId();

  const editor = useEditor(
    {
      extensions: createNoteExtensions({ placeholder: t('editor.placeholder'), excludeNoteId: noteId }),
      content: withEditableBody(content),
      editable,
      // ProseMirror rejects a document ATOMICALLY: one unrecognized node or mark
      // throws and the whole note comes back empty, not just the bad node. Left
      // silent that reads as "the note lost its contents", and autosave would
      // then persist the blank over the real document. enableContentCheck turns
      // it into an event the page can surface and halt on instead.
      enableContentCheck: true,
      onContentError: () => onContentError?.(),
      onUpdate: ({ editor: instance }) => onChange?.(instance.getJSON() as TiptapDoc),
      editorProps: {
        attributes: {
          class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[60vh] px-4 py-3',
          role: 'textbox',
          'aria-multiline': 'true',
          'aria-labelledby': labelId,
        },
        // Returning true tells ProseMirror the click was handled, so the caret
        // doesn't also move into the link we just opened.
        handleDOMEvents: { click: (_view, event) => openLinkFromEvent(event) },
      },
    },
    // `content` is read only at construction by Tiptap's useEditor — it is
    // NOT reactive. Without noteId here, navigating from one note to another
    // (e.g. clicking a @-mention chip) reuses the same editor instance and
    // keeps rendering the PREVIOUS note's document, since only `editable`
    // ever changed. Including noteId forces a fresh editor (fresh content,
    // fresh excludeNoteId) whenever the note being viewed changes.
    [editable, noteId]
  );

  return (
    <div className="border-input focus-within:ring-ring rounded-md border focus-within:ring-2 focus-within:ring-offset-2">
      <span id={labelId} className="sr-only">
        {t('editor.label')}
      </span>
      {editable && <NoteToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
};
