import { useEffect, useState } from 'react';

import type { TiptapDoc } from '@nicoflow/shared/types';
import { ArrowLeft, FileX, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ConfirmDialog, EmptyState } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AttachmentSection } from '@/features/Tasks/components/AttachmentSection/AttachmentSection';
import { clearOpenNote, setOpenNote } from '@/lib/realtime/openNoteRegistry';
import { useDeleteNoteMutation, useGetNoteQuery } from '@/lib/store';

import { ConflictNotice, SaveStatus, SaveStatusIndicator, useNoteAutosave } from '../autosave';
import { NoteEditor } from '../editor';

import { NoteEditorSkeleton } from './NoteEditorSkeleton';

// The page that assembles the feature: scalar fetch → title + Tiptap body →
// autosave status → attachments → delete.
export const NoteEditorPage = () => {
  const { t } = useTranslation('notes');
  const { noteId = '' } = useParams();
  const navigate = useNavigate();

  // The body comes from the scalar and nowhere else — the list shape carries no
  // content at all. Nothing renders until it resolves (no placeholder-then-swap).
  const { data: note, isLoading, isError } = useGetNoteQuery(noteId, { skip: !noteId });
  const [deleteNote, { isLoading: isDeleting }] = useDeleteNoteMutation();

  const [title, setTitle] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [contentError, setContentError] = useState(false);

  const { status, save, flush, isConflicted } = useNoteAutosave({
    noteId,
    initialVersion: note?.version ?? 0,
  });

  // Seed the title field once the scalar lands. Keyed on the note id, not the
  // whole object, so a refetch that returns a newer title doesn't yank the field
  // out from under someone mid-edit.
  const loadedTitle = note?.title;
  const loadedId = note?.id;
  useEffect(() => {
    if (loadedId !== undefined) setTitle(loadedTitle ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedId]);

  // Tell the socket this note is open and whether it's dirty, so an incoming
  // note.updated for it doesn't refetch the scalar over unsaved edits. Anything
  // not yet persisted counts as dirty — including a save in flight, whose
  // response would otherwise race the refetch.
  const isDirty = status === SaveStatus.UNSAVED || status === SaveStatus.SAVING || status === SaveStatus.ERROR;
  useEffect(() => {
    if (!noteId) return;
    setOpenNote(noteId, isDirty);
    return () => clearOpenNote(noteId);
  }, [noteId, isDirty]);

  if (isLoading) return <NoteEditorSkeleton />;

  if (isError || !note) {
    return (
      <EmptyState
        icon={FileX}
        title={t('page.notFoundTitle')}
        description={t('page.notFoundDescription')}
        action={
          <Button variant="outline" onClick={() => navigate('/areas')}>
            {t('page.back')}
          </Button>
        }
        data-testid="note-not-found"
      />
    );
  }

  const backTo = note.projectId ? `/projects/${note.projectId}` : '/areas';

  const handleDelete = async () => {
    try {
      await deleteNote(note.id).unwrap();
      setDeleteOpen(false);
      navigate(backTo);
    } catch {
      setDeleteOpen(false);
      toast.error(t('page.deleteError'));
    }
  };

  const handleBack = () => {
    // Send the pending edit before leaving rather than losing the last
    // keystrokes to the debounce window.
    flush();
    navigate(backTo);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 sm:p-6" data-testid="note-editor-page">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={handleBack} data-testid="note-back">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('page.back')}
        </Button>

        <div className="flex items-center gap-2">
          <SaveStatusIndicator status={status} />
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('page.delete')}
            title={t('page.delete')}
            onClick={() => setDeleteOpen(true)}
            data-testid="note-delete"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {isConflicted && <ConflictNotice onReload={() => window.location.reload()} />}

      <Input
        value={title}
        aria-label={t('page.titleLabel')}
        placeholder={t('page.titlePlaceholder')}
        maxLength={255}
        disabled={isConflicted || contentError}
        onChange={event => {
          const next = event.target.value;
          setTitle(next);
          // The server rejects a blank title (422), so an emptied field is kept
          // local until the user types something savable.
          if (next.trim() !== '') save({ title: next });
        }}
        className="h-auto border-0 px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
        data-testid="note-title"
      />

      <NoteEditor
        content={note.content}
        editable={!isConflicted && !contentError}
        onChange={(content: TiptapDoc) => save({ content })}
        onContentError={() => setContentError(true)}
        noteId={note.id}
      />

      {contentError && (
        <p role="alert" className="text-destructive text-sm" data-testid="note-content-error">
          {t('editor.contentError')}
        </p>
      )}

      {/* Owner-parameterised — the same panel the task dialog uses, with
          ownerType "note". Writes stay Pro-gated; reads and deletes are open. */}
      <AttachmentSection ownerType="note" ownerId={note.id} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('page.deleteConfirmTitle')}
        description={t('page.deleteConfirmBody')}
        confirmLabel={t('page.deleteConfirmAction')}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        destructive
        variant="danger"
        data-testid="note-delete-confirm"
      />
    </div>
  );
};
