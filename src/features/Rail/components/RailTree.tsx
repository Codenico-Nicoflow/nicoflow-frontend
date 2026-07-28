import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { useGetAreasWithProjectsQuery } from '@/lib/store';

import { selectOpenAreaIds, selectTreeAreas } from '../tree';

import { RailAreaGroup } from './RailAreaGroup';

type RailTreeProps = {
  closedAreaIds: string[];
  activeProjectId?: string;
  onToggleArea: (areaId: string) => void;
};

const TreeSkeleton = () => (
  <div className="space-y-2 px-2 py-1" data-testid="rail-tree-skeleton">
    {[0, 1, 2].map(i => (
      <Skeleton key={i} className="h-6 w-full" />
    ))}
  </div>
);

export const RailTree = ({ closedAreaIds, activeProjectId, onToggleArea }: RailTreeProps) => {
  const { t } = useTranslation('nav');
  // isLoading (not isFetching) on purpose: this query is invalidated by every
  // area/project mutation, so skeletoning on refetch would blink the whole tree
  // each time a project is renamed.
  const { data, isLoading, isError } = useGetAreasWithProjectsQuery();

  if (isLoading) return <TreeSkeleton />;
  // A failed chrome query stays silent — the page's own content surfaces the
  // real failure, and a toast here would fire on every load.
  if (isError || !data?.length) return null;

  const areas = selectTreeAreas(data);
  const openIds = new Set(selectOpenAreaIds(areas, closedAreaIds));

  return (
    <ul aria-label={t('areas')} className="space-y-0.5" data-testid="rail-tree">
      {areas.map(area => (
        <RailAreaGroup
          key={area.id}
          area={area}
          open={openIds.has(area.id)}
          activeProjectId={activeProjectId}
          onToggle={onToggleArea}
        />
      ))}
    </ul>
  );
};
