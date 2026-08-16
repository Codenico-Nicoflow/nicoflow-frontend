import { useEffect, useMemo, useRef, useState } from 'react';

import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Loader2, PencilLine, X } from 'lucide-react';
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

interface DueDateFieldProps<T extends FieldValues> {
  control: Control<T>;
  label?: string;
  fieldName?: Path<T>;
  delay?: number;
  optional?: boolean;
  'data-testid'?: string;
}

// Locales the backend NLP parser (olebedev/when) actually understands. Hebrew
// has no rule set there, so the text-input toggle is hidden entirely for it —
// it can never succeed and a silent low-confidence result would be confusing.
const NLP_SUPPORTED_LANGUAGES = new Set<string>(['en', 'ru']);

// Parses a "YYYY-MM-DD" response into a local calendar Date without a UTC
// round-trip — `new Date("YYYY-MM-DD")` parses as UTC midnight, which shifts
// a day in negative-offset timezones.
function parseISODateLocal(iso: string): Date {
  const parts = iso.split('-').map(Number);
  const [year, month, day] = [parts[0] ?? 0, parts[1] ?? 1, parts[2] ?? 1];
  return new Date(year, month - 1, day);
}

interface NLPResult {
  date: string;
  display: string;
  confidence: 'high' | 'low';
}

export const DueDateField = <T extends FieldValues>({
  control,
  label,
  fieldName = 'dueDate' as Path<T>,
  delay = 0.2,
  optional = false,
  'data-testid': testId,
}: DueDateFieldProps<T>) => {
  const { t, i18n } = useTranslation('common');
  const resolvedLabel = label ?? t('fields.dueDateLabel');
  const dateLocale = getDateLocale(i18n.language);
  const nlpEnabled = NLP_SUPPORTED_LANGUAGES.has(i18n.language);

  const [mode, setMode] = useState<'calendar' | 'text'>('calendar');
  const [text, setText] = useState('');
  const debouncedText = useDebouncedValue(text, 400);
  const [parseNLPDate, { isLoading: isParsing }] = useParseNLPDateMutation();
  const [result, setResult] = useState<NLPResult | null>(null);

  const testPrefix = testId ? `${testId}-due-date` : 'due-date';
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  // requestSeq guards against a stale response landing after the user kept
  // typing — only the reply matching the most recent request is applied.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- parseNLPDate identity is stable per RTK Query
  }, [debouncedText, mode, tz, i18n.language]);

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => {
          const confirmDate = (iso: string) => {
            field.onChange(parseISODateLocal(iso));
            setMode('calendar');
            setText('');
            setResult(null);
          };

          return (
            <FormItem data-testid={`${testPrefix}-item`} className="flex flex-col">
              <FormLabel
                data-testid={`${testPrefix}-label`}
                className="text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                {resolvedLabel}
                {optional && <OptionalBadge />}
              </FormLabel>

              {mode === 'calendar' ? (
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          data-testid={`${testPrefix}-trigger`}
                          variant="outline"
                          className={cn(
                            'h-10 sm:h-12 flex-1 justify-start text-start font-normal text-sm sm:text-base',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="me-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP', { locale: dateLocale }) : t('fields.pickDate')}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        data-testid={`${testPrefix}-calendar`}
                        disabled={date => isDateInPast(date)}
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                  {field.value != null && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      data-testid={`${testPrefix}-clear-button`}
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
                      data-testid={`${testPrefix}-nlp-toggle`}
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
                          data-testid={`${testPrefix}-nlp-input`}
                          placeholder={t('fields.nlpPlaceholder')}
                          className="h-10 sm:h-12"
                          value={text}
                          onChange={e => {
                            setText(e.target.value);
                            // Clear synchronously, not after the debounce settles —
                            // a stale chip must never persist through a keystroke.
                            setResult(null);
                          }}
                        />
                      </FormControl>
                      {isParsing && (
                        <Loader2
                          data-testid={`${testPrefix}-nlp-spinner`}
                          className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      data-testid={`${testPrefix}-calendar-toggle`}
                      aria-label={t('fields.switchToCalendar')}
                      className="h-10 sm:h-12 w-10 sm:w-12"
                      onClick={() => {
                        setMode('calendar');
                        setText('');
                        setResult(null);
                      }}
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  {result?.confidence === 'high' && !isParsing && (
                    <div
                      data-testid={`${testPrefix}-nlp-chip`}
                      className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm"
                    >
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{format(parseISODateLocal(result.date), 'PPP', { locale: dateLocale })}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        data-testid={`${testPrefix}-nlp-confirm`}
                        onClick={() => confirmDate(result.date)}
                      >
                        {t('fields.nlpYes')}
                      </Button>
                    </div>
                  )}

                  {result?.confidence === 'low' && !isParsing && (
                    <div
                      data-testid={`${testPrefix}-nlp-did-you-mean`}
                      className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm"
                    >
                      <span>{t('fields.nlpDidYouMean', { date: result.display })}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        data-testid={`${testPrefix}-nlp-no`}
                        onClick={() => setResult(null)}
                      >
                        {t('fields.nlpNo')}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <FormMessage />
            </FormItem>
          );
        }}
      />
    </motion.div>
  );
};
