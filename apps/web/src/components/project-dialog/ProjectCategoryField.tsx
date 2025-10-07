import { motion } from 'framer-motion';
import { type Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles } from 'lucide-react';
import type { ProjectFormData } from '@my-monorepo/utils';
import { useGetCategoriesQuery } from '@my-monorepo/store';
import { capitalize } from '@my-monorepo/utils';

interface ProjectCategoryFieldProps {
  control: Control<ProjectFormData>;
}

const ProjectCategoryField = ({ control }: ProjectCategoryFieldProps) => {
  const { data: categories } = useGetCategoriesQuery();

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
      <FormField
        control={control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Category
            </FormLabel>
            <Select onValueChange={value => field.onChange(Number(value))} value={field.value?.toString()}>
              <FormControl>
                <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-primary transition-colors">
                  <SelectValue placeholder="Choose a category for your project" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categories?.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {capitalize(category.name)}
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

export default ProjectCategoryField;
