import { LayoutList, Rows3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

export type ViewMode = 'tabs' | 'combined';

const OPTIONS: { mode: ViewMode; icon: typeof LayoutList }[] = [
  { mode: 'tabs', icon: LayoutList },
  { mode: 'combined', icon: Rows3 },
];

const ViewModeToggle = ({
  mode,
  onChange,
  className,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}) => {
  const { t } = useTranslation('task');

  return (
    <div
      className={cn('flex items-center gap-1 rounded-lg bg-muted p-1', className)}
      role="radiogroup"
      aria-label={t('timeSpread.viewModeLabel')}
    >
      {OPTIONS.map(({ mode: optionMode, icon: Icon }) => {
        const isActive = optionMode === mode;
        return (
          <button
            key={optionMode}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={t(optionMode === 'tabs' ? 'timeSpread.viewModeTabs' : 'timeSpread.viewModeCombined')}
            data-testid={`timespread-viewmode-${optionMode}`}
            onClick={() => onChange(optionMode)}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
};

export default ViewModeToggle;
