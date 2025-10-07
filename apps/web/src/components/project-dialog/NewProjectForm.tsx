import { useState } from 'react';
import ProjectDialog from './ProjectDialog';

interface NewProjectFormProps {
  onSuccess?: () => void;
}

const NewProjectForm = ({ onSuccess }: NewProjectFormProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const handleSuccess = () => {
    setIsDialogOpen(false);
    onSuccess?.();
  };

  return <ProjectDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={handleSuccess} />;
};

export default NewProjectForm;
