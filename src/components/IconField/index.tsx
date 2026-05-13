import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { LazyIcon } from '@/components';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ICON_IDS, type IconId } from '@/lib/utils';

interface IconFieldProps<T extends FieldValues> {
  control: Control<T>;
  label: string;
  fieldName?: Path<T>;
  delay?: number;
  optional?: boolean;
  'data-testid'?: string;
}

export const IconField = <T extends FieldValues>({
  control,
  label,
  fieldName = 'icon' as Path<T>,
  delay = 0.2,
  optional = false,
  'data-testid': testId,
}: IconFieldProps<T>) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem data-testid={testId ? `${testId}-icon-item` : 'icon-item'}>
            <FormLabel
              data-testid={testId ? `${testId}-icon-label` : 'icon-label'}
              className="text-sm font-semibold text-foreground flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {label}
              {optional && <span className="text-xs text-muted-foreground font-normal">(Optional)</span>}
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger
                  data-testid={testId ? `${testId}-icon-trigger` : 'icon-trigger'}
                  className="h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-primary transition-colors"
                >
                  <SelectValue>
                    {field.value && (
                      <div className="flex items-center gap-2">
                        <LazyIcon iconId={field.value as IconId} className="h-4 w-4" />
                        <span className="capitalize">{field.value.replace(/-/g, ' ')}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent data-testid={testId ? `${testId}-icon-content` : 'icon-content'} className="max-h-[300px]">
                {ICON_IDS.map((iconId: IconId) => (
                  <SelectItem key={iconId} value={iconId}>
                    <div className="flex items-center gap-2">
                      <LazyIcon iconId={iconId} className="h-4 w-4" />
                      <span className="capitalize">{iconId.replace(/-/g, ' ')}</span>
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
