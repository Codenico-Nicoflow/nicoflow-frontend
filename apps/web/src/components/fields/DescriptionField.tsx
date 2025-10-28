import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

interface DescriptionFieldProps<T extends FieldValues> {
  control: Control<T>;
  label: string;
  placeholder: string;
  fieldName?: Path<T>;
  minHeight?: string;
  delay?: number;
  optional?: boolean;
}

const DescriptionField = <T extends FieldValues>({
  control,
  label,
  placeholder,
  fieldName = 'description' as Path<T>,
  minHeight = '100px',
  delay = 0.15,
  optional = false,
}: DescriptionFieldProps<T>) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {label}
              {optional && <span className="text-xs text-muted-foreground font-normal">(Optional)</span>}
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder={placeholder}
                className="resize-none text-sm sm:text-base border-2 focus:border-primary transition-colors"
                style={{ minHeight }}
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

export default DescriptionField;
