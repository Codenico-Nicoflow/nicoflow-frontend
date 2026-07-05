import { useState } from 'react';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useDebouncedValue } from '@/hooks';
import { useGetFocusQuery } from '@/lib/store';
import type { TaskEnergy } from '@/lib/types';

import FocusChips from './components/FocusChips';
import FocusTaskRow from './components/FocusTaskRow';
import FocusEmptyState from './states/FocusEmptyState';
import { FOCUS_LIMIT } from './data';

// The signature screen: state your time + energy, get one confident next move.
// Chip changes are debounced so rapid taps fire a single /focus fetch.
const FocusView = () => {
  const { t } = useTranslation('task');
  const [available, setAvailable] = useState<number | undefined>(undefined);
  const [energy, setEnergy] = useState<TaskEnergy | undefined>(undefined);

  const debouncedAvailable = useDebouncedValue(available, 300);
  const debouncedEnergy = useDebouncedValue(energy, 300);

  const { data: tasks = [], isFetching } = useGetFocusQuery({
    available: debouncedAvailable,
    energy: debouncedEnergy,
    limit: FOCUS_LIMIT,
  });

  const clearChips = () => {
    setAvailable(undefined);
    setEnergy(undefined);
  };

  return (
    <div className="p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('focus.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">{t('focus.subtitle')}</p>
        </div>

        <FocusChips available={available} onAvailableChange={setAvailable} energy={energy} onEnergyChange={setEnergy} />

        {tasks.length > 0 ? (
          <div className="space-y-3 sm:space-y-4" data-testid="focus-list" aria-busy={isFetching}>
            {tasks.map((task, index) => (
              <FocusTaskRow key={task.id} task={task} index={index} />
            ))}
          </div>
        ) : (
          !isFetching && (
            <FocusEmptyState hasBudget={available !== undefined || energy !== undefined} onClearChips={clearChips} />
          )
        )}
      </motion.div>
    </div>
  );
};

export default FocusView;
