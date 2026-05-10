import { useState } from 'react';

import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';

import {
  ProjectDeleteDialog,
  ProjectDialog,
  ProjectEmptyState,
  ProjectHeader,
  ProjectLoadingState,
} from '@/features/Project';
import { TasksSection } from '@/features/Tasks/components';
import { useGetProjectQuery } from '@/lib/store';

const ProjectView = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { data: project, isLoading: isProjectLoading } = useGetProjectQuery(parseInt(projectId || '0'));

  if (isProjectLoading) {
    return <ProjectLoadingState />;
  }

  if (!project) {
    return <ProjectEmptyState />;
  }

  return (
    <div className="flex flex-col h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 overflow-hidden"
      >
        {project && (
          <ProjectHeader
            project={project}
            onEdit={() => setIsEditDialogOpen(true)}
            onDelete={() => setDeleteDialogOpen(true)}
          />
        )}

        <div className="flex-1 overflow-y-auto">
          <TasksSection projectId={project?.id || 0} />
        </div>
      </motion.div>

      <ProjectDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} project={project} />

      <ProjectDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        projectName={project?.name || ''}
        projectId={project?.id || 0}
        onSuccess={() => {
          navigate('/');
        }}
      />
    </div>
  );
};

export default ProjectView;
