import { motion } from 'framer-motion';
import { Clock, X } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface EstimatedTimeFieldProps<T extends FieldValues> {
  control: Control<T>;
  label?: string;
  fieldName?: Path<T>;
  delay?: number;
  optional?: boolean;
  'data-testid'?: string;
}

export const EstimatedTimeField = <T extends FieldValues>({
  control,
  label = 'Estimated Time',
  fieldName = 'estimatedMinutes' as Path<T>,
  delay = 0.25,
  optional = false,
  'data-testid': testId,
}: EstimatedTimeFieldProps<T>) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem data-testid={testId ? `${testId}-estimated-time-item` : 'estimated-time-item'}>
            <FormLabel
              data-testid={testId ? `${testId}-estimated-time-label` : 'estimated-time-label'}
              className="text-sm font-semibold text-foreground flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              {label}
              {optional && <span className="text-xs text-muted-foreground font-normal">(Optional)</span>}
            </FormLabel>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FormControl>
                  <Input
                    data-testid={testId ? `${testId}-estimated-time-input` : 'estimated-time-input'}
                    type="number"
                    placeholder="Enter estimated time"
                    onChange={e => {
                      const value = e.target.value;
                      if (value === '' || value === null) {
                        field.onChange(undefined);
                      } else {
                        const parsed = parseInt(value);
                        field.onChange(isNaN(parsed) ? undefined : parsed);
                      }
                    }}
                    value={field.value ?? ''}
                    className="h-10 sm:h-12 pr-16 text-sm sm:text-base"
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-muted-foreground pointer-events-none">
                  super minutes
                </div>
              </div>
              {field.value && (
                <Button
                  type="button"
                  variant="outline"
                  data-testid={testId ? `${testId}-estimated-time-clear-button` : 'estimated-time-clear-button'}
                  size="icon"
                  className="h-10 sm:h-12 w-10 sm:w-12 hover:bg-primary/10 hover:text-primary flex-shrink-0"
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
