import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { ICON_IDS, type IconId } from '@my-monorepo/utils';

import { LazyIcon } from '@/components/LazyIcon';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-primary transition-colors">
                  <SelectValue>
                    {field.value && (
                      <div className="flex items-center gap-2">
                        <LazyIcon iconId={field.value as IconId} className="h-4 w-4" />
                        <span className="capitalize">{field.value.replace(/-/g, ' ')}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-h-[300px]">
                {ICON_IDS.map(iconId => (
                  <SelectItem key={iconId} value={iconId}>
                    <div className="flex items-center gap-2">
                      <LazyIcon iconId={iconId} className="h-4 w-4" />
                      <span className="capitalize">{iconId.replace(/-/g, ' ')}</span>
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

export default IconField;
