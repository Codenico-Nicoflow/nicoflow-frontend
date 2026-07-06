import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

type Bucket = 'today' | 'tomorrow' | 'week';

const TABS: { bucket: Bucket; to: string }[] = [
  { bucket: 'today', to: '/quick-access/today' },
  { bucket: 'tomorrow', to: '/quick-access/tomorrow' },
  { bucket: 'week', to: '/quick-access/next-7-days' },
];

// The three Time Spread views as a tab row — one screen, three lenses on the day.
// Static (no animation): switching tabs just changes which pill is highlighted.
const TimeSpreadTabs = ({ active }: { active: Bucket }) => {
  const { t } = useTranslation('task');

  return (
    <div
      className="flex items-center gap-1 rounded-lg bg-muted p-1"
      role="tablist"
      aria-label={t('timeSpread.tabsLabel')}
    >
      {TABS.map(({ bucket, to }) => {
        const isActive = bucket === active;
        return (
          <Link
            key={bucket}
            to={to}
            role="tab"
            aria-selected={isActive}
            data-testid={`timespread-tab-${bucket}`}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-center text-xs sm:text-sm font-medium transition-colors',
              isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t(`timeSpread.${bucket}.title`)}
          </Link>
        );
      })}
    </div>
  );
};

export default TimeSpreadTabs;
