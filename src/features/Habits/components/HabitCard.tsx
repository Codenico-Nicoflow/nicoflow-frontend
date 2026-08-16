import type { IHabit, IHabitCell } from '@nicoflow/shared/types';
import { Archive, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ItemActionsMenu } from '@/components';
import type { ItemAction } from '@/components/ItemActionsMenu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { HABIT_FALLBACK_ICON, HABIT_SUBJECT_ICONS } from '../data';
import { isCheckable, isOffSchedule, scheduleSummary } from '../habitUtils';
import { useHabitCheckIn } from '../useHabitCheckIn';

import { HabitRibbon } from './HabitRibbon';
import { HabitRing } from './HabitRing';

export interface HabitCardProps {
  habit: IHabit;
  /** Overrides the habit's own window; the list read already carries one. */
  cells?: IHabitCell[];
  onOpen?: (id: string) => void;
  onRestore?: (id: string) => void;
  onEdit?: (habit: IHabit) => void;
  onArchive?: (habit: IHabit) => void;
  onDelete?: (habit: IHabit) => void;
}

// One habit: ring, identity, streak, ribbon.
//
// Everything except the ribbon is deliberately quiet. The ribbon is where this
// feature spends its one budget of visual boldness, and a card that also shouted
// its streak in a gradient numeral would compete with it.
export const HabitCard = ({ habit, cells, onOpen, onRestore, onEdit, onArchive, onDelete }: HabitCardProps) => {
  const { t } = useTranslation('habits');
  const { toggle, isChecked, isPending } = useHabitCheckIn(habit);

  // The list read carries its own short window, so a card draws a ribbon
  // without anyone threading cells down to it.
  const ribbonCells = cells ?? habit.cells ?? [];

  const checkable = isCheckable(habit);
  const offSchedule = isOffSchedule(habit);
  const summary = scheduleSummary(habit);
  // An unknown subject renders the fallback rather than a blank: the catalog is
  // served and can gain entries this build has never seen.
  const SubjectIcon = HABIT_SUBJECT_ICONS[habit.subject] ?? HABIT_FALLBACK_ICON;

  // Weekday labels are looked up through a literal tuple rather than a template
  // key: the i18n types are generated from the JSON, so `weekday.short.${n}`
  // widens to a string and stops type-checking against the real key union.
  const WEEKDAY_KEYS = [
    'weekday.short.0',
    'weekday.short.1',
    'weekday.short.2',
    'weekday.short.3',
    'weekday.short.4',
    'weekday.short.5',
    'weekday.short.6',
  ] as const;

  // Built from whichever handlers the parent supplied, so the board can offer
  // the full set while a read-only surface (the Today strip) offers none.
  const actions: ItemAction[] =
    habit.archivedAt !== null
      ? []
      : [
          ...(onEdit ? [{ label: t('detail.edit'), icon: Pencil, onClick: () => onEdit(habit) }] : []),
          ...(onArchive ? [{ label: t('detail.archive'), icon: Archive, onClick: () => onArchive(habit) }] : []),
          ...(onDelete
            ? [{ label: t('detail.delete'), icon: Trash2, onClick: () => onDelete(habit), destructive: true }]
            : []),
        ];

  const scheduleLabel =
    summary.key === 'schedule.weekdays'
      ? t(summary.key, {
          days: summary.days.map(d => t(WEEKDAY_KEYS[d] ?? WEEKDAY_KEYS[0])).join(', '),
        })
      : summary.key === 'schedule.quota'
        ? t(summary.key, { count: summary.count })
        : t(summary.key);

  return (
    <article
      data-testid={`habit-card-${habit.id}`}
      className={cn(
        'flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm transition-opacity',
        // Dimmed, never hidden. A habit that vanishes on its off day reads as
        // data loss rather than as "not today". Dimming keys off the schedule,
        // not off interactivity — a completed habit stays fully lit and fully
        // tappable so its check-in can be undone.
        offSchedule && 'opacity-60'
      )}
    >
      <div className="flex items-center gap-3">
        <HabitRing
          habit={habit}
          disabled={!checkable || isPending}
          checked={isChecked}
          onToggle={toggle}
          data-testid={`habit-ring-${habit.id}`}
        />

        <button
          type="button"
          onClick={() => onOpen?.(habit.id)}
          className="min-w-0 flex-1 cursor-pointer rounded-sm text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid={`habit-open-${habit.id}`}
        >
          <span className="flex items-center gap-1.5">
            <SubjectIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate font-medium">{habit.name}</span>
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {habit.unit ? `${habit.targetValue} ${habit.unit} · ${scheduleLabel}` : scheduleLabel}
          </span>
        </button>

        {/* Plain type, no gradient, no flame — the ribbon below says it louder. */}
        <span
          className="shrink-0 text-sm font-medium tabular-nums"
          data-testid={`habit-streak-${habit.id}`}
          aria-live="polite"
        >
          {t('streak', { count: habit.currentStreak, context: habit.streakUnit })}
        </span>

        {/* Archived cards get a Restore button below instead — offering Archive
            on something already archived would be a no-op the user can see. */}
        {actions.length > 0 ? (
          <ItemActionsMenu
            actions={actions}
            triggerLabel={t('actions.menuLabel', { name: habit.name })}
            data-testid={`habit-actions-${habit.id}`}
          />
        ) : null}
      </div>

      {ribbonCells.length > 0 ? (
        <HabitRibbon
          cells={ribbonCells}
          streakUnit={habit.streakUnit}
          currentStreak={habit.currentStreak}
          data-testid={`habit-ribbon-${habit.id}`}
        />
      ) : null}

      {habit.archivedAt ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => void onRestore?.(habit.id)}
          data-testid={`habit-restore-${habit.id}`}
        >
          {t('segments.restore')}
        </Button>
      ) : null}
    </article>
  );
};
