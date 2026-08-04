import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export interface ConflictNoticeProps {
  onReload: () => void;
}

// Shown when autosave has halted on a 409. Reload is the ONLY action offered:
// there is no merge, and no "save anyway" — that button would overwrite the
// other session's work with an older document, and there is no undo. The copy
// tells the user to copy their text out first, because reloading discards it.
export const ConflictNotice = ({ onReload }: ConflictNoticeProps) => {
  const { t } = useTranslation('notes');

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>{t('save.conflictTitle')}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <span>{t('save.conflictBody')}</span>
        <Button type="button" variant="outline" size="sm" onClick={onReload}>
          {t('save.reload')}
        </Button>
      </AlertDescription>
    </Alert>
  );
};
