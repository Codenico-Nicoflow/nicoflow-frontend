import type { IHabit } from '@/lib/types';

import { HABIT_GRID_CLASSES } from '../data';

import { HabitCard } from './HabitCard';

export interface HabitGridProps {
  habits: IHabit[];
  onOpen?: (id: string) => void;
  onRestore?: (id: string) => void;
}

// The habits board. Cards draw their own ribbon from the short window the list
// read carries — no extra request per card, because the server already had
// those rows in hand when it derived the streaks.
export const HabitGrid = ({ habits, onOpen, onRestore }: HabitGridProps) => (
  <div className={HABIT_GRID_CLASSES} data-testid="habit-grid">
    {habits.map(habit => (
      <HabitCard key={habit.id} habit={habit} onOpen={onOpen} onRestore={onRestore} />
    ))}
  </div>
);
