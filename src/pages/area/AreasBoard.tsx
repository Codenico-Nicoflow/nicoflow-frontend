import { useMemo, useState } from 'react';

import { Layers, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { DragAndDropContext, EmptyState, PlanLimitAlert } from '@/components';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AreaCard } from '@/features/Area/components/AreaCard';
import { AreaDialog } from '@/features/Area/components/AreaDialog';
import { ProjectDialog } from '@/features/Project';
import { useAppUser, useGetAreasWithProjectsQuery } from '@/lib/store';
import { FREE_PLAN_AREA_LIMIT, FREE_PLAN_PROJECT_LIMIT, USER_STATUS } from '@/lib/types';

const AreasBoard = () => {
  const { t } = useTranslation('area');
  const user = useAppUser();
  const { data: areas, isLoading } = useGetAreasWithProjectsQuery();

  const [createAreaOpen, setCreateAreaOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const sortedAreas = useMemo(
    () =>
      (Array.isArray(areas) ? areas : [])
        .map(area => ({
          ...area,
          projects: [...(area.projects ?? [])].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
        }))
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [areas]
  );

  const isFree = user?.status !== USER_STATUS.PREMIUM;
  const projectCount = sortedAreas.reduce((sum, area) => sum + (area.projects?.length ?? 0), 0);
  const atAreaLimit = isFree && sortedAreas.length >= FREE_PLAN_AREA_LIMIT;
  const atProjectLimit = isFree && projectCount >= FREE_PLAN_PROJECT_LIMIT;

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-6 h-10 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <DragAndDropContext>
      <div className="p-6">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('board.yourAreas')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('board.areaCount', { count: sortedAreas.length })} &middot;{' '}
              {t('board.projectCount', { count: projectCount })}
            </p>
          </div>

          {sortedAreas.length > 0 && (
            <TooltipProvider>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        onClick={() => setCreateProjectOpen(true)}
                        disabled={atProjectLimit}
                        data-testid="board-new-project"
                      >
                        <Plus className="me-2 h-4 w-4" />
                        {t('board.newProject')}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {atProjectLimit && <TooltipContent>{t('board.planLimitTooltip')}</TooltipContent>}
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        onClick={() => setCreateAreaOpen(true)}
                        disabled={atAreaLimit}
                        data-testid="board-new-area"
                      >
                        <Plus className="me-2 h-4 w-4" />
                        {t('board.newArea')}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {atAreaLimit && <TooltipContent>{t('board.planLimitTooltip')}</TooltipContent>}
                </Tooltip>
              </div>
            </TooltipProvider>
          )}
        </header>

        {(atAreaLimit || atProjectLimit) && (
          <div className="mb-6">
            <PlanLimitAlert />
          </div>
        )}

        {sortedAreas.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={t('board.empty')}
            description={t('board.emptyDescription')}
            action={
              <Button onClick={() => setCreateAreaOpen(true)} data-testid="board-empty-create">
                <Plus className="me-2 h-4 w-4" />
                {t('board.newArea')}
              </Button>
            }
            data-testid="board-empty"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="areas-grid">
            {sortedAreas.map((area, index) => (
              <AreaCard key={area.id} area={area} index={index} data-testid={`area-card-${area.id}`} />
            ))}
          </div>
        )}
      </div>

      <AreaDialog open={createAreaOpen} onOpenChange={setCreateAreaOpen} />
      <ProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onCreateArea={() => setCreateAreaOpen(true)}
      />
    </DragAndDropContext>
  );
};

export default AreasBoard;
