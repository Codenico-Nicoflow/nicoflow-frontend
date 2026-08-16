import type { IHabitCell } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { toRibbonRuns } from '../habitUtils';

export interface HabitRibbonProps {
  cells: IHabitCell[];
  /** Drives the summary label's noun — days for day habits, weeks for quota. */
  streakUnit: 'day' | 'week';
  currentStreak: number;
  className?: string;
  'data-testid'?: string;
}

// The signature element.
//
// This is not a neutral grid of squares. Consecutive satisfied cells butt
// together into ONE continuous bar — rounded only at the run's outer ends — so a
// streak stops being a number you read and becomes a shape you scan. A miss cuts
// the bar, and that visible break is the whole motivational mechanic.
//
// Off-schedule days render as a hairline baseline rather than an empty cell: a
// Mon/Wed/Fri habit must not look like it failed four days a week.
export const HabitRibbon = ({ cells, streakUnit, currentStreak, className, ...rest }: HabitRibbonProps) => {
  const { t } = useTranslation('habits');

  const segments = toRibbonRuns(cells);
  const satisfiedCount = cells.filter(c => c.satisfied).length;

  // One label for the whole strip. Individual cells are deliberately NOT focus
  // stops — thirty tab stops per card is hostile — so the summary has to carry
  // everything a sighted user reads from the shape.
  const label = t('ribbon.summary', {
    satisfied: satisfiedCount,
    total: cells.length,
    count: currentStreak,
    context: streakUnit,
  });

  if (cells.length === 0) return null;

  return (
    <div
      role="img"
      aria-label={label}
      data-testid={rest['data-testid'] ?? 'habit-ribbon'}
      className={cn('flex h-2.5 w-full items-center gap-px overflow-hidden', className)}
    >
      {segments.map((segment, segmentIndex) =>
        segment.cells.map((cell, cellIndex) => {
          const isFirst = cellIndex === 0;
          const isLast = cellIndex === segment.cells.length - 1;

          return (
            <span
              key={cell.date}
              data-testid={`habit-ribbon-cell-${cell.date}`}
              data-kind={segment.kind}
              aria-hidden="true"
              className={cn(
                'h-full flex-1 transition-colors',
                // Cells inside a run share square inner edges so the run reads
                // as one object; only the outer ends round.
                isFirst && 'rounded-l-full',
                isLast && 'rounded-r-full',
                segment.kind === 'run' && 'bg-primary',
                segment.kind === 'gap' && 'bg-muted',
                // A baseline, not a cell: present so the strip stays continuous,
                // quiet so it never reads as a failure.
                segment.kind === 'unscheduled' && 'h-px self-center bg-border'
              )}
              // Unscheduled cells inside a run keep the run's colour at hairline
              // height, so the bar visually bridges them.
              style={segment.kind === 'run' && !cell.scheduled ? { height: '1px', alignSelf: 'center' } : undefined}
              data-segment={segmentIndex}
            />
          );
        })
      )}
    </div>
  );
};
