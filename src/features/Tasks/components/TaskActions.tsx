import { useState } from 'react';

import { type ITask } from '@nicoflow/shared/types';
import { motion } from 'framer-motion';
import { Edit, MoreVertical, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskActionsProps {
  task: ITask;
  onEdit?: (task: ITask) => void;
  onDelete?: (taskId: string) => void;
}

const TaskActions = ({ task, onEdit, onDelete }: TaskActionsProps) => {
  const { t } = useTranslation('task');
  const [isOpen, setIsOpen] = useState(false);

  const handleEdit = () => {
    onEdit?.(task);
    setIsOpen(false);
  };

  const handleDelete = () => {
    onDelete?.(task.id);
    setIsOpen(false);
  };

  return (
    <div className="position-absolute end-0">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <MoreVertical className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </motion.button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
            <Edit className="h-4 w-4 me-2" />
            {t('actions.edit')}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleDelete}
            className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
          >
            <Trash2 className="h-4 w-4 me-2" />
            {t('actions.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TaskActions;
