import type { Editor } from '@tiptap/react';
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  ChevronDown,
  Combine,
  Heading,
  Table as TableIcon,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface TableControlsProps {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Table editing lives behind one labeled trigger rather than nine icon-only
// buttons in the main row. Add-column-before / add-column-after / delete-column
// are three near-identical glyphs, and no icon distinguishes them at 16px — the
// operations need words. The menu also keeps the toolbar from reflowing to a
// second line the moment the caret enters a table.
export const TableControls = ({ editor, open, onOpenChange }: TableControlsProps) => {
  const { t } = useTranslation('notes');

  const items = [
    {
      label: t('toolbar.addColumnBefore'),
      icon: ArrowLeftToLine,
      run: () => editor.chain().focus().addColumnBefore().run(),
    },
    {
      label: t('toolbar.addColumnAfter'),
      icon: ArrowRightToLine,
      run: () => editor.chain().focus().addColumnAfter().run(),
    },
    { label: t('toolbar.addRowBefore'), icon: ArrowUpToLine, run: () => editor.chain().focus().addRowBefore().run() },
    { label: t('toolbar.addRowAfter'), icon: ArrowDownToLine, run: () => editor.chain().focus().addRowAfter().run() },
  ];

  const structure = [
    { label: t('toolbar.toggleHeaderRow'), icon: Heading, run: () => editor.chain().focus().toggleHeaderRow().run() },
    { label: t('toolbar.mergeOrSplit'), icon: Combine, run: () => editor.chain().focus().mergeOrSplit().run() },
  ];

  const destructive = [
    { label: t('toolbar.deleteColumn'), run: () => editor.chain().focus().deleteColumn().run() },
    { label: t('toolbar.deleteRow'), run: () => editor.chain().focus().deleteRow().run() },
    { label: t('toolbar.deleteTable'), run: () => editor.chain().focus().deleteTable().run() },
  ];

  return (
    <>
      <span role="separator" aria-orientation="vertical" className="bg-border mx-1 h-5 w-px" />

      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          {/* Tinted rather than plain ghost — this trigger only exists while
              the caret is inside a table, so it needs to read as "options for
              THIS element" at a glance, not just another toolbar button. */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 border border-primary/30 bg-primary/10 px-2 text-primary hover:bg-primary/20 hover:text-primary dark:border-primary/40 dark:bg-primary/15 dark:text-primary"
            data-testid="note-table-menu"
          >
            <TableIcon className="h-4 w-4" aria-hidden="true" />
            {t('toolbar.tableGroup')}
            <ChevronDown className="h-3 w-3 opacity-70" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>{t('toolbar.tableInsert')}</DropdownMenuLabel>
          {items.map(({ label, icon: Icon, run }) => (
            <DropdownMenuItem key={label} onSelect={run}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          {structure.map(({ label, icon: Icon, run }) => (
            <DropdownMenuItem key={label} onSelect={run}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          {destructive.map(({ label, run }) => (
            <DropdownMenuItem key={label} variant="destructive" onSelect={run}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
