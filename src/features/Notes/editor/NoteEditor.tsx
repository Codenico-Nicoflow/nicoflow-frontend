import { useId } from 'react';

import { EditorContent, useEditor } from '@tiptap/react';
import { useTranslation } from 'react-i18next';

import type { TiptapDoc } from '@/lib/types';
import { withEditableBody } from '@/lib/types';

import { createNoteExtensions, openLinkFromEvent } from './extensions';
import { NoteToolbar } from './NoteToolbar';

import './editor.css';

export interface NoteEditorProps {
  content: TiptapDoc;
  onChange?: (doc: TiptapDoc) => void;
  editable?: boolean;
  /** Fires when stored JSON can't be parsed, so the page can stop autosaving over it. */
  onContentError?: () => void;
}

// The editor surface. Content flows in as TiptapDoc JSON and out as TiptapDoc
// JSON — there is no HTML round-trip and no dangerouslySetInnerHTML anywhere in
// this path. Rendering goes through the schema (see extensions.ts), which is
// what contains anything unexpected in a stored document.
export const NoteEditor = ({ content, onChange, editable = true, onContentError }: NoteEditorProps) => {
  const { t } = useTranslation('notes');
  const labelId = useId();

  const editor = useEditor(
    {
      extensions: createNoteExtensions({ placeholder: t('editor.placeholder') }),
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
          class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[12rem] px-4 py-3',
          role: 'textbox',
          'aria-multiline': 'true',
          'aria-labelledby': labelId,
        },
        // Returning true tells ProseMirror the click was handled, so the caret
        // doesn't also move into the link we just opened.
        handleDOMEvents: { click: (_view, event) => openLinkFromEvent(event) },
      },
    },
    [editable]
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
