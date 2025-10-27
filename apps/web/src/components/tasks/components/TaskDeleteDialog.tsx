import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { useDeleteTaskMutation } from '@my-monorepo/store';
import { showErrorToast, showSuccessToast, ToastMessages } from '@my-monorepo/utils';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TaskDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  taskId: number;
  onSuccess?: () => void;
}

const TaskDeleteDialog = ({ open, onOpenChange, taskName, taskId, onSuccess }: TaskDeleteDialogProps) => {
  const [deleteTask, { isLoading }] = useDeleteTaskMutation();

  const handleDelete = async () => {
    try {
      await deleteTask(taskId).unwrap();
      showSuccessToast(ToastMessages.TASK_DELETED_SUCCESSFULLY, toast);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md p-0 border-0 shadow-2xl sm:rounded-lg rounded-none">
        <DialogHeader className="p-6 pb-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">Delete Task</DialogTitle>
            </div>
          </motion.div>
          <DialogDescription className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">"{taskName}"</span>? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 p-6 pt-4"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-1/2 h-10"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="w-full sm:w-1/2 h-10"
          >
            {isLoading ? 'Deleting...' : 'Delete Task'}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDeleteDialog;
