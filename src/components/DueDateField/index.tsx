import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, isDateInPast } from '@/lib/utils';

interface DueDateFieldProps<T extends FieldValues> {
  control: Control<T>;
  label?: string;
  fieldName?: Path<T>;
  delay?: number;
  optional?: boolean;
  'data-testid'?: string;
}

export const DueDateField = <T extends FieldValues>({
  control,
  label = 'Due Date',
  fieldName = 'dueDate' as Path<T>,
  delay = 0.2,
  optional = false,
  'data-testid': testId,
}: DueDateFieldProps<T>) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem data-testid={testId ? `${testId}-due-date-item` : 'due-date-item'} className="flex flex-col">
            <FormLabel
              data-testid={testId ? `${testId}-due-date-label` : 'due-date-label'}
              className="text-sm font-semibold text-foreground flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              {label}
              {optional && <span className="text-xs text-muted-foreground font-normal">(Optional)</span>}
            </FormLabel>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      data-testid={testId ? `${testId}-due-date-trigger` : 'due-date-trigger'}
                      variant="outline"
                      className={cn(
                        'h-10 sm:h-12 flex-1 justify-start text-left font-normal text-sm sm:text-base',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    data-testid={testId ? `${testId}-due-date-calendar` : 'due-date-calendar'}
                    disabled={date => isDateInPast(date)}
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                  />
                </PopoverContent>
              </Popover>
              {field.value && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  data-testid={testId ? `${testId}-due-date-clear-button` : 'due-date-clear-button'}
                  className="h-10 sm:h-12 w-10 sm:w-12 hover:bg-primary/10 hover:text-primary"
                  onClick={() => field.onChange(undefined)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
};
