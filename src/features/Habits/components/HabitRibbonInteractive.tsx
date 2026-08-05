import { useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import type { IHabitCell } from '@/lib/types';
import { cn } from '@/lib/utils';

import { toRibbonRuns } from '../habitUtils';

export interface HabitRibbonInteractiveProps {
  cells: IHabitCell[];
  streakUnit: 'day' | 'week';
  currentStreak: number;
  /** Dates the backfill window still allows; anything else renders read-only. */
  editableDates: Set<string>;
  onToggleDay: (date: string) => void;
  isBusy?: boolean;
}

// The detail page's ribbon: the same shape as the card's, but every day is a
// control so a forgotten Tuesday can be corrected where the user can see it.
//
// The card's ribbon stays `role="img"` deliberately — thirty focus stops per
// card, on a board of them, is hostile. Here there is exactly ONE ribbon, and
// the keyboard cost is paid down with a roving tabindex: the strip is a single
// tab stop and arrow keys move within it, which is the listbox pattern rather
// than thirty separate stops.
//
// Only day habits get this. A week cell means "2 of 3", and a tap on it has no
// single obvious meaning — there is no one day it would toggle.
export const HabitRibbonInteractive = ({
  cells,
  streakUnit,
  currentStreak,
  editableDates,
  onToggleDay,
  isBusy = false,
}: HabitRibbonInteractiveProps) => {
  const { t } = useTranslation('habits');
  const containerRef = useRef<HTMLDivElement>(null);

  // The roving stop starts on the most recent editable day — the one a user
  // reaching for the keyboard almost always wants.
  const lastEditable = cells.map(c => c.date).filter(d => editableDates.has(d));
  const [focusedDate, setFocusedDate] = useState<string | undefined>(lastEditable.at(-1));

  const segments = toRibbonRuns(cells);
  const satisfiedCount = cells.filter(c => c.satisfied).length;
  const editable = cells.filter(c => editableDates.has(c.date));

  const moveFocus = (from: string, delta: number) => {
    const index = editable.findIndex(c => c.date === from);
    const next = editable[index + delta];
    if (!next) return;

    setFocusedDate(next.date);
    containerRef.current?.querySelector<HTMLButtonElement>(`[data-date="${next.date}"]`)?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent, date: string) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;

    event.preventDefault();
    moveFocus(date, step);
  };

  if (cells.length === 0) return null;

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={t('ribbon.summary', {
        satisfied: satisfiedCount,
        total: cells.length,
        count: currentStreak,
        context: streakUnit,
      })}
      data-testid="habit-ribbon-interactive"
      className="flex w-full items-stretch gap-0.5"
    >
      {segments.map((segment, segmentIndex) =>
        segment.cells.map(cell => {
          const isEditable = editableDates.has(cell.date);
          const isFocusStop = cell.date === focusedDate;

          const label = t(cell.satisfied ? 'ribbon.cellDone' : 'ribbon.cellNotDone', { date: cell.date });

          // Days outside the backfill window are still drawn — the history is
          // the point — but they are not controls, so they never take focus.
          if (!isEditable) {
            return (
              <span
                key={cell.date}
                data-testid={`habit-cell-${cell.date}`}
                data-kind={segment.kind}
                data-segment={segmentIndex}
                aria-hidden="true"
                className={cn(
                  'min-h-6 flex-1 rounded-sm',
                  segment.kind === 'run' && 'bg-primary',
                  segment.kind === 'gap' && 'bg-muted',
                  segment.kind === 'unscheduled' && 'my-auto h-px bg-border'
                )}
              />
            );
          }

          return (
            <button
              key={cell.date}
              type="button"
              // Roving tabindex: one stop for the whole strip, arrows move
              // within it. Thirty tab stops would be the hostile version.
              tabIndex={isFocusStop ? 0 : -1}
              data-date={cell.date}
              data-testid={`habit-cell-${cell.date}`}
              data-kind={segment.kind}
              data-segment={segmentIndex}
              aria-pressed={cell.satisfied}
              aria-label={label}
              disabled={isBusy}
              onFocus={() => setFocusedDate(cell.date)}
              onKeyDown={event => onKeyDown(event, cell.date)}
              onClick={() => onToggleDay(cell.date)}
              className={cn(
                // A real touch target: 24px minimum, which is what forces this
                // ribbon to be taller than the card's 10px decorative one.
                'min-h-6 flex-1 rounded-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                cell.satisfied ? 'bg-primary hover:bg-primary/80' : 'bg-muted hover:bg-muted-foreground/30',
                isBusy && 'cursor-not-allowed opacity-60'
              )}
            />
          );
        })
      )}
    </div>
  );
};
