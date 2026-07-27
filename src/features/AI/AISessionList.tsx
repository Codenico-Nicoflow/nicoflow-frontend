import { useState } from 'react';

import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useDeleteAISessionMutation, useGetAISessionsQuery } from '@/lib/store';
import { cn } from '@/lib/utils';

interface AISessionListProps {
  activeId?: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  isCreating?: boolean;
}

// The 280px conversation rail: lists sessions (updatedAt DESC from the backend),
// a "new chat" action, and per-row delete. Active row is highlighted from the
// route param. Reused verbatim inside the mobile drawer.
export const AISessionList = ({ activeId, onSelect, onCreate, isCreating = false }: AISessionListProps) => {
  const { t } = useTranslation('ai');
  const { data: sessions, isLoading } = useGetAISessionsQuery();
  const [deleteSession, { isLoading: isDeleting }] = useDeleteAISessionMutation();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await deleteSession(pendingDelete).unwrap();
    setPendingDelete(null);
  };

  return (
    <div className="flex h-full flex-col" data-testid="ai-session-list">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <h2 className="text-sm font-semibold text-foreground">{t('sessions.heading')}</h2>
        <Button size="sm" onClick={onCreate} disabled={isCreating} data-testid="ai-new-session">
          <MessageSquarePlus className="h-4 w-4" />
          {t('sessions.new')}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2" data-testid="ai-session-list-loading">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <EmptyState
            icon={MessageSquarePlus}
            title={t('sessions.emptyTitle')}
            description={t('sessions.emptyDescription')}
          />
        ) : (
          <ul className="space-y-1">
            {sessions.map(session => (
              <li key={session.id}>
                <div
                  className={cn(
                    'group flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                    session.id === activeId ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(session.id)}
                    className="min-w-0 flex-1 truncate text-start"
                    data-testid={`ai-session-${session.id}`}
                  >
                    {session.title}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => setPendingDelete(session.id)}
                    aria-label={t('sessions.delete')}
                    data-testid={`ai-session-delete-${session.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={open => !open && setPendingDelete(null)}
        title={t('sessions.delete')}
        description={t('sessions.deleteConfirm')}
        icon={Trash2}
        destructive
        isLoading={isDeleting}
        onConfirm={handleDelete}
        data-testid="ai-session-delete-confirm"
      />
    </div>
  );
};
