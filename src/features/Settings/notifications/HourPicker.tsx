import type { LucideIcon } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Renders a 24h hour in the given locale's own convention — English gets "8:00 AM",
// he/ru get their 24h form ("8:00", "20:00"). Uses Intl so we never hardcode AM/PM.
export const formatHour = (hour: number, locale: string): string =>
  new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, hour, 0));

interface HourPickerProps {
  icon: LucideIcon;
  label: string;
  help: string;
  value: number;
  hours: number[];
  locale: string;
  disabled?: boolean;
  onChange: (hour: number) => void;
  testId?: string;
}

// One labelled hour dropdown: icon + label + help text + a Select of allowed hours.
export const HourPicker = ({
  icon: Icon,
  label,
  help,
  value,
  hours,
  locale,
  disabled,
  onChange,
  testId,
}: HourPickerProps) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-2.5">
      <Icon aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 text-xs text-muted-foreground">{label}</span>
      <Select value={String(value)} disabled={disabled} onValueChange={v => onChange(Number(v))}>
        <SelectTrigger className="h-7 w-24 text-xs" aria-label={label} data-testid={testId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {hours.map(h => (
            <SelectItem key={h} value={String(h)} className="text-xs">
              {formatHour(h, locale)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <p className="ps-[1.625rem] text-[11px] leading-snug text-muted-foreground/70">{help}</p>
  </div>
);
