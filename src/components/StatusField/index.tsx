import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Inbox, XCircle } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskStatus } from '@/lib/types';

const STATUS_OPTIONS = [
  { value: TaskStatus.INBOX, label: 'Inbox', icon: Inbox, dot: 'bg-muted-foreground' },
  { value: TaskStatus.ACTIVE, label: 'Active', icon: Circle, dot: 'bg-primary' },
  { value: TaskStatus.DONE, label: 'Done', icon: CheckCircle2, dot: 'bg-success' },
  { value: TaskStatus.CANCELLED, label: 'Cancelled', icon: XCircle, dot: 'bg-destructive' },
] as const;

interface StatusFieldProps<T extends FieldValues> {
  control: Control<T>;
  label?: string;
  fieldName?: Path<T>;
  delay?: number;
  optional?: boolean;
  'data-testid'?: string;
}

export const StatusField = <T extends FieldValues>({
  control,
  label = 'Status',
  fieldName = 'status' as Path<T>,
  delay = 0.2,
  optional = false,
  'data-testid': testId,
}: StatusFieldProps<T>) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem data-testid={testId ? `${testId}-status-item` : 'status-item'}>
            {label && (
              <FormLabel
                data-testid={testId ? `${testId}-status-label` : 'status-label'}
                className="text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <Circle className="h-4 w-4" />
                {label}
                {optional && <span className="text-xs text-muted-foreground font-normal">(Optional)</span>}
              </FormLabel>
            )}
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger
                  data-testid={testId ? `${testId}-status-trigger` : 'status-trigger'}
                  className="h-10 sm:h-12 text-sm sm:text-base"
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent data-testid={testId ? `${testId}-status-content` : 'status-content'}>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${option.dot}`} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
};
