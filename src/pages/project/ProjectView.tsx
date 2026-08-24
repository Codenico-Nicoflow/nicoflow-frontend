import { useState } from 'react';

import { motion } from 'framer-motion';
import { FileText, FolderX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { EmptyState } from '@/components';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExpandableText } from '@/components/ui/expandable-text';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotesSection } from '@/features/Notes';
import { ProjectDeleteDialog, ProjectDialog, ProjectHeader, ProjectLoadingState } from '@/features/Project';
import { TasksSection } from '@/features/Tasks';
import { useGetNotesInfiniteQuery, useGetProjectQuery, useGetTasksInfiniteQuery } from '@/lib/store';

import { parseProjectTab, PROJECT_TAB, PROJECT_TAB_PARAM, PROJECT_TASK_PARAM } from './tabs';

const ProjectView = () => {
  const { t } = useTranslation('project');
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading, isError } = useGetProjectQuery(projectId, { skip: !projectId });

  // Counts only, for the tab badges — both lists are already cached by the
  // sections themselves (RTK dedupes against the same cache entry), no double-fetch.
  // Counts reflect every page loaded so far (grows as TasksSection/NotesSection
  // scroll further), not just the first page.
  const { data: tasksData } = useGetTasksInfiniteQuery({ projectId }, { skip: !projectId });
  const { data: notesData } = useGetNotesInfiniteQuery({ projectId }, { skip: !projectId });
  const tasks = tasksData?.pages.flatMap(p => p.items) ?? [];
  const notes = notesData?.pages.flatMap(p => p.items) ?? [];

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTaskId = searchParams.get(PROJECT_TASK_PARAM) ?? undefined;
  // A task deep-link always lands on the tasks tab regardless of ?tab=.
  const tab = initialTaskId ? PROJECT_TAB.TASKS : parseProjectTab(searchParams.get(PROJECT_TAB_PARAM));
  // replace, not push: switching tabs shouldn't bury the previous page under a
  // history entry per click.
  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(PROJECT_TAB_PARAM, next);
    setSearchParams(params, { replace: true });
  };

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6">
        <ProjectLoadingState />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <EmptyState
        icon={FolderX}
        title={t('view.notFound')}
        description={t('view.notFoundDescription')}
        action={
          <Button variant="outline" onClick={() => navigate('/areas')}>
            {t('view.backToAreas')}
          </Button>
        }
        data-testid="project-not-found"
      />
    );
  }

  return (
    <div className="flex flex-col">
      <ProjectHeader project={project} onEdit={() => setEditOpen(true)} onDelete={() => setDeleteOpen(true)} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="p-6 space-y-6"
      >
        {project.description && (
          <section
            data-testid="project-description"
            className="rounded-lg border border-border bg-background/80 backdrop-blur-sm p-4 sm:p-5"
          >
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
              {t('view.description')}
            </h2>
            <ExpandableText>{project.description}</ExpandableText>
          </section>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full sm:w-auto" data-testid="project-tabs">
            <TabsTrigger
              value={PROJECT_TAB.TASKS}
              className="flex-1 gap-2 sm:flex-none"
              data-testid="project-tab-tasks"
            >
              {t('view.tabTasks')}
              {tasks.length > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[11px]">
                  {tasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value={PROJECT_TAB.NOTES}
              className="flex-1 gap-2 sm:flex-none"
              data-testid="project-tab-notes"
            >
              {t('view.tabNotes')}
              {notes.length > 0 && (
                <Badge variant="outline" className="px-1.5 py-0 text-[11px]">
                  {notes.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Both panels stay mounted: switching tabs shouldn't refetch a list
              the client already holds, or drop an in-progress task filter. */}
          <TabsContent value={PROJECT_TAB.TASKS} className="mt-6" forceMount hidden={tab !== PROJECT_TAB.TASKS}>
            <TasksSection projectId={project.id} showHeading={false} initialTaskId={initialTaskId} />
          </TabsContent>

          <TabsContent value={PROJECT_TAB.NOTES} className="mt-6" forceMount hidden={tab !== PROJECT_TAB.NOTES}>
            <NotesSection projectId={project.id} showHeading={false} />
          </TabsContent>
        </Tabs>
      </motion.div>

      <ProjectDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
      <ProjectDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        projectId={project.id}
        projectName={project.name}
        onSuccess={() => navigate('/areas')}
      />
    </div>
  );
};

export default ProjectView;
