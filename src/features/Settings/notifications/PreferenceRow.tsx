import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface PreferenceRowProps {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  disabled?: boolean;
  // When true the row is a Pro feature the current user can't use: it shows a Pro
  // pill, the switch is locked off, and toggling routes to the upgrade prompt.
  locked?: boolean;
  onChange: (next: boolean) => void;
  onLockedClick?: () => void;
  testId?: string;
}

// One preference switch: icon + label + Switch, with an optional "Pro" pill when the
// family is gated. Locked rows are dimmed and non-committal — clicking the row (not a
// dead switch) surfaces the upgrade path, so the control never lies about its state.
export const PreferenceRow = ({
  icon: Icon,
  label,
  checked,
  disabled,
  locked,
  onChange,
  onLockedClick,
  testId,
}: PreferenceRowProps) => {
  const { t } = useTranslation('notification');

  return (
    <div
      className={cn('flex items-center gap-2.5 px-3 py-2', locked && 'cursor-pointer')}
      onClick={locked ? onLockedClick : undefined}
    >
      <Icon
        aria-hidden
        className={cn('h-4 w-4 shrink-0', locked ? 'text-muted-foreground/60' : 'text-muted-foreground')}
      />
      <span
        className={cn(
          'flex flex-1 items-center gap-1.5 text-xs',
          locked ? 'text-muted-foreground/70' : 'text-muted-foreground'
        )}
      >
        {label}
        {locked && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            <Sparkles className="h-2.5 w-2.5" aria-hidden />
            {t('prefs.pro')}
          </span>
        )}
      </span>
      <Switch
        checked={locked ? false : checked}
        disabled={disabled || locked}
        onCheckedChange={onChange}
        aria-label={label}
        data-testid={testId}
      />
    </div>
  );
};
