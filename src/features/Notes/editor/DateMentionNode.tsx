import { useState } from 'react';

import { Node } from '@tiptap/core';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getDateLocale } from '@/lib/i18n/dateLocale';

// "YYYY-MM-DD" -> local Date without a UTC round-trip. `new Date("YYYY-MM-DD")`
// parses as UTC midnight, which shifts a day in negative-offset timezones —
// same trap DueDateField guards against, same fix.
export function parseISODateLocal(iso: string): Date {
  const parts = iso.split('-').map(Number);
  const [year, month, day] = [parts[0] ?? 0, parts[1] ?? 1, parts[2] ?? 1];
  return new Date(year, month - 1, day);
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteDateMention: {
      setNoteDateMention: (isoDate: string) => ReturnType;
    };
  }
}

const DateMentionView = ({ node, updateAttributes }: NodeViewProps) => {
  const { i18n } = useTranslation('notes');
  const [open, setOpen] = useState(false);
  const iso = node.attrs.date as string;
  const dateLocale = getDateLocale(i18n.language);
  const display = format(parseISODateLocal(iso), 'PPP', { locale: dateLocale });

  return (
    <NodeViewWrapper as="span" data-note-date-mention="" data-testid="note-date-mention" className="inline-block">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            contentEditable={false}
            // Pending i18n (notes.json has no "editDate" key yet) — see
            // NIC-1970 PR notes on avoiding another cross-repo publish
            // round-trip for one label.
            aria-label="Edit date"
            data-testid="note-date-mention-trigger"
            className="border-border bg-accent text-accent-foreground hover:bg-accent/80 mx-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 align-baseline text-sm"
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {display}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parseISODateLocal(iso)}
            onSelect={date => {
              if (!date) return;
              updateAttributes({ date: format(date, 'yyyy-MM-dd') });
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  );
};

// Display-only in v1 (NIC-1971): a structured reference date inside note
// prose. Does not create a Task and does not link into Calendar/Time-Spread —
// that's deliberately out of scope, see the story. Atomic inline node, same
// posture as Tiptap's own mention/emoji examples: a single un-editable unit
// that sits inline with surrounding text.
export const NoteDateMention = Node.create({
  // Node type name is dictated by the backend's content allowlist
  // (nicoflow-api content.go `allowedNodes`) — must stay "dateMention".
  name: 'dateMention',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      date: {
        default: null,
        parseHTML: element => element.getAttribute('data-date'),
        renderHTML: attributes => ({ 'data-date': attributes.date as string | null }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-note-date-mention]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, 'data-note-date-mention': '' }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DateMentionView);
  },

  addCommands() {
    return {
      setNoteDateMention:
        (isoDate: string) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { date: isoDate } }),
    };
  },
});
