import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';

interface TaskActionButtonsProps {
  isLoading: boolean;
  isEditMode: boolean;
  onCancel: () => void;
  isDisabled?: boolean;
}

const TaskActionButtons = ({ isLoading, isEditMode, onCancel, isDisabled = false }: TaskActionButtonsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.3 }}
      className="flex flex-col sm:flex-row gap-3 pt-4"
    >
      <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="w-full sm:w-1/2 h-10">
        Cancel
      </Button>
      <Button type="submit" disabled={isLoading || isDisabled} className="w-full sm:w-1/2 h-10">
        {isLoading ? 'Saving...' : isEditMode ? 'Update Task' : 'Create Task'}
      </Button>
    </motion.div>
  );
};

export default TaskActionButtons;
