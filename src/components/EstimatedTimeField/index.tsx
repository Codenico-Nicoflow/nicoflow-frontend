import { useId, useState } from 'react';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Clock, X } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';

import { formatCustomLabel, isPresetValue, MAX_MINUTES, MIN_MINUTES, TIME_PRESETS } from './presets';

const PRESET_LABEL_KEYS = {
  15: 'fields.estChips.15m',
  30: 'fields.estChips.30m',
  60: 'fields.estChips.1h',
  120: 'fields.estChips.2h',
  240: 'fields.estChips.4h',
  480: 'fields.estChips.8h',
} as const satisfies Record<number, string>;

interface EstimatedTimeFieldProps<T extends FieldValues> {
  control: Control<T>;
  label?: string;
  fieldName?: Path<T>;
  delay?: number;
  optional?: boolean;
  'data-testid'?: string;
}

export const EstimatedTimeField = <T extends FieldValues>({
  control,
  label,
  fieldName = 'estimatedMinutes' as Path<T>,
  delay = 0.25,
  optional = false,
  'data-testid': testId,
}: EstimatedTimeFieldProps<T>) => {
  const { t } = useTranslation('common');
  const reduce = useReducedMotion();
  const customInputId = useId();

  const {
    field,
    formState: { errors },
  } = useController({ control, name: fieldName });

  const value: number | null | undefined = field.value as number | null | undefined;
  const hasValue = value != null && value !== ('' as unknown);
  const isOffChip = hasValue && !isPresetValue(value);

  // tracks user intent to enter a custom value (off-chip values also open it)
  const [customOpen, setCustomOpen] = useState(isOffChip);

  const resolvedLabel = label ?? t('fields.estimatedTimeLabel');
  const minSuffix = t('fields.estChips.minSuffix');
  const hourSuffix = t('fields.estChips.hourSuffix');
  const tid = (suffix: string) => (testId ? `${testId}-${suffix}` : suffix);

  const isCustomActive = customOpen || isOffChip;

  const handlePresetClick = (minutes: number) => {
    setCustomOpen(false);
    field.onChange(minutes);
  };

  const handleCustomChipClick = () => {
    if (!isCustomActive) {
      setCustomOpen(true);
      field.onChange(undefined);
    }
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      field.onChange(undefined);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      field.onChange(parsed);
    }
  };

  const handleCustomBlur = () => {
    if (value != null && (value < MIN_MINUTES || value > MAX_MINUTES)) {
      field.onChange(Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, value)));
    }
    field.onBlur();
  };

  const handleClear = () => {
    setCustomOpen(false);
    field.onChange(null);
  };

  const hasError = Boolean(errors[fieldName]);

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={() => (
          <FormItem data-testid={tid('estimated-time-item')}>
            <FormLabel
              data-testid={tid('estimated-time-label')}
              className="text-sm font-semibold text-foreground flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              {resolvedLabel}
              {optional && <span className="text-xs text-muted-foreground font-normal">{t('fields.optional')}</span>}
            </FormLabel>

            <div role="group" aria-label={resolvedLabel} className="flex flex-wrap gap-2">
              {TIME_PRESETS.map(preset => {
                const isActive = value === preset.minutes;
                return (
                  <button
                    key={preset.minutes}
                    type="button"
                    data-testid={tid(`chip-${preset.minutes}`)}
                    aria-pressed={isActive}
                    onClick={() => handlePresetClick(preset.minutes)}
                    className={cn(
                      'h-8 px-3 rounded-md text-sm font-medium border transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {t(PRESET_LABEL_KEYS[preset.minutes as keyof typeof PRESET_LABEL_KEYS])}
                  </button>
                );
              })}

              <button
                type="button"
                data-testid={tid('chip-custom')}
                aria-pressed={isCustomActive}
                aria-controls={customInputId}
                aria-expanded={isCustomActive}
                onClick={handleCustomChipClick}
                className={cn(
                  'h-8 px-3 rounded-md text-sm font-medium border transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isCustomActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {isCustomActive && value != null
                  ? formatCustomLabel(value, minSuffix, hourSuffix)
                  : t('fields.estChips.custom')}
              </button>

              {hasValue && (
                <Button
                  type="button"
                  variant="outline"
                  data-testid={tid('estimated-time-clear-button')}
                  size="icon"
                  aria-label={t('fields.estChips.clear')}
                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary flex-shrink-0"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {isCustomActive && (
                <motion.div
                  key="custom-input"
                  id={customInputId}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="relative mt-2">
                    <FormControl>
                      <input
                        id={`${customInputId}-input`}
                        data-testid={tid('estimated-time-input')}
                        type="number"
                        min={MIN_MINUTES}
                        max={MAX_MINUTES}
                        value={value ?? ''}
                        onChange={handleCustomInput}
                        onBlur={handleCustomBlur}
                        name={field.name}
                        ref={field.ref}
                        aria-label={resolvedLabel}
                        aria-invalid={hasError}
                        className={cn(
                          'w-full h-10 rounded-md border border-input bg-background px-3 pe-14 text-sm',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                        )}
                      />
                    </FormControl>
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none select-none">
                      {minSuffix}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
};
