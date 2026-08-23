import type { ITask } from '@nicoflow/shared/types';
import { ActiveTab } from '@nicoflow/shared/types';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Divider } from '@/components';

import type { DayGroup } from '../utils';

import TimeSpreadList from './TimeSpreadList';

interface Props {
  today: ITask[];
  tomorrow: ITask[];
  weekGroups: DayGroup[];
  onEdit: (task: ITask) => void;
}

// Every section renders even when empty — an empty section reads as "clear",
// while a missing one reads as "did this load?".
const TimeSpreadCombinedView = ({ today, tomorrow, weekGroups, onEdit }: Props) => {
  const { t } = useTranslation('task');

  return (
    <div className="space-y-8" data-testid="timespread-combined">
      <section data-testid="timespread-section-today" className="space-y-3 sm:space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('timeSpread.today.title')}
        </h2>
        {today.length > 0 ? (
          <TimeSpreadList tasks={today} activeTab={ActiveTab.TODAY} onEdit={onEdit} />
        ) : (
          <p className="text-sm text-muted-foreground">{t('timeSpread.today.emptyTitle')}</p>
        )}
      </section>

      <Divider />

      <section data-testid="timespread-section-tomorrow" className="space-y-3 sm:space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('timeSpread.tomorrow.title')}
        </h2>
        {tomorrow.length > 0 ? (
          <TimeSpreadList tasks={tomorrow} activeTab={ActiveTab.TOMORROW} onEdit={onEdit} />
        ) : (
          <p className="text-sm text-muted-foreground">{t('timeSpread.tomorrow.emptyTitle')}</p>
        )}
      </section>

      <Divider />

      <section data-testid="timespread-section-week" className="space-y-3 sm:space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('timeSpread.week.title')}
        </h2>
        {weekGroups.length > 0 ? (
          <div className="space-y-6">
            {weekGroups.map(group => (
              <div key={group.key} data-testid={`timespread-day-${group.key}`} className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground">{format(group.date, 'EEEE, MMM d')}</h3>
                <TimeSpreadList tasks={group.tasks} activeTab={ActiveTab.WEEK} onEdit={onEdit} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('timeSpread.week.emptyTitle')}</p>
        )}
      </section>
    </div>
  );
};

export default TimeSpreadCombinedView;
