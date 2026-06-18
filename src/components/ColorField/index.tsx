import { useState } from 'react';

import { motion } from 'framer-motion';
import { Check, Palette } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Curated presets that harmonize with the theme; first is the theme primary.
// Users can still pick any color via the native input. Each has a friendly
// name so the trigger reads "Indigo" rather than "#4F46E5".
const PRESET_COLORS = [
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Ember', value: '#c4622d' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Periwinkle', value: '#6366f1' },
  { name: 'Slate', value: '#64748b' },
] as const;

// Map a value to its preset name; fall back to the uppercased hex for custom picks.
const colorLabel = (value: string): string =>
  PRESET_COLORS.find(c => c.value.toLowerCase() === value.toLowerCase())?.name ?? value.toUpperCase();

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
                    <span className="tracking-wide text-muted-foreground">{colorLabel(value)}</span>
                  </PopoverTrigger>
                </FormControl>
                <PopoverContent className="w-56" align="start">
                  <div className="grid grid-cols-5 gap-2" data-testid="color-swatches">
                    {PRESET_COLORS.map(color => {
                      const selected = value.toLowerCase() === color.value.toLowerCase();
                      return (
                        <button
                          key={color.value}
                          type="button"
                          aria-label={color.name}
                          title={color.name}
                          aria-pressed={selected}
                          onClick={() => {
                            field.onChange(color.value);
                            setOpen(false);
                          }}
                          className={cn(
                            'relative flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-transform hover:scale-110',
                            selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                          )}
                          style={{ backgroundColor: color.value }}
                        >
                          {selected && <Check className="h-4 w-4 text-white drop-shadow" />}
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
