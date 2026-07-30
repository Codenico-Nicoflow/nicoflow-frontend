import { motion } from 'framer-motion';
import { AlarmClock, X } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { OptionalBadge } from '@/components/OptionalBadge';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

/** Snap step in minutes — matches the calendar grid and the backend boundary. */
export const TIME_STEP_MINUTES = 15;

/**
 * Round an "HH:MM" string to the nearest 15-minute boundary, clamped inside the
 * day. Typed input can produce 09:07; the grid and the backend only accept
 * quarter hours, so the field settles onto one on blur instead of failing
 * validation for a value the user cannot see is wrong.
 */
export const snapTimeString = (value: string): string => {
  const [hours = NaN, minutes = NaN] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  const total = Math.min(
    Math.round((hours * 60 + minutes) / TIME_STEP_MINUTES) * TIME_STEP_MINUTES,
    24 * 60 - TIME_STEP_MINUTES
  );
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

interface ScheduledTimeFieldProps<T extends FieldValues> {
  control: Control<T>;
  label?: string;
  fieldName?: Path<T>;
  delay?: number;
  optional?: boolean;
  /** A time without a day has nowhere to land — disable until a date is set. */
  disabled?: boolean;
  'data-testid'?: string;
}

/**
 * Time-of-day for a scheduled task ("HH:MM", 15-minute snap). This is the
 * keyboard path to the same value a calendar drag writes — the two must stay
 * interchangeable, so both snap to the same boundary. Pro-only to set; the
 * server's 403 surfaces as the dialog's upgrade prompt, not a disabled input.
 */
export const ScheduledTimeField = <T extends FieldValues>({
  control,
  label,
  fieldName = 'scheduledTime' as Path<T>,
  delay = 0.28,
  optional = true,
  disabled = false,
  'data-testid': testId,
}: ScheduledTimeFieldProps<T>) => {
  const { t } = useTranslation('common');
  const resolvedLabel = label ?? t('fields.scheduledTimeLabel');
  const base = testId ?? 'scheduled-time';

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => {
          const value = (field.value as string | null | undefined) ?? '';
          return (
            <FormItem data-testid={`${base}-item`}>
              <FormLabel
                data-testid={`${base}-label`}
                className="text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <AlarmClock className="h-4 w-4" />
                {resolvedLabel}
                {optional && <OptionalBadge />}
              </FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    type="time"
                    step={TIME_STEP_MINUTES * 60}
                    data-testid={`${base}-input`}
                    className="h-10 sm:h-12 w-40"
                    disabled={disabled}
                    value={value}
                    name={field.name}
                    ref={field.ref}
                    onChange={event => field.onChange(event.target.value || null)}
                    onBlur={() => {
                      if (value) field.onChange(snapTimeString(value));
                      field.onBlur();
                    }}
                    aria-label={resolvedLabel}
                  />
                </FormControl>
                {value && !disabled && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    data-testid={`${base}-clear-button`}
                    aria-label={t('fields.scheduledTimeClear')}
                    className="h-10 sm:h-12 w-10 sm:w-12 hover:bg-primary/10 hover:text-primary"
                    onClick={() => field.onChange(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {disabled ? t('fields.scheduledTimeNeedsDate') : t('fields.scheduledTimeHint')}
              </p>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </motion.div>
  );
};
