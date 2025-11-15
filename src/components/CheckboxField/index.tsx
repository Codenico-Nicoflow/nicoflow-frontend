import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';

interface CheckboxFieldProps<T extends FieldValues> {
  control: Control<T>;
  label: string;
  description?: string;
  icon: LucideIcon;
  fieldName: Path<T>;
  delay?: number;
}

export const CheckboxField = <T extends FieldValues>({
  control,
  label,
  description,
  icon: Icon,
  fieldName,
  delay = 0.4,
}: CheckboxFieldProps<T>) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-accent/10 to-secondary/10 border border-accent/20">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
                <Icon className="h-4 w-4 text-accent" />
                {label}
              </FormLabel>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          </FormItem>
        )}
      />
    </motion.div>
  );
};
