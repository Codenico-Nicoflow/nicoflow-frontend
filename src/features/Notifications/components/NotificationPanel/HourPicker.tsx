import type { LucideIcon } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Renders a 24h hour as a locale-agnostic 12h label ("8:00 AM", "8:00 PM"). Kept
// simple + framework-agnostic so it survives the E-033 shared-package extraction.
export const formatHour = (hour: number): string => {
  const period = hour < 12 ? 'AM' : 'PM';
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:00 ${period}`;
};

interface HourPickerProps {
  icon: LucideIcon;
  label: string;
  help: string;
  value: number;
  hours: number[];
  disabled?: boolean;
  onChange: (hour: number) => void;
  testId?: string;
}

// One labelled hour dropdown: icon + label + help text + a Select of allowed hours.
export const HourPicker = ({ icon: Icon, label, help, value, hours, disabled, onChange, testId }: HourPickerProps) => (
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
              {formatHour(h)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <p className="ps-6.5 text-[11px] leading-snug text-muted-foreground/70">{help}</p>
  </div>
);
