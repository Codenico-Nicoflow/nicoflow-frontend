import { motion } from 'framer-motion';
import { Flag } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskPriority } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PriorityFieldProps<T extends FieldValues> {
  control: Control<T>;
  label?: string;
  fieldName?: Path<T>;
  delay?: number;
  optional?: boolean;
  'data-testid'?: string;
}

export const PriorityField = <T extends FieldValues>({
  control,
  label = 'Priority',
  fieldName = 'priority' as Path<T>,
  delay = 0.2,
  optional = false,
  'data-testid': testId,
}: PriorityFieldProps<T>) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem data-testid={testId ? `${testId}-priority-item` : 'priority-item'}>
            <FormLabel
              data-testid={testId ? `${testId}-priority-label` : 'priority-label'}
              className="text-sm font-semibold text-foreground flex items-center gap-2"
            >
              <Flag className="h-4 w-4" />
              {label}
              {optional && <span className="text-xs text-muted-foreground font-normal">(Optional)</span>}
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger
                  data-testid={testId ? `${testId}-priority-trigger` : 'priority-trigger'}
                  className="h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-primary transition-colors"
                >
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
              </FormControl>
              <SelectContent data-testid={testId ? `${testId}-priority-content` : 'priority-content'}>
                <SelectItem value={TaskPriority.LOW}>
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full bg-green-500')} />
                    <span>Low</span>
                  </div>
                </SelectItem>
                <SelectItem value={TaskPriority.MEDIUM}>
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full bg-yellow-500')} />
                    <span>Medium</span>
                  </div>
                </SelectItem>
                <SelectItem value={TaskPriority.HIGH}>
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full bg-red-500')} />
                    <span>High</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
};
