import type { TiptapDoc } from '@nicoflow/shared/types';

// Wire shapes that mirror the Go NoteBlock / noteBlockWire structs.
// Field names are the JSON keys the backend actually sends.

interface NoteTaskItem {
  text: string;
  checked?: boolean;
}

type NoteBlockKind =
  | 'paragraph'
  | 'heading'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'blockquote'
  | 'codeBlock'
  | 'callout'
  | 'table';

interface NoteBlock {
  kind: NoteBlockKind;
  text?: string;
  level?: number;
  items?: string[];
  tasks?: NoteTaskItem[];
  code?: string;
  language?: string;
  variant?: 'info' | 'warn' | 'success' | 'danger';
  header?: string[];
  rows?: string[][];
}

// Callout attrs mirror the real Tiptap CalloutNode schema.
const calloutIconByVariant: Record<string, string> = {
  info: 'info',
  warn: 'warning',
  success: 'success',
  danger: 'flag',
};
const calloutColorByVariant: Record<string, string> = {
  info: 'blue',
  warn: 'yellow',
  success: 'green',
  danger: 'red',
};

// ── node builders (mirrors Go blockToNode) ──────────────────────────────────

type PmNode = Record<string, unknown>;

function textNode(text: string): PmNode {
  return { type: 'text', text };
}

function paragraphNode(text: string): PmNode {
  const p: PmNode = { type: 'paragraph' };
  if (text) p.content = [textNode(text)];
  return p;
}

function listNode(kind: string, items: PmNode[]): PmNode {
  return { type: kind, content: items };
}

function plainListItems(items: string[]): PmNode[] {
  return items.map(s => ({ type: 'listItem', content: [paragraphNode(s)] }));
}

function taskListItems(tasks: NoteTaskItem[]): PmNode[] {
  return tasks.map(t => ({
    type: 'taskItem',
    attrs: { checked: t.checked ?? false },
    content: [paragraphNode(t.text)],
  }));
}

function tableRowNode(cells: string[], cellType: string): PmNode {
  return {
    type: 'tableRow',
    content: cells.map(c => ({ type: cellType, content: [paragraphNode(c)] })),
  };
}

function tableNode(header: string[] | undefined, rows: string[][]): PmNode {
  const trs: PmNode[] = [];
  if (header && header.length > 0) trs.push(tableRowNode(header, 'tableHeader'));
  for (const row of rows) trs.push(tableRowNode(row, 'tableCell'));
  return { type: 'table', content: trs };
}

function blockToNode(b: NoteBlock): PmNode | null {
  switch (b.kind) {
    case 'paragraph':
      return paragraphNode(b.text ?? '');
    case 'heading':
      return {
        type: 'heading',
        attrs: { level: b.level ?? 1 },
        content: [textNode(b.text ?? '')],
      };
    case 'bulletList':
      return listNode('bulletList', plainListItems(b.items ?? []));
    case 'orderedList':
      return listNode('orderedList', plainListItems(b.items ?? []));
    case 'taskList':
      return listNode('taskList', taskListItems(b.tasks ?? []));
    case 'blockquote':
      return { type: 'blockquote', content: [paragraphNode(b.text ?? '')] };
    case 'codeBlock': {
      const attrs: PmNode = {};
      if (b.language) attrs.language = b.language;
      return { type: 'codeBlock', attrs, content: [textNode(b.code ?? '')] };
    }
    case 'callout': {
      const variant = b.variant ?? 'info';
      return {
        type: 'callout',
        attrs: {
          icon: calloutIconByVariant[variant] ?? 'info',
          colorToken: calloutColorByVariant[variant] ?? 'blue',
        },
        content: [paragraphNode(b.text ?? '')],
      };
    }
    case 'table':
      return tableNode(b.header, b.rows ?? []);
    default:
      return null;
  }
}

// Checks whether a value looks like a NoteBlock (has a known `kind` string).
const KNOWN_KINDS = new Set<string>([
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'taskList',
  'blockquote',
  'codeBlock',
  'callout',
  'table',
]);

function isNoteBlock(v: unknown): v is NoteBlock {
  return !!v && typeof v === 'object' && KNOWN_KINDS.has((v as Record<string, unknown>).kind as string);
}

/**
 * Convert the `blocks` array from a `create_note` / `process_bucket_item`
 * tool-call input into a Tiptap ProseMirror doc, ready for read-only preview.
 * Returns null when the input isn't a valid blocks array.
 */
export function blocksToDoc(blocks: unknown): TiptapDoc | null {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  const content: PmNode[] = [];
  for (const b of blocks) {
    if (!isNoteBlock(b)) return null;
    const node = blockToNode(b);
    if (node) content.push(node);
  }
  if (content.length === 0) return null;
  return { type: 'doc', content } as unknown as TiptapDoc;
}
