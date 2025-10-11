import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { type Control } from 'react-hook-form';

import type { ICategory } from '@my-monorepo/types';

import IconPicker from '@/components/project-dialog/IconPicker';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface CategoryIconFieldProps {
  control: Control<ICategory>;
}

const CategoryIconField = ({ control }: CategoryIconFieldProps) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
      <FormField
        control={control}
        name="icon"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Category Icon
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

export default CategoryIconField;
