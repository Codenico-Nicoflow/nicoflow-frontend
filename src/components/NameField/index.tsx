import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface NameFieldProps<T extends FieldValues> {
  control: Control<T>;
  label: string;
  icon: LucideIcon;
  placeholder: string;
  fieldName?: Path<T>;
  delay?: number;
}

export const NameField = <T extends FieldValues>({
  control,
  label,
  icon: Icon,
  placeholder,
  fieldName = 'name' as Path<T>,
  delay = 0.1,
}: NameFieldProps<T>) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={placeholder}
                className="h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-primary transition-colors"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
};
