import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type EditScope = 'occurrence' | 'series';

export interface EditScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (scope: EditScope) => void;
  isLoading: boolean;
}

export const EditScopeDialog = ({ open, onOpenChange, onChoose, isLoading }: EditScopeDialogProps) => {
  const { t } = useTranslation('recurrence');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="edit-scope-dialog">
        <DialogHeader>
          <DialogTitle>{t('editScope.title')}</DialogTitle>
          <DialogDescription>{t('editScope.description')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onChoose('occurrence')}
            data-testid="edit-scope-occurrence"
            className="flex flex-col items-start gap-0.5 rounded-lg border border-border p-4 text-start transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="font-medium text-sm">{t('editScope.occurrenceLabel')}</span>
            <span className="text-xs text-muted-foreground">{t('editScope.occurrenceDescription')}</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => onChoose('series')}
            data-testid="edit-scope-series"
            className="flex flex-col items-start gap-0.5 rounded-lg border border-border p-4 text-start transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="font-medium text-sm">{t('editScope.seriesLabel')}</span>
            <span className="text-xs text-muted-foreground">{t('editScope.seriesDescription')}</span>
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isLoading} onClick={() => onOpenChange(false)}>
            {t('editScope.cancelLabel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
