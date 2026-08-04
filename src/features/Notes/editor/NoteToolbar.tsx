import type { Editor } from '@tiptap/react';
import { Bold, Code, Heading2, Heading3, Italic, Link2, Link2Off, List, ListOrdered, Table } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { isAllowedLinkProtocol } from './extensions';

export interface NoteToolbarProps {
  editor: Editor | null;
}

// Icon-only buttons, so every one carries an aria-label and a title. `isActive`
// drives aria-pressed rather than colour alone — a toggle whose only state cue
// is a background tint doesn't reach a screen reader.
export const NoteToolbar = ({ editor }: NoteToolbarProps) => {
  const { t } = useTranslation('notes');

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const input = window.prompt(t('toolbar.linkPrompt'), previous ?? 'https://');

    if (input === null) return;
    if (input === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // The schema's isAllowedUri would reject this anyway — checking here too is
    // what turns a silent no-op into an explanation the user can act on.
    if (!isAllowedLinkProtocol(input)) {
      toast.error(t('toolbar.linkInvalid'));
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: input }).run();
  };

  return (
    <div
      role="toolbar"
      aria-label={t('toolbar.label')}
      className="border-input flex flex-wrap items-center gap-1 border-b p-1"
    >
      <ToolbarButton
        label={t('toolbar.bold')}
        icon={Bold}
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label={t('toolbar.italic')}
        icon={Italic}
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label={t('toolbar.heading2')}
        icon={Heading2}
        isActive={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label={t('toolbar.heading3')}
        icon={Heading3}
        isActive={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <ToolbarButton
        label={t('toolbar.bulletList')}
        icon={List}
        isActive={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label={t('toolbar.orderedList')}
        icon={ListOrdered}
        isActive={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label={t('toolbar.codeBlock')}
        icon={Code}
        isActive={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />
      <ToolbarButton
        label={t('toolbar.table')}
        icon={Table}
        isActive={editor.isActive('table')}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      />
      <ToolbarButton label={t('toolbar.link')} icon={Link2} isActive={editor.isActive('link')} onClick={setLink} />
      <ToolbarButton
        label={t('toolbar.unlink')}
        icon={Link2Off}
        isActive={false}
        disabled={!editor.isActive('link')}
        onClick={() => editor.chain().focus().unsetLink().run()}
      />
    </div>
  );
};

interface ToolbarButtonProps {
  label: string;
  icon: typeof Bold;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ToolbarButton = ({ label, icon: Icon, isActive, onClick, disabled }: ToolbarButtonProps) => (
  <Button
    type="button"
    variant="ghost"
    size="icon"
    aria-label={label}
    title={label}
    aria-pressed={isActive}
    disabled={disabled}
    onClick={onClick}
    className={cn('h-8 w-8', isActive && 'bg-accent text-accent-foreground')}
  >
    <Icon className="h-4 w-4" aria-hidden="true" />
  </Button>
);
