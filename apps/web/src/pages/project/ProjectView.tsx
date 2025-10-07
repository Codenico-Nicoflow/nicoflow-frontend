import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import ProjectHeader from '@/components/project/ProjectHeader';
import ProjectDialog from '@/components/project-dialog/ProjectDialog';
import DeleteDialog from '@/components/project-dialog/DeleteDialog';
import TasksSection from '@/components/project/TasksSection';
import { useState } from 'react';
import { useGetProjectQuery } from '@my-monorepo/store';

const ProjectView = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { data: project, isLoading: isProjectLoading } = useGetProjectQuery(parseInt(projectId || '0'));

  if (isProjectLoading) {
    return <div>Loading...</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 overflow-hidden"
      >
        <ProjectHeader
          project={project}
          onEdit={() => setIsEditDialogOpen(true)}
          onDelete={() => setDeleteDialogOpen(true)}
        />

        <div className="flex-1 overflow-y-auto">
          <TasksSection projectId={project.id} />
        </div>
      </motion.div>

      <ProjectDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} project={project} />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        projectName={project.name}
        projectId={project.id}
        onSuccess={() => {
          navigate('/');
        }}
      />
    </div>
  );
};

export default ProjectView;
