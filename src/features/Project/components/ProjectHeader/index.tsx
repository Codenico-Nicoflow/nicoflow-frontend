import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, Clock, Edit3, Star, Trash2 } from 'lucide-react';

import { LazyIcon } from '@/components';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { type IconId, type IProject } from '@/lib/types';
import { capitalize, cn } from '@/lib/utils';

interface ProjectHeaderProps {
  project: IProject;
  onEdit: () => void;
  onDelete?: () => void;
}

export const ProjectHeader = ({ project, onEdit, onDelete }: ProjectHeaderProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const isOverdue = project?.dueDate && new Date() > new Date(project.dueDate) && project.status === 'active';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-r from-background to-muted/20 border-b border-border/50 p-6"
    >
      <div className="flex items-start justify-between select-none sm:flex-row flex-col gap-4 sm:gap-0">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20"
          >
            <LazyIcon iconId={project?.icon as IconId} className="h-8 w-8 text-primary" />
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="text-2xl font-bold text-foreground truncate"
              >
                {project?.name}
              </motion.h1>

              {project?.isFavorite && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                >
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <Badge variant="secondary" className={cn('text-xs font-medium', getStatusColor(project?.status || ''))}>
                {capitalize(project?.status || '')}
              </Badge>

              {project?.dueDate && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className={cn(
                    'flex items-center gap-1.5 text-sm',
                    isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  <span>
                    Due {format(project?.dueDate, 'MMM dd, yyyy')}
                    {isOverdue && ' (Overdue)'}
                  </span>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <Clock className="h-4 w-4" />
                <span>Created {format(new Date(), 'MMM dd, yyyy')}</span>
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="flex items-center gap-4 sm:justify-between justify-between w-full sm:w-auto"
        >
          <Button variant="outline" size="sm" onClick={onEdit} className="h-9 px-3">
            <Edit3 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 hover:bg-transparent hover:shadow-sm"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2 text-destructive" />
            <p className="text-destructive">Delete</p>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};
