import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { OptionalBadge } from '@/components/OptionalBadge';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';

interface CheckboxFieldProps<T extends FieldValues> {
  control: Control<T>;
  label: string;
  description?: string;
  icon: LucideIcon;
  fieldName: Path<T>;
  delay?: number;
  'data-testid'?: string;
  optional?: boolean;
}

export const CheckboxField = <T extends FieldValues>({
  control,
  label,
  description,
  icon: Icon,
  fieldName,
  delay = 0.4,
  'data-testid': testId,
  optional = false,
}: CheckboxFieldProps<T>) => {
  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
          <FormItem>
            <FormLabel className="flex flex-row items-center space-x-3 space-y-0 p-3 sm:p-4 rounded-lg bg-muted/40 border border-border hover:bg-primary/10 cursor-pointer transition-colors">
              <FormControl>
                <Checkbox
                  data-testid={testId ? `${testId}-checkbox` : 'checkbox'}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </FormControl>
              <Icon className="h-4 w-4 text-primary" />
              <span className="flex flex-col gap-1 leading-none">
                <div>
                  {label} {optional && <OptionalBadge />}
                </div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
              </span>
            </FormLabel>
          </FormItem>
        </motion.div>
      )}
    />
  );
};
