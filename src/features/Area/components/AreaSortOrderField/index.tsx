import { motion } from 'framer-motion';
import { ArrowUpDown } from 'lucide-react';
import { type Control } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input.tsx';
import type { IArea } from '@/lib/types';

interface AreaSortOrderFieldProps {
  control: Control<IArea>;
}

export const AreaSortOrderField = ({ control }: AreaSortOrderFieldProps) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
      <FormField
        control={control}
        name="sortOrder"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort Order
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                placeholder="0"
                className="h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-primary transition-colors"
                {...field}
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
