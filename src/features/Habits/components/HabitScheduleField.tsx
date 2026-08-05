import { type Control, useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import type { HabitFormData } from '../schema';

// Weekday order follows the locale's week start via CSS order rather than a
// reshuffled array, so the stored values stay 0=Sunday…6=Saturday regardless of
// how they are displayed. Keys are a literal tuple because the generated i18n
// types reject a template lookup.
const WEEKDAY_KEYS = [
  'weekday.short.0',
  'weekday.short.1',
  'weekday.short.2',
  'weekday.short.3',
  'weekday.short.4',
  'weekday.short.5',
  'weekday.short.6',
] as const;

const KINDS = ['daily', 'weekdays', 'weekly_quota'] as const;
const KIND_LABELS = {
  daily: 'form.kind.daily',
  weekdays: 'form.kind.weekdays',
  weekly_quota: 'form.kind.quota',
} as const;

export interface HabitScheduleFieldProps {
  control: Control<HabitFormData>;
}

// One control, three shapes.
//
// The segmented picker chooses the kind and reveals only the inputs that kind
// needs — a weekdays habit gets a day row, a quota habit gets a stepper, a daily
// habit gets nothing. Showing all three at once would turn a two-decision form
// into a settings panel.
export const HabitScheduleField = ({ control }: HabitScheduleFieldProps) => {
  const { t } = useTranslation('habits');

  const kind = useController({ control, name: 'scheduleKind' });
  const weekdays = useController({ control, name: 'byWeekday' });
  const timesPerWeek = useController({ control, name: 'timesPerWeek' });

  const selectedDays: number[] = weekdays.field.value ?? [];

  const toggleDay = (day: number) => {
    const next = selectedDays.includes(day) ? selectedDays.filter(d => d !== day) : [...selectedDays, day].sort();
    weekdays.field.onChange(next);
  };

  return (
    <div className="space-y-3">
      <Label>{t('form.schedule')}</Label>

      <div className="flex gap-1 rounded-md bg-muted p-1" role="group" aria-label={t('form.schedule')}>
        {KINDS.map(k => (
          <Button
            key={k}
            type="button"
            size="sm"
            variant={kind.field.value === k ? 'default' : 'ghost'}
            aria-pressed={kind.field.value === k}
            onClick={() => kind.field.onChange(k)}
            className="flex-1"
            data-testid={`habit-schedule-kind-${k}`}
          >
            {t(KIND_LABELS[k])}
          </Button>
        ))}
      </div>

      {kind.field.value === 'weekdays' ? (
        <div className="space-y-1.5">
          <div className="flex gap-1" role="group" aria-label={t('form.kind.weekdays')}>
            {WEEKDAY_KEYS.map((labelKey, day) => (
              <Button
                key={labelKey}
                type="button"
                size="sm"
                variant={selectedDays.includes(day) ? 'default' : 'outline'}
                aria-pressed={selectedDays.includes(day)}
                onClick={() => toggleDay(day)}
                className="flex-1 px-0"
                data-testid={`habit-weekday-${day}`}
              >
                {t(labelKey)}
              </Button>
            ))}
          </div>
          {weekdays.fieldState.error ? (
            <p className="text-sm text-destructive" data-testid="habit-weekday-error">
              {t(weekdays.fieldState.error.message as 'form.errors.weekdaysRequired')}
            </p>
          ) : null}
        </div>
      ) : null}

      {kind.field.value === 'weekly_quota' ? (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={7}
            className="w-20"
            aria-label={t('form.timesPerWeek')}
            data-testid="habit-times-per-week"
            value={timesPerWeek.field.value}
            onChange={e => timesPerWeek.field.onChange(Number(e.target.value))}
            onBlur={timesPerWeek.field.onBlur}
            name={timesPerWeek.field.name}
            ref={timesPerWeek.field.ref}
          />
          <span className="text-sm text-muted-foreground">{t('form.timesPerWeek')}</span>
        </div>
      ) : null}

      {/* The user reads their schedule back in the same words the card will use,
          so there is no gap between what they chose and what they'll see. */}
      <p className={cn('text-xs text-muted-foreground')} data-testid="habit-schedule-summary">
        {kind.field.value === 'weekdays'
          ? selectedDays.map(d => t(WEEKDAY_KEYS[d] ?? WEEKDAY_KEYS[0])).join(', ') || t('form.noDays')
          : kind.field.value === 'weekly_quota'
            ? t('schedule.quota', { count: Number(timesPerWeek.field.value) || 0 })
            : t('schedule.daily')}
      </p>
    </div>
  );
};
