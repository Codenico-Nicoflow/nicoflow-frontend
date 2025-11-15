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
}

export const EstimatedTimeField = <T extends FieldValues>({
  control,
  label = 'Estimated Time',
  fieldName = 'estimatedMinutes' as Path<T>,
  delay = 0.25,
}: EstimatedTimeFieldProps<T>) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {label}
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </FormLabel>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FormControl>
                  <Input
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
                    className="h-10 sm:h-12 pr-16 text-sm sm:text-base border-2 focus:border-primary transition-colors"
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-muted-foreground pointer-events-none">
                  minutes
                </div>
              </div>
              {field.value && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 sm:h-12 w-10 sm:w-12 border-2 hover:border-destructive hover:text-destructive transition-colors flex-shrink-0"
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
