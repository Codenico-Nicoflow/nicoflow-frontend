import { useEffect, useMemo, useRef, useState } from 'react';

import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { CalendarClock, Loader2, PencilLine, X } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { OptionalBadge } from '@/components/OptionalBadge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getDateLocale } from '@/lib/i18n/dateLocale';
import type { NLPDateLocale } from '@/lib/store';
import { useParseNLPDateMutation } from '@/lib/store';
import { cn, isDateInPast } from '@/lib/utils';

interface ScheduledForFieldProps<T extends FieldValues> {
  control: Control<T>;
  label?: string;
  fieldName?: Path<T>;
  delay?: number;
  optional?: boolean;
  'data-testid'?: string;
}

// Locales the backend NLP parser (olebedev/when) actually understands. Hebrew
// has no rule set there, so the text-input toggle is hidden entirely for it.
const NLP_SUPPORTED_LANGUAGES = new Set<string>(['en', 'ru']);

interface NLPResult {
  date: string;
  display: string;
  confidence: 'high' | 'low';
}

/**
 * Soft scheduling intention. Unlike DueDateField (a hard deadline held as a
 * Date), this emits a bare ISO date string "YYYY-MM-DD" — the wire shape the
 * backend expects (SPEC §3.4). A past value is allowed: roll-forward, not
 * overdue, is the model. No red styling here; tone lives in TaskItem.
 */
export const ScheduledForField = <T extends FieldValues>({
  control,
  label,
  fieldName = 'scheduledFor' as Path<T>,
  delay = 0.2,
  optional = true,
  'data-testid': testId,
}: ScheduledForFieldProps<T>) => {
  const { t, i18n } = useTranslation('common');
  const resolvedLabel = label ?? t('fields.scheduledForLabel');
  const dateLocale = getDateLocale(i18n.language);
  const base = testId ?? 'scheduled-for';
  const nlpEnabled = NLP_SUPPORTED_LANGUAGES.has(i18n.language);

  const [mode, setMode] = useState<'calendar' | 'text'>('calendar');
  const [text, setText] = useState('');
  const debouncedText = useDebouncedValue(text, 400);
  const [parseNLPDate, { isLoading: isParsing }] = useParseNLPDateMutation();
  const [result, setResult] = useState<NLPResult | null>(null);

  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const requestSeq = useRef(0);

  useEffect(() => {
    if (mode !== 'text') return;
    setResult(null);
    if (!debouncedText.trim()) return;

    const seq = ++requestSeq.current;
    parseNLPDate({ text: debouncedText, timezone: tz, locale: i18n.language as NLPDateLocale })
      .unwrap()
      .then(res => {
        if (seq !== requestSeq.current) return;
        setResult(
          res.date
            ? { date: res.date, display: res.display ?? debouncedText, confidence: 'high' }
            : { date: '', display: debouncedText, confidence: 'low' }
        );
      })
      .catch(() => {
        // Silent by design (AC3) — no toast, no chip, input stays usable.
      });
  }, [debouncedText, mode, tz, i18n.language, parseNLPDate]);

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => {
          const selectedDate = field.value ? parseISO(field.value as string) : undefined;

          const confirmDate = (iso: string) => {
            field.onChange(iso);
            setMode('calendar');
            setText('');
            setResult(null);
          };

          return (
            <FormItem data-testid={`${base}-item`} className="flex flex-col">
              <FormLabel
                data-testid={`${base}-label`}
                className="text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <CalendarClock className="h-4 w-4" />
                {resolvedLabel}
                {optional && <OptionalBadge />}
              </FormLabel>

              {mode === 'calendar' ? (
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          data-testid={`${base}-trigger`}
                          variant="outline"
                          className={cn(
                            'h-10 sm:h-12 flex-1 justify-start text-start font-normal text-sm sm:text-base',
                            !selectedDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarClock className="me-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, 'PPP', { locale: dateLocale }) : t('fields.pickDate')}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        disabled={date => isDateInPast(date)}
                        data-testid={`${base}-calendar`}
                        mode="single"
                        selected={selectedDate}
                        onSelect={date => field.onChange(date ? format(date, 'yyyy-MM-dd') : null)}
                      />
                    </PopoverContent>
                  </Popover>
                  {selectedDate && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      data-testid={`${base}-clear-button`}
                      className="h-10 sm:h-12 w-10 sm:w-12 hover:bg-primary/10 hover:text-primary"
                      onClick={() => field.onChange(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {nlpEnabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      data-testid={`${base}-nlp-toggle`}
                      aria-label={t('fields.switchToTextInput')}
                      className="h-10 sm:h-12 w-10 sm:w-12"
                      onClick={() => setMode('text')}
                    >
                      <PencilLine className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FormControl>
                        <Input
                          data-testid={`${base}-nlp-input`}
                          placeholder={t('fields.nlpPlaceholder')}
                          className="h-10 sm:h-12"
                          value={text}
                          onChange={e => {
                            setText(e.target.value);
                            setResult(null);
                          }}
                        />
                      </FormControl>
                      {isParsing && (
                        <Loader2
                          data-testid={`${base}-nlp-spinner`}
                          className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      data-testid={`${base}-calendar-toggle`}
                      aria-label={t('fields.switchToCalendar')}
                      className="h-10 sm:h-12 w-10 sm:w-12"
                      onClick={() => {
                        setMode('calendar');
                        setText('');
                        setResult(null);
                      }}
                    >
                      <CalendarClock className="h-4 w-4" />
                    </Button>
                  </div>

                  {result?.confidence === 'high' && !isParsing && (
                    <div
                      data-testid={`${base}-nlp-chip`}
                      className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm"
                    >
                      <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{format(parseISO(result.date), 'PPP', { locale: dateLocale })}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        data-testid={`${base}-nlp-confirm`}
                        onClick={() => confirmDate(result.date)}
                      >
                        {t('fields.nlpYes')}
                      </Button>
                    </div>
                  )}

                  {result?.confidence === 'low' && !isParsing && (
                    <div
                      data-testid={`${base}-nlp-did-you-mean`}
                      className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm"
                    >
                      <span>{t('fields.nlpDidYouMean', { date: result.display })}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        data-testid={`${base}-nlp-no`}
                        onClick={() => setResult(null)}
                      >
                        {t('fields.nlpNo')}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground">{t('fields.scheduledForHint')}</p>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </motion.div>
  );
};
