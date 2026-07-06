import { useMemo } from 'react';

import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components';
import { useGetTimeSpreadQuery } from '@/lib/store';

import TimeSpreadList from './components/TimeSpreadList';
import TimeSpreadTabs from './components/TimeSpreadTabs';
import { groupByDay } from './utils';

type Bucket = 'today' | 'tomorrow' | 'week';

interface TimeSpreadViewProps {
  bucket: Bucket;
}

// One view drives all three day screens: Today and Tomorrow render a flat bucket,
// Next-7 groups the thisWeek bucket by day (empty days collapsed).
const TimeSpreadView = ({ bucket }: TimeSpreadViewProps) => {
  const { t } = useTranslation('task');
  const { data, isLoading } = useGetTimeSpreadQuery();

  const flat = bucket === 'today' ? data?.today : bucket === 'tomorrow' ? data?.tomorrow : undefined;
  const weekGroups = useMemo(() => (bucket === 'week' ? groupByDay(data?.thisWeek ?? []) : []), [bucket, data]);

  const isEmpty = bucket === 'week' ? weekGroups.length === 0 : (flat?.length ?? 0) === 0;

  const content = isLoading ? (
    <div className="py-12 text-center text-muted-foreground" data-testid="timespread-loading">
      {t('timeSpread.loading')}
    </div>
  ) : isEmpty ? (
    <EmptyState
      icon={CalendarDays}
      title={t(`timeSpread.${bucket}.emptyTitle`)}
      description={t(`timeSpread.${bucket}.emptyDescription`)}
      data-testid="timespread-empty"
    />
  ) : bucket === 'week' ? (
    <div className="space-y-8" data-testid="timespread-week">
      {weekGroups.map(group => (
        <section key={group.key} data-testid={`timespread-day-${group.key}`} className="space-y-3 sm:space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {format(group.date, 'EEEE, MMM d')}
          </h2>
          <TimeSpreadList tasks={group.tasks} />
        </section>
      ))}
    </div>
  ) : (
    <div data-testid="timespread-list">
      <TimeSpreadList tasks={flat ?? []} />
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header + tabs are static — they don't re-animate when the tab changes. */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('timeSpread.title')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">{t('timeSpread.subtitle')}</p>
          </div>
          <TimeSpreadTabs active={bucket} />
        </div>

        {/* Header + tabs are static; the task content just swaps — no animation. */}
        {content}
      </div>
    </div>
  );
};

export default TimeSpreadView;
