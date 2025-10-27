import { motion } from 'framer-motion';
import { AlertTriangle,Trash2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import { categoryApi,useDeleteProjectMutation } from '@my-monorepo/store';
import { showErrorToast, showSuccessToast, ToastMessages } from '@my-monorepo/utils';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  projectName?: string;
  projectId: number;
}

const DeleteDialog = ({ open, onOpenChange, onSuccess, projectName, projectId }: DeleteDialogProps) => {
  const [deleteProject, { isLoading: isDeleteLoading }] = useDeleteProjectMutation();
  const dispatch = useDispatch();

  const handleDelete = async () => {
    try {
      await deleteProject(projectId).unwrap();
      onOpenChange(false);
      showSuccessToast(ToastMessages.PROJECT_DELETED, toast);
      dispatch(categoryApi.util.invalidateTags(['Category']));
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      showErrorToast(error, toast);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] md:max-w-lg max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl sm:rounded-lg rounded-none">
        <DialogTitle className="sr-only">Delete Project</DialogTitle>

        <DialogHeader className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="text-center"
          >
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Delete Project</h2>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-medium">{projectName || 'this project'}</span>? This
              action cannot be undone.
            </p>
          </motion.div>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="p-6 pt-0"
        >
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="h-10 px-4 font-semibold order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleteLoading}
              className="h-10 px-6 font-semibold order-1 sm:order-2"
            >
              {isDeleteLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-destructive-foreground border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteDialog;
