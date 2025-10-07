import { motion } from 'framer-motion';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Palette } from 'lucide-react';
import { type Control } from 'react-hook-form';
import { type ProjectFormData } from '@my-monorepo/store';
import IconPicker from './IconPicker';

interface NewProjectIconFieldProps {
  control: Control<ProjectFormData>;
}

const NewProjectIconField = ({ control }: NewProjectIconFieldProps) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
      <FormField
        control={control}
        name="icon"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Project Icon
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

export default NewProjectIconField;
