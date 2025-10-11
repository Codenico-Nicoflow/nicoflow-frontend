import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { type Control } from 'react-hook-form';

import { type ProjectFormData } from '@my-monorepo/store';
import { isDateInPast } from '@my-monorepo/store';

import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface NewProjectDueDateFieldProps {
  control: Control<ProjectFormData>;
}

const NewProjectDueDateField = ({ control }: NewProjectDueDateFieldProps) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
      <FormField
        control={control}
        name="dueDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      'h-10 sm:h-12 w-full justify-start text-left font-normal border-2 focus:border-primary transition-colors text-sm sm:text-base',
                      !field.value && 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {field.value ? field.value.toLocaleDateString() : 'Pick a date'}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={date => isDateInPast(date)}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
};

export default NewProjectDueDateField;
