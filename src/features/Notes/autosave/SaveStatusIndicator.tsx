import { AlertTriangle, Check, CloudOff, Loader2, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import type { SaveStatusValue } from './types';
import { SaveStatus } from './types';

export interface SaveStatusIndicatorProps {
  status: SaveStatusValue;
  className?: string;
}

// role="status" + aria-live="polite" so a save is announced without stealing
// focus mid-typing. The icon is decorative; the text carries the meaning.
export const SaveStatusIndicator = ({ status, className }: SaveStatusIndicatorProps) => {
  const { t } = useTranslation('notes');

  if (status === SaveStatus.IDLE) return null;

  const { Icon, label, tone, spin } = presentation(status);

  return (
    <p
      role="status"
      aria-live="polite"
      data-testid="note-save-status"
      className={cn('flex items-center gap-1.5 text-xs', tone, className)}
    >
      <Icon className={cn('h-3.5 w-3.5', spin && 'animate-spin')} aria-hidden="true" />
      {t(label)}
    </p>
  );
};

type Presentation = {
  Icon: typeof Check;
  label: 'save.unsaved' | 'save.saving' | 'save.saved' | 'save.error' | 'save.conflictTitle';
  tone: string;
  spin?: boolean;
};

const presentation = (status: Exclude<SaveStatusValue, typeof SaveStatus.IDLE>): Presentation => {
  switch (status) {
    case SaveStatus.SAVING:
      return { Icon: Loader2, label: 'save.saving', tone: 'text-muted-foreground', spin: true };
    case SaveStatus.SAVED:
      return { Icon: Check, label: 'save.saved', tone: 'text-muted-foreground' };
    case SaveStatus.CONFLICT:
      return { Icon: AlertTriangle, label: 'save.conflictTitle', tone: 'text-destructive' };
    case SaveStatus.ERROR:
      return { Icon: CloudOff, label: 'save.error', tone: 'text-destructive' };
    case SaveStatus.UNSAVED:
    default:
      return { Icon: Pencil, label: 'save.unsaved', tone: 'text-muted-foreground' };
  }
};
