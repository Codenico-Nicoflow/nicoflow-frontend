import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';

import { DEFAULT_ENERGY, ENERGY_OPTIONS } from './energy';

interface EnergyFieldProps<T extends FieldValues> {
  control: Control<T>;
  label?: string;
  fieldName?: Path<T>;
  delay?: number;
  optional?: boolean;
  'data-testid'?: string;
}

/**
 * Energy is the focus cost of a task. A three-segment Low · Medium · Deep
 * control modeled on PriorityField's prop API, so it drops into the same
 * dialogs. Defaults to medium when the form has no value yet.
 */
export const EnergyField = <T extends FieldValues>({
  control,
  label,
  fieldName = 'energy' as Path<T>,
  delay = 0.2,
  optional = false,
  'data-testid': testId,
}: EnergyFieldProps<T>) => {
  const { t } = useTranslation(['common', 'task']);
  const resolvedLabel = label ?? t('common:fields.energyLabel');
  const base = testId ?? 'energy';

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => {
          // Treat empty/unset as the default so a fresh form shows medium selected.
          const current = field.value || DEFAULT_ENERGY;
          return (
            <FormItem data-testid={`${base}-item`}>
              <FormLabel
                data-testid={`${base}-label`}
                className="text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {resolvedLabel}
                {optional && (
                  <span className="text-xs text-muted-foreground font-normal">{t('common:fields.optional')}</span>
                )}
              </FormLabel>
              <FormControl>
                <div
                  role="radiogroup"
                  aria-label={resolvedLabel}
                  data-testid={`${base}-group`}
                  className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
                >
                  {ENERGY_OPTIONS.map(({ value, icon: Icon, labelKey, colorClass }) => {
                    const selected = current === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        data-testid={`${base}-option-${value}`}
                        onClick={() => field.onChange(value)}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selected
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Icon className={cn('h-4 w-4', selected && colorClass)} aria-hidden />
                        <span>{t(labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </motion.div>
  );
};
