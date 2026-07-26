import { useTranslation } from 'react-i18next';

import { ENERGY_OPTIONS } from '@/components';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import type { TaskEnergy } from '@/lib/types';
import { cn } from '@/lib/utils';

import { TIME_CHIPS } from '../data';

interface FocusChipsProps {
  available: number | undefined;
  onAvailableChange: (minutes: number | undefined) => void;
  energy: TaskEnergy | undefined;
  onEnergyChange: (energy: TaskEnergy | undefined) => void;
}

// Drives the /focus query: a segmented time-budget control + an energy dropdown.
// "Any" (time) / "Any energy" (dropdown) map back to undefined = unspecified.
const FocusChips = ({ available, onAvailableChange, energy, onEnergyChange }: FocusChipsProps) => {
  const { t } = useTranslation(['task', 'common']);

  const activeEnergyOption = ENERGY_OPTIONS.find(option => option.value === energy);
  const ActiveEnergyIcon = activeEnergyOption?.icon;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <span className="whitespace-nowrap text-xs sm:text-sm text-muted-foreground">{t('focus.timeLabel')}</span>
        {/* Segmented time control; scrolls with an edge fade on narrow screens. */}
        <div className="relative min-w-0 [mask-image:linear-gradient(to_right,black,black_calc(100%-1.5rem),transparent)] sm:[mask-image:none]">
          <div
            className="flex items-center gap-1 overflow-x-auto rounded-lg bg-muted p-1"
            role="tablist"
            aria-label={t('focus.timeLabel')}
          >
            {[{ id: 'any' as const, minutes: undefined }, ...TIME_CHIPS].map(({ id, minutes }) => {
              const isActive = available === minutes;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onAvailableChange(minutes)}
                  data-testid={`focus-time-${id}`}
                  className={cn(
                    'flex-shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
                    isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {id === 'any' ? t('focus.timeAny') : t(`focus.time.${id}`)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Select
        value={energy ?? 'any'}
        onValueChange={value => onEnergyChange(value === 'any' ? undefined : (value as TaskEnergy))}
      >
        <SelectTrigger
          className="h-9 w-full flex-shrink-0 sm:w-40"
          data-testid="focus-energy"
          aria-label={t('focus.energyLabel')}
        >
          <span className="flex items-center gap-2">
            {ActiveEnergyIcon && (
              <ActiveEnergyIcon className={cn('h-3.5 w-3.5', activeEnergyOption?.colorClass)} aria-hidden />
            )}
            {activeEnergyOption ? t(activeEnergyOption.labelKey) : t('focus.energyAny')}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">{t('focus.energyAny')}</SelectItem>
          {ENERGY_OPTIONS.map(({ value, icon: Icon, labelKey, colorClass }) => (
            <SelectItem key={value} value={value} data-testid={`focus-energy-${value}`}>
              <span className="flex items-center gap-2">
                <Icon className={cn('h-3.5 w-3.5', colorClass)} aria-hidden />
                {t(labelKey)}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FocusChips;
