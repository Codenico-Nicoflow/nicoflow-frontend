import { type Control, useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetHabitSubjectsQuery } from '@/lib/store';
import { cn } from '@/lib/utils';

import { HABIT_FALLBACK_ICON, HABIT_SUBJECT_ICONS } from '../data';
import type { HabitFormData } from '../schema';

export interface HabitSubjectPickerProps {
  control: Control<HabitFormData>;
}

// The subject grid.
//
// Subjects are cosmetic — picking one changes the card's icon and nothing else.
// It must never alter the schedule, target or unit, or the picker stops being a
// decoration and becomes a hidden second form.
export const HabitSubjectPicker = ({ control }: HabitSubjectPickerProps) => {
  const { t } = useTranslation('habits');
  const { data: subjects, isLoading } = useGetHabitSubjectsQuery();
  const { field } = useController({ control, name: 'subject' });

  return (
    <div className="space-y-2">
      <Label>{t('form.subject')}</Label>

      {isLoading ? (
        <div className="grid grid-cols-6 gap-1.5" data-testid="habit-subjects-loading">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>
      ) : (
        <div className="grid max-h-40 grid-cols-6 gap-1.5 overflow-y-auto" data-testid="habit-subject-picker">
          {(subjects ?? []).map(subject => {
            // A slug this build has never seen still renders — the catalog is
            // served and can gain entries without a client release.
            const Icon = HABIT_SUBJECT_ICONS[subject.slug] ?? HABIT_FALLBACK_ICON;
            const selected = field.value === subject.slug;

            return (
              <button
                key={subject.slug}
                type="button"
                onClick={() => field.onChange(subject.slug)}
                aria-pressed={selected}
                aria-label={t(subject.labelKey as 'subject.custom')}
                title={t(subject.labelKey as 'subject.custom')}
                data-testid={`habit-subject-${subject.slug}`}
                className={cn(
                  'grid h-10 place-items-center rounded-md border transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected ? 'border-primary bg-accent' : 'border-border hover:bg-accent'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
