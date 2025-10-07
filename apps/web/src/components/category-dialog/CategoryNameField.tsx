import { motion } from 'framer-motion';
import { type Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tag } from 'lucide-react';

interface CategoryNameFieldProps {
  control: Control<{ name: string; icon: string }>;
}

const CategoryNameField = ({ control }: CategoryNameFieldProps) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Category Name
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Enter category name"
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

export default CategoryNameField;
