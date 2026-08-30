import { Calendar } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

interface RecurrenceBodyProps {
  input: unknown;
}

const getString = (obj: unknown, key: string): string | undefined => {
  if (!obj || typeof obj !== 'object') return undefined;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === 'string' && v ? v : undefined;
};

const getNumber = (obj: unknown, key: string): number | undefined => {
  if (!obj || typeof obj !== 'object') return undefined;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === 'number' ? v : undefined;
};

const formatSchedule = (input: unknown): string => {
  const freq = getString(input, 'freq');
  const interval = getNumber(input, 'interval') ?? 1;
  const scheduledTime = getString(input, 'scheduledTime');

  const freqLabel = (() => {
    if (!freq) return '';
    switch (freq) {
      case 'daily':
        return interval === 1 ? 'Daily' : `Every ${interval} days`;
      case 'weekly':
        return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      case 'monthly':
        return interval === 1 ? 'Monthly' : `Every ${interval} months`;
      default:
        return freq;
    }
  })();

  if (scheduledTime) {
    const d = new Date(`1970-01-01T${scheduledTime}`);
    const timePart = isNaN(d.getTime())
      ? scheduledTime
      : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${freqLabel} at ${timePart}`;
  }
  return freqLabel;
};

export const RecurrenceBody = ({ input }: RecurrenceBodyProps) => {
  const schedule = formatSchedule(input);
  const startDate = getString(input, 'startDate');
  const endDate = getString(input, 'endDate');

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
      <Calendar className="size-3.5 shrink-0" aria-hidden />
      {schedule && <Badge variant="secondary">{schedule}</Badge>}
      {startDate && <span>from {startDate}</span>}
      {endDate && <span>until {endDate}</span>}
    </div>
  );
};
