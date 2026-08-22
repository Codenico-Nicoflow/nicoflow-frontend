import { useState } from 'react';

import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import {
  Bold,
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Table,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ColorPicker } from './ColorPicker';
import { isNoteColorToken } from './colorTokens';
import { LinkDialog } from './LinkDialog';
import { TableControls } from './TableControls';
import { ToolbarButton } from './ToolbarButton';

export interface NoteToolbarProps {
  editor: Editor | null;
}

export const NoteToolbar = ({ editor }: NoteToolbarProps) => {
  const { t } = useTranslation('notes');
  const [isLinkOpen, setLinkOpen] = useState(false);
  const [isTableMenuOpen, setTableMenuOpen] = useState(false);

  // Tiptap v3 does NOT re-render this component on every transaction, so
  // reading editor.isActive() during render yields whatever was true at the
  // last unrelated re-render — the pressed states and the table group would
  // both go stale as the caret moves. useEditorState subscribes properly and
  // re-renders only when one of these values actually flips.
  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) =>
      instance
        ? {
            isBold: instance.isActive('bold'),
            isItalic: instance.isActive('italic'),
            isHeading1: instance.isActive('heading', { level: 1 }),
            isHeading2: instance.isActive('heading', { level: 2 }),
            isHeading3: instance.isActive('heading', { level: 3 }),
            isBulletList: instance.isActive('bulletList'),
            isOrderedList: instance.isActive('orderedList'),
            isTaskList: instance.isActive('taskList'),
            isCodeBlock: instance.isActive('codeBlock'),
            isTable: instance.isActive('table'),
            isLink: instance.isActive('link'),
            textColorToken: instance.getAttributes('noteTextColor').token as unknown,
            highlightToken: instance.getAttributes('noteHighlight').token as unknown,
          }
        : null,
  });

  if (!editor || !state) return null;

  return (
    <div
      role="toolbar"
      aria-label={t('toolbar.label')}
      className="border-input flex flex-wrap items-center gap-1 border-b p-1"
    >
      <ToolbarButton
        label={t('toolbar.bold')}
        icon={Bold}
        isActive={state.isBold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label={t('toolbar.italic')}
        icon={Italic}
        isActive={state.isItalic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label={t('toolbar.heading1')}
        icon={Heading1}
        isActive={state.isHeading1}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        label={t('toolbar.heading2')}
        icon={Heading2}
        isActive={state.isHeading2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label={t('toolbar.heading3')}
        icon={Heading3}
        isActive={state.isHeading3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <ToolbarButton
        label={t('toolbar.bulletList')}
        icon={List}
        isActive={state.isBulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label={t('toolbar.orderedList')}
        icon={ListOrdered}
        isActive={state.isOrderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label={t('toolbar.taskList')}
        icon={CheckSquare}
        isActive={state.isTaskList}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      />
      <ToolbarButton
        label={t('toolbar.codeBlock')}
        icon={Code}
        isActive={state.isCodeBlock}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />
      <ToolbarButton
        label={t('toolbar.table')}
        icon={Table}
        isActive={state.isTable}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      />
      <ToolbarButton label={t('toolbar.link')} icon={Link2} isActive={state.isLink} onClick={() => setLinkOpen(true)} />
      <ToolbarButton
        label={t('toolbar.unlink')}
        icon={Link2Off}
        disabled={!state.isLink}
        onClick={() => editor.chain().focus().unsetLink().run()}
      />

      <ColorPicker
        editor={editor}
        variant="text"
        activeToken={isNoteColorToken(state.textColorToken) ? state.textColorToken : null}
      />
      <ColorPicker
        editor={editor}
        variant="highlight"
        activeToken={isNoteColorToken(state.highlightToken) ? state.highlightToken : null}
      />

      {(state.isTable || isTableMenuOpen) && (
        // `isTableMenuOpen` keeps the group mounted while its menu is open:
        // opening the menu moves focus out of the editor, and unmounting the
        // trigger at that moment would close the menu the user just opened.
        <TableControls editor={editor} open={isTableMenuOpen} onOpenChange={setTableMenuOpen} />
      )}

      <LinkDialog editor={editor} open={isLinkOpen} onOpenChange={setLinkOpen} />
    </div>
  );
};
