import { useState } from 'react';

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { LazyIcon } from '@/components';
import { OptionalBadge } from '@/components/OptionalBadge';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, ICON_IDS, type IconId, iconLabel } from '@/lib/utils';

interface IconFieldProps<T extends FieldValues> {
  control: Control<T>;
  /** Optional label; when omitted the field renders without a label. */
  label?: string;
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
  const [open, setOpen] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => {
          const value = field.value as IconId | undefined;
          return (
            <FormItem data-testid={testId ? `${testId}-icon-item` : 'icon-item'}>
              {label && (
                <FormLabel
                  data-testid={testId ? `${testId}-icon-label` : 'icon-label'}
                  className="text-sm font-semibold text-foreground flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {label}
                  {optional && <OptionalBadge />}
                </FormLabel>
              )}
              <Popover open={open} onOpenChange={setOpen}>
                <FormControl>
                  <PopoverTrigger
                    type="button"
                    aria-label={value ? iconLabel(value) : label}
                    title={value ? iconLabel(value) : undefined}
                    data-testid={testId ? `${testId}-icon-trigger` : 'icon-trigger'}
                    className="flex h-10 w-10 items-center justify-center rounded-md border bg-transparent sm:h-12 sm:w-12 hover:border-primary transition-colors"
                  >
                    {value && <LazyIcon iconId={value} className="h-5 w-5" />}
                  </PopoverTrigger>
                </FormControl>
                <PopoverContent className="w-56" align="start">
                  <div
                    className="grid grid-cols-5 gap-2"
                    data-testid={testId ? `${testId}-icon-content` : 'icon-content'}
                  >
                    {ICON_IDS.map((iconId: IconId) => {
                      const selected = value === iconId;
                      return (
                        <button
                          key={iconId}
                          type="button"
                          aria-label={iconLabel(iconId)}
                          title={iconLabel(iconId)}
                          aria-pressed={selected}
                          onClick={() => {
                            field.onChange(iconId);
                            setOpen(false);
                          }}
                          className={cn(
                            'relative flex h-8 w-8 items-center justify-center rounded-md border text-foreground transition-transform hover:scale-110 hover:border-primary',
                            selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                          )}
                        >
                          <LazyIcon iconId={iconId} className="h-4 w-4" />
                          {selected && (
                            <Check className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary text-primary-foreground" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </motion.div>
  );
};
