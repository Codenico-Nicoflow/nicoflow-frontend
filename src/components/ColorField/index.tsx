import { useState } from 'react';

import { motion } from 'framer-motion';
import { Check, Palette } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Curated presets that harmonize with the warm theme; first is the API default,
// second the ember primary. Users can still pick any color via the native input.
const PRESET_COLORS = [
  '#4f46e5', // indigo (theme primary)
  '#3B82F6', // blue
  '#c4622d', // ember
  '#10B981', // emerald
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#F59E0B', // amber
  '#EF4444', // red
  '#14B8A6', // teal
  '#6366F1', // indigo
  '#64748B', // slate
] as const;

interface ColorFieldProps<T extends FieldValues> {
  control: Control<T>;
  label?: string;
  fieldName?: Path<T>;
  delay?: number;
  'data-testid'?: string;
}

export const ColorField = <T extends FieldValues>({
  control,
  label = 'Color',
  fieldName = 'color' as Path<T>,
  delay = 0.15,
  'data-testid': testId,
}: ColorFieldProps<T>) => {
  const [open, setOpen] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => {
          const value = (field.value as string) || '#3B82F6';
          return (
            <FormItem data-testid={testId ? `${testId}-color-item` : 'color-item'}>
              <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Palette className="h-4 w-4" />
                {label}
              </FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <FormControl>
                  <PopoverTrigger
                    type="button"
                    data-testid={testId ? `${testId}-color-trigger` : 'color-trigger'}
                    className="flex h-10 w-full items-center gap-3 rounded-md border bg-transparent px-3 text-sm sm:h-12 hover:border-primary transition-colors"
                  >
                    <span
                      className="h-5 w-5 rounded-full border shadow-sm"
                      style={{ backgroundColor: value }}
                      aria-hidden="true"
                    />
                    <span className="uppercase tracking-wide text-muted-foreground">{value}</span>
                  </PopoverTrigger>
                </FormControl>
                <PopoverContent className="w-56" align="start">
                  <div className="grid grid-cols-5 gap-2" data-testid="color-swatches">
                    {PRESET_COLORS.map(color => {
                      const selected = value.toLowerCase() === color.toLowerCase();
                      return (
                        <button
                          key={color}
                          type="button"
                          aria-label={color}
                          aria-pressed={selected}
                          onClick={() => {
                            field.onChange(color);
                            setOpen(false);
                          }}
                          className={cn(
                            'relative flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-transform hover:scale-110',
                            selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                          )}
                          style={{ backgroundColor: color }}
                        >
                          {selected && <Check className="h-4 w-4 text-white drop-shadow" />}
                        </button>
                      );
                    })}
                  </div>
                  <label className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    Custom
                    <input
                      type="color"
                      value={value}
                      onChange={e => field.onChange(e.target.value)}
                      className="h-7 w-10 cursor-pointer rounded border bg-transparent"
                      data-testid="color-custom-input"
                    />
                  </label>
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
