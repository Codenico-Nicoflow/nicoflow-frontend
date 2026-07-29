import { useTranslation } from 'react-i18next';

import type { SummarizableRule } from '@/lib/utils/utils/recurrence';
import { summarizeRecurrence } from '@/lib/utils/utils/recurrence';

// Renders the pure summary descriptor with the app's typed `t`. The key→string
// step lives here rather than in the util so i18next's literal key types stay
// intact (a generic translate parameter can't satisfy them) and the util stays
// framework-agnostic for the E-033 extraction.
export const useRecurrenceSummary = () => {
  const { t } = useTranslation('recurrence');

  return (rule: SummarizableRule): string => {
    const s = summarizeRecurrence(rule);
    const days = s.weekdays.map(d => t(`weekdayShort.${d}` as 'weekdayShort.0')).join(', ');

    // `count` drives plural selection — Hebrew needs it to reach its `_two` form.
    const base =
      s.key === 'summary.weekly'
        ? t('summary.weekly', { count: s.count, days })
        : s.key === 'summary.monthly'
          ? t('summary.monthly', { count: s.count, day: s.day })
          : s.key === 'summary.monthlyLast'
            ? t('summary.monthlyLast', { count: s.count })
            : s.key === 'summary.yearly'
              ? t('summary.yearly', { count: s.count })
              : s.key === 'freq.weekly'
                ? t('freq.weekly')
                : t('summary.daily', { count: s.count });

    return s.endDate ? t('summary.until', { summary: base, date: s.endDate }) : base;
  };
};
