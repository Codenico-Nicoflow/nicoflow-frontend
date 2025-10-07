import { motion } from 'framer-motion';
import { type Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { type ProjectFormData, isDateInPast } from '@my-monorepo/utils';

interface ProjectDueDateFieldProps {
  control: Control<ProjectFormData>;
}

const ProjectDueDateField = ({ control }: ProjectDueDateFieldProps) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
      <FormField
        control={control}
        name="dueDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Due Date
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </FormLabel>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'h-10 sm:h-12 flex-1 justify-start text-left font-normal border-2 focus:border-primary transition-colors text-sm sm:text-base',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    disabled={date => isDateInPast(date)}
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                  />
                </PopoverContent>
              </Popover>
              {field.value && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 sm:h-12 w-10 sm:w-12 border-2 hover:border-destructive hover:text-destructive transition-colors"
                  onClick={() => field.onChange(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
};

export default ProjectDueDateField;
