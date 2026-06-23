import { motion } from 'framer-motion';
import { ArrowUpDown } from 'lucide-react';
import { type Control, type FieldValues, type Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input.tsx';

interface AreaSortOrderFieldProps<T extends FieldValues> {
  control: Control<T>;
  fieldName?: Path<T>;
}

export const AreaSortOrderField = <T extends FieldValues>({
  control,
  fieldName = 'displayOrder' as Path<T>,
}: AreaSortOrderFieldProps<T>) => {
  const { t } = useTranslation('area');

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              {t('sortOrderField.label')}
              <span className="text-xs text-muted-foreground font-normal">{t('sortOrderField.optional')}</span>
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                placeholder="0"
                className="h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-primary transition-colors"
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
};
