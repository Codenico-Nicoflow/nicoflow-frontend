import { useState } from 'react';

import type { Editor } from '@tiptap/react';
import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DatePickerControlProps {
  editor: Editor;
  isActive: boolean;
}

// Pending i18n (notes.json has no "dateMention" key yet) — see NIC-1970 PR
// notes on avoiding another cross-repo publish round-trip for one label.
const INSERT_DATE_LABEL = 'Insert date';

// The toolbar affordance for inserting a dateMention (NIC-1971): Popover +
// shadcn's Calendar, the same primitive pair DueDateField already uses under
// its react-hook-form plumbing — reused directly here without that plumbing,
// since a toolbar insert has no form field to bind to. Calendar localizes
// itself from i18n internally, so no locale prop is threaded through here.
export const DatePickerControl = ({ editor, isActive }: DatePickerControlProps) => {
  const [open, setOpen] = useState(false);

  const pick = (date: Date | undefined) => {
    if (!date) return;
    editor.chain().focus().setNoteDateMention(format(date, 'yyyy-MM-dd')).run();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={INSERT_DATE_LABEL}
          aria-pressed={isActive}
          className={cn('h-8 w-8', isActive && 'bg-accent text-accent-foreground')}
          data-testid="note-date-mention-trigger"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={undefined} onSelect={pick} />
      </PopoverContent>
    </Popover>
  );
};
