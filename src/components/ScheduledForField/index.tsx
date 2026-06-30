import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { CalendarClock, X } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { OptionalBadge } from '@/components/OptionalBadge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getDateLocale } from '@/lib/i18n/dateLocale';
import { cn } from '@/lib/utils';

interface ScheduledForFieldProps<T extends FieldValues> {
  control: Control<T>;
  label?: string;
  fieldName?: Path<T>;
  delay?: number;
  optional?: boolean;
  'data-testid'?: string;
}

/**
 * Soft scheduling intention. Unlike DueDateField (a hard deadline held as a
 * Date), this emits a bare ISO date string "YYYY-MM-DD" — the wire shape the
 * backend expects (SPEC §3.4). A past value is allowed: roll-forward, not
 * overdue, is the model. No red styling here; tone lives in TaskItem.
 */
export const ScheduledForField = <T extends FieldValues>({
  control,
  label,
  fieldName = 'scheduledFor' as Path<T>,
  delay = 0.2,
  optional = true,
  'data-testid': testId,
}: ScheduledForFieldProps<T>) => {
  const { t, i18n } = useTranslation('common');
  const resolvedLabel = label ?? t('fields.scheduledForLabel');
  const dateLocale = getDateLocale(i18n.language);
  const base = testId ?? 'scheduled-for';

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => {
          const selectedDate = field.value ? parseISO(field.value as string) : undefined;
          return (
            <FormItem data-testid={`${base}-item`} className="flex flex-col">
              <FormLabel
                data-testid={`${base}-label`}
                className="text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <CalendarClock className="h-4 w-4" />
                {resolvedLabel}
                {optional && <OptionalBadge />}
              </FormLabel>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        data-testid={`${base}-trigger`}
                        variant="outline"
                        className={cn(
                          'h-10 sm:h-12 flex-1 justify-start text-start font-normal text-sm sm:text-base',
                          !selectedDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarClock className="me-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP', { locale: dateLocale }) : t('fields.pickDate')}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      data-testid={`${base}-calendar`}
                      mode="single"
                      selected={selectedDate}
                      onSelect={date => field.onChange(date ? format(date, 'yyyy-MM-dd') : null)}
                    />
                  </PopoverContent>
                </Popover>
                {selectedDate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    data-testid={`${base}-clear-button`}
                    className="h-10 sm:h-12 w-10 sm:w-12 hover:bg-primary/10 hover:text-primary"
                    onClick={() => field.onChange(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t('fields.scheduledForHint')}</p>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </motion.div>
  );
};
