import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import IconPicker from '@/components/ui/icon-picker';

interface IconFieldProps<T extends FieldValues> {
  control: Control<T>;
  label: string;
  fieldName?: Path<T>;
  delay?: number;
}

const IconField = <T extends FieldValues>({
  control,
  label,
  fieldName = 'icon' as Path<T>,
  delay = 0.2,
}: IconFieldProps<T>) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {label}
            </FormLabel>
            <FormControl>
              <IconPicker
                value={field.value}
                onChange={field.onChange}
                className="h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-primary transition-colors"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
};

export default IconField;
