import { motion, useReducedMotion } from 'framer-motion';
import { Repeat } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  MONTHDAY_LAST,
  RECURRENCE_MAX_INTERVAL,
  RECURRENCE_MIN_INTERVAL,
  RECURRENCE_WEEKDAYS,
  RecurrenceEnd,
  RecurrenceFreq,
} from '@/lib/types';
import { cn } from '@/lib/utils';

import type { RecurrenceValue } from './types';
import { defaultRecurrence } from './types';
import { useRecurrenceSummary } from './useRecurrenceSummary';

interface RecurrenceFieldProps {
  value: RecurrenceValue | null;
  onChange: (value: RecurrenceValue | null) => void;
  // Mirrors the project's loading convention: while a mutation is in flight the
  // pickers are disabled rather than silently accepting edits that get discarded.
  disabled?: boolean;
  'data-testid'?: string;
}

// The "Repeats" section. Toggling it on turns a task create into a rule create
// (the backend materializes instance #1); the user never sees the word "rule".
// State is one controlled object rather than per-field RHF registration, so the
// whole schedule can be handed to the parent form as a single value.
export const RecurrenceField = ({
  value,
  onChange,
  disabled = false,
  'data-testid': testId = 'recurrence',
}: RecurrenceFieldProps) => {
  const { t } = useTranslation(['recurrence', 'common']);
  const reduce = useReducedMotion();
  const renderSummary = useRecurrenceSummary();

  const enabled = value !== null;
  // Only used to shape the editor before a value exists; the toggle is what
  // actually commits a default upward.
  const rule = value ?? defaultRecurrence();

  const patch = (next: Partial<RecurrenceValue>) => onChange({ ...rule, ...next });

  const toggleWeekday = (day: number) => {
    const has = rule.byWeekday.includes(day);
    patch({
      byWeekday: has ? rule.byWeekday.filter(d => d !== day) : [...rule.byWeekday, day].sort((a, b) => a - b),
    });
  };

  return (
    <div className="space-y-3" data-testid={`${testId}-section`}>
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            {t('recurrence:field.label')}
          </Label>
          <p className="text-xs text-muted-foreground">{t('recurrence:field.description')}</p>
        </div>
        <Switch
          checked={enabled}
          disabled={disabled}
          onCheckedChange={on => onChange(on ? defaultRecurrence() : null)}
          aria-label={t('recurrence:field.label')}
          data-testid={`${testId}-toggle`}
        />
      </div>

      {enabled && (
        <motion.div
          initial={reduce ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3 rounded-md border border-border p-3"
          data-testid={`${testId}-editor`}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${testId}-freq`} className="text-xs">
                {t('recurrence:field.freqLabel')}
              </Label>
              <Select
                value={rule.freq}
                disabled={disabled}
                onValueChange={freq => patch({ freq: freq as RecurrenceValue['freq'] })}
              >
                <SelectTrigger id={`${testId}-freq`} data-testid={`${testId}-freq`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(RecurrenceFreq).map(f => (
                    <SelectItem key={f} value={f}>
                      {t(`recurrence:freq.${f}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`${testId}-interval`} className="text-xs">
                {t('recurrence:field.intervalLabel')}
              </Label>
              <Input
                id={`${testId}-interval`}
                type="number"
                inputMode="numeric"
                min={RECURRENCE_MIN_INTERVAL}
                max={RECURRENCE_MAX_INTERVAL}
                value={rule.interval}
                disabled={disabled}
                onChange={e => {
                  const n = Number(e.target.value);
                  patch({ interval: Number.isFinite(n) ? n : RECURRENCE_MIN_INTERVAL });
                }}
                data-testid={`${testId}-interval`}
              />
            </div>
          </div>

          {rule.freq === RecurrenceFreq.WEEKLY && (
            <div className="space-y-1.5">
              <Label className="text-xs">{t('recurrence:field.weekdayLabel')}</Label>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('recurrence:field.weekdayLabel')}>
                {RECURRENCE_WEEKDAYS.map(day => {
                  const active = rule.byWeekday.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      aria-pressed={active}
                      onClick={() => toggleWeekday(day)}
                      className={cn(
                        'h-8 min-w-9 rounded-md border px-2 text-xs font-medium transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background hover:bg-muted'
                      )}
                      data-testid={`${testId}-weekday-${day}`}
                    >
                      {t(`recurrence:weekdayShort.${day}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {rule.freq === RecurrenceFreq.MONTHLY && (
            <div className="space-y-1.5">
              <Label htmlFor={`${testId}-monthday`} className="text-xs">
                {t('recurrence:field.monthdayLabel')}
              </Label>
              <Select
                value={String(rule.byMonthday ?? 1)}
                disabled={disabled}
                onValueChange={v => patch({ byMonthday: Number(v) })}
              >
                <SelectTrigger id={`${testId}-monthday`} data-testid={`${testId}-monthday`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <SelectItem key={d} value={String(d)}>
                      {d}
                    </SelectItem>
                  ))}
                  <SelectItem value={String(MONTHDAY_LAST)}>{t('recurrence:field.lastDayOfMonth')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${testId}-start`} className="text-xs">
                {t('recurrence:field.startDateLabel')}
              </Label>
              <Input
                id={`${testId}-start`}
                type="date"
                value={rule.startDate}
                disabled={disabled}
                onChange={e => patch({ startDate: e.target.value })}
                data-testid={`${testId}-start`}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`${testId}-end-mode`} className="text-xs">
                {t('recurrence:field.endLabel')}
              </Label>
              <Select
                value={rule.endDate ? RecurrenceEnd.ON_DATE : RecurrenceEnd.NEVER}
                disabled={disabled}
                onValueChange={mode =>
                  patch({ endDate: mode === RecurrenceEnd.ON_DATE ? (rule.endDate ?? rule.startDate) : null })
                }
              >
                <SelectTrigger id={`${testId}-end-mode`} data-testid={`${testId}-end-mode`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RecurrenceEnd.NEVER}>{t('recurrence:field.endNever')}</SelectItem>
                  <SelectItem value={RecurrenceEnd.ON_DATE}>{t('recurrence:field.endOnDate')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {rule.endDate != null && (
            <div className="space-y-1.5">
              <Label htmlFor={`${testId}-end-date`} className="text-xs">
                {t('recurrence:field.endDateLabel')}
              </Label>
              <Input
                id={`${testId}-end-date`}
                type="date"
                min={rule.startDate}
                value={rule.endDate}
                disabled={disabled}
                onChange={e => patch({ endDate: e.target.value })}
                data-testid={`${testId}-end-date`}
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground" data-testid={`${testId}-summary`}>
            {renderSummary(rule)}
          </p>
        </motion.div>
      )}
    </div>
  );
};
