import { motion } from 'framer-motion';
import { type Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Sparkles } from 'lucide-react';
import { type ProjectFormData } from '@my-monorepo/utils';
import IconPicker from './IconPicker';

interface ProjectIconFieldProps {
  control: Control<ProjectFormData>;
}

const ProjectIconField = ({ control }: ProjectIconFieldProps) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
      <FormField
        control={control}
        name="icon"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
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

export default ProjectIconField;
