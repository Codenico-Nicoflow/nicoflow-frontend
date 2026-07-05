import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { ENERGY_OPTIONS } from '@/components';
import type { TaskEnergy } from '@/lib/types';
import { cn } from '@/lib/utils';

import { TIME_CHIPS } from '../data';

interface FocusChipsProps {
  available: number | undefined;
  onAvailableChange: (minutes: number | undefined) => void;
  energy: TaskEnergy | undefined;
  onEnergyChange: (energy: TaskEnergy | undefined) => void;
}

const chip = (isActive: boolean) =>
  cn(
    'inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer',
    'border whitespace-nowrap flex-shrink-0',
    isActive
      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
      : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
  );

// Two chip rows driving the /focus query: time available and (optional) energy.
// Tapping the active chip again clears it back to "unspecified".
const FocusChips = ({ available, onAvailableChange, energy, onEnergyChange }: FocusChipsProps) => {
  const { t } = useTranslation(['task', 'common']);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3" role="group" aria-label={t('focus.timeLabel')}>
        <span className="text-xs sm:text-sm text-muted-foreground me-1">{t('focus.timeLabel')}</span>
        {TIME_CHIPS.map(({ id, minutes }) => {
          const isActive = available === minutes;
          return (
            <motion.button
              key={id}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAvailableChange(isActive ? undefined : minutes)}
              data-testid={`focus-time-${id}`}
              aria-pressed={isActive}
              className={chip(isActive)}
            >
              {t(`focus.time.${id}`)}
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('focus.energyLabel')}>
        <span className="text-xs sm:text-sm text-muted-foreground me-1">{t('focus.energyLabel')}</span>
        {ENERGY_OPTIONS.map(({ value, icon: Icon, labelKey }) => {
          const isActive = energy === value;
          return (
            <motion.button
              key={value}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onEnergyChange(isActive ? undefined : value)}
              data-testid={`focus-energy-${value}`}
              aria-pressed={isActive}
              className={chip(isActive)}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {t(labelKey)}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default FocusChips;
