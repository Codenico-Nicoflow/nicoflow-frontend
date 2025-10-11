import React from 'react';

import ProjectDialog from '@/components/project/ProjectDialog';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewProjectDialog: React.FC<NewProjectDialogProps> = ({ open, onOpenChange }) => {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  return <ProjectDialog open={open} onOpenChange={onOpenChange} onSuccess={handleSuccess} />;
};

export default NewProjectDialog;
