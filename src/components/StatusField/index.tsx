import { TaskStatus } from '@nicoflow/shared/types';
import { motion } from 'framer-motion';
import { CheckCircle, CheckCircle2, Circle, XCircle } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// `labelKey` points at a `task` namespace key resolved at render so the option
// labels localize with the active language.
const STATUS_OPTIONS = [
  { value: TaskStatus.ACTIVE, labelKey: 'status.active', icon: Circle, dot: 'bg-primary' },
  { value: TaskStatus.DONE, labelKey: 'status.done', icon: CheckCircle2, dot: 'bg-success' },
  { value: TaskStatus.CANCELLED, labelKey: 'status.cancelled', icon: XCircle, dot: 'bg-destructive' },
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
  label,
  fieldName = 'status' as Path<T>,
  delay = 0.2,
  optional = false,
  'data-testid': testId,
}: StatusFieldProps<T>) => {
  const { t } = useTranslation(['common', 'task']);
  const resolvedLabel = label ?? t('common:fields.statusLabel');
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem data-testid={testId ? `${testId}-status-item` : 'status-item'}>
            {label !== '' && (
              <FormLabel
                data-testid={testId ? `${testId}-status-label` : 'status-label'}
                className="text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {resolvedLabel}
                {optional && (
                  <span className="text-xs text-muted-foreground font-normal">{t('common:fields.optional')}</span>
                )}
              </FormLabel>
            )}
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger
                  data-testid={testId ? `${testId}-status-trigger` : 'status-trigger'}
                  className="h-10 sm:h-12 text-sm sm:text-base"
                >
                  <SelectValue placeholder={t('common:fields.statusPlaceholder')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent data-testid={testId ? `${testId}-status-content` : 'status-content'}>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${option.dot}`} />
                      <span>{t(`task:${option.labelKey}`)}</span>
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
