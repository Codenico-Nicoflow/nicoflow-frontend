import { motion } from 'framer-motion';
import { CheckSquare, Edit } from 'lucide-react';

interface TaskDialogHeaderProps {
  isEditMode: boolean;
}

const TaskDialogHeader = ({ isEditMode }: TaskDialogHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3"
    >
      <div className="p-2 rounded-lg bg-primary/10">
        {isEditMode ? <Edit className="h-5 w-5 text-primary" /> : <CheckSquare className="h-5 w-5 text-primary" />}
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground">{isEditMode ? 'Edit Task' : 'Create New Task'}</h2>
        <p className="text-sm text-muted-foreground">
          {isEditMode ? 'Update your task details' : 'Add a new task to your project'}
        </p>
      </div>
    </motion.div>
  );
};

export default TaskDialogHeader;
