import { motion } from 'framer-motion';
import { type Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FolderOpen } from 'lucide-react';
import { type ProjectFormData } from '@my-monorepo/utils';

interface ProjectNameFieldProps {
  control: Control<ProjectFormData>;
}

const ProjectNameField = ({ control }: ProjectNameFieldProps) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Project Name
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Enter your project name"
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

export default ProjectNameField;
