import { useState } from 'react';

import type { TaskEnergy } from '@nicoflow/shared/types';

// Chip state for Focus: the time budget (drives the query and gates the list)
// and an optional energy preference (tunes ranking only). `available` undefined
// means "no time picked yet" — Focus shows the pick-time prompt until it's set.
export const useFocusChips = () => {
  const [available, setAvailable] = useState<number | undefined>(undefined);
  const [energy, setEnergy] = useState<TaskEnergy | undefined>(undefined);

  const clear = () => {
    setAvailable(undefined);
    setEnergy(undefined);
  };

  return { available, energy, setAvailable, setEnergy, clear, hasTimeBudget: available !== undefined };
};
