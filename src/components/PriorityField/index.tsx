import { TaskPriority } from '@nicoflow/shared/types';
import { motion } from 'framer-motion';
import { Flag } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  label,
  fieldName = 'priority' as Path<T>,
  delay = 0.2,
  optional = false,
  'data-testid': testId,
}: PriorityFieldProps<T>) => {
  const { t } = useTranslation(['common', 'task']);
  const resolvedLabel = label ?? t('common:fields.priorityLabel');
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
              {resolvedLabel}
              {optional && (
                <span className="text-xs text-muted-foreground font-normal">{t('common:fields.optional')}</span>
              )}
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger
                  data-testid={testId ? `${testId}-priority-trigger` : 'priority-trigger'}
                  className="h-10 sm:h-12 text-sm sm:text-base"
                >
                  <SelectValue placeholder={t('common:fields.priorityPlaceholder')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent data-testid={testId ? `${testId}-priority-content` : 'priority-content'}>
                <SelectItem value={TaskPriority.LOW}>
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full bg-success')} />
                    <span>{t('task:priority.low')}</span>
                  </div>
                </SelectItem>
                <SelectItem value={TaskPriority.MEDIUM}>
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full bg-warning')} />
                    <span>{t('task:priority.medium')}</span>
                  </div>
                </SelectItem>
                <SelectItem value={TaskPriority.HIGH}>
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full bg-destructive')} />
                    <span>{t('task:priority.high')}</span>
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
