import { motion } from 'framer-motion';
import { Link, X } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface UrlFieldProps<T extends FieldValues> {
  control: Control<T>;
  label?: string;
  fieldName?: Path<T>;
  delay?: number;
  optional?: boolean;
  'data-testid'?: string;
}

export const UrlField = <T extends FieldValues>({
  control,
  label = 'URL',
  fieldName = 'url' as Path<T>,
  delay = 0.3,
  optional = false,
  'data-testid': testId,
}: UrlFieldProps<T>) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem data-testid={testId ? `${testId}-url-item` : 'url-item'}>
            <FormLabel
              data-testid={testId ? `${testId}-url-label` : 'url-label'}
              className="text-sm font-semibold text-foreground flex items-center gap-2"
            >
              <Link className="h-4 w-4" />
              {label}
              {optional && <span className="text-xs text-muted-foreground font-normal">(Optional)</span>}
            </FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input
                  data-testid={testId ? `${testId}-url-input` : 'url-input'}
                  type="url"
                  placeholder="https://example.com"
                  className="h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-primary transition-colors"
                  {...field}
                />
              </FormControl>
              {field.value && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  data-testid={testId ? `${testId}-url-clear-button` : 'url-clear-button'}
                  className="h-10 sm:h-12 w-10 sm:w-12 border-2 hover:bg-primary/20 hover:text-primary transition-colors flex-shrink-0"
                  onClick={() => field.onChange(undefined)}
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
