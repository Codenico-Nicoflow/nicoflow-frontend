import { withEditableBody } from '@nicoflow/shared/types';

import { NoteEditor } from '@/features/Notes/editor';

import { blocksToDoc } from './blocksToDoc';

interface CreateNoteBodyProps {
  input: unknown;
}

export const CreateNoteBody = ({ input }: CreateNoteBodyProps) => {
  if (!input || typeof input !== 'object') return null;
  const blocks = (input as Record<string, unknown>).blocks;
  const doc = blocksToDoc(blocks);
  if (!doc) return null;

  return (
    <div
      className="max-h-48 overflow-y-auto rounded-md border border-border bg-muted/40 text-sm"
      aria-label="Note preview"
    >
      <NoteEditor content={withEditableBody(doc)} editable={false} />
    </div>
  );
};
