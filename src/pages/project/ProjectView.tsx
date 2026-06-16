import { useState } from 'react';

import { motion } from 'framer-motion';
import { CheckSquare, FolderX } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { EmptyState } from '@/components';
import { Button } from '@/components/ui/button';
import { ExpandableText } from '@/components/ui/expandable-text';
import { ProjectDeleteDialog, ProjectDialog, ProjectHeader, ProjectLoadingState } from '@/features/Project';
import { useGetProjectQuery } from '@/lib/store';

const ProjectView = () => {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading, isError } = useGetProjectQuery(projectId, { skip: !projectId });

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
        title="Project not found"
        description="This project may have been deleted or you don't have access to it."
        action={
          <Button variant="outline" onClick={() => navigate('/areas')}>
            Back to Areas
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
          <section data-testid="project-description">
            <h2 className="text-sm font-semibold text-foreground mb-2">Description</h2>
            <ExpandableText>{project.description}</ExpandableText>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Tasks</h2>
          <EmptyState
            icon={CheckSquare}
            title="Tasks coming soon"
            description="Task management lands in a later phase."
          />
        </section>
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
