import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { type Control } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { useGetAreasQuery } from '@/lib/store';
import type { ProjectFormData } from '@/lib/utils';
import { capitalize } from '@/lib/utils';

interface ProjectAreaFieldProps {
  control: Control<ProjectFormData>;
}

export const ProjectAreaField = ({ control }: ProjectAreaFieldProps) => {
  const { data: areas } = useGetAreasQuery();

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
      <FormField
        control={control}
        name="areaId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Area
            </FormLabel>
            <Select onValueChange={value => field.onChange(Number(value))} value={field.value?.toString()}>
              <FormControl>
                <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-primary transition-colors">
                  <SelectValue placeholder="Choose an area for your project" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {areas?.map(area => (
                  <SelectItem key={area.id} value={area.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {capitalize(area.name)}
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
