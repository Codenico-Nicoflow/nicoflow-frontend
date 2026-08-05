import type { IHabit } from '@/lib/types';

import { HABIT_GRID_CLASSES } from '../data';

import { HabitCard } from './HabitCard';

export interface HabitGridProps {
  habits: IHabit[];
  onOpen?: (id: string) => void;
}

// The habits board. Cards carry no ribbon here — the list endpoint returns
// counters but not cells, and fetching every habit's history to render a grid
// would trade the whole point of the batched read for decoration. The ribbon
// lives on the detail view, where the cells already arrive.
export const HabitGrid = ({ habits, onOpen }: HabitGridProps) => (
  <div className={HABIT_GRID_CLASSES} data-testid="habit-grid">
    {habits.map(habit => (
      <HabitCard key={habit.id} habit={habit} onOpen={onOpen} />
    ))}
  </div>
);
