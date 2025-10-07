import { motion } from 'framer-motion';
import { FolderOpen, Calendar as CalendarIcon, Star } from 'lucide-react';

interface ProjectHeaderProps {
  isEditMode: boolean;
}

const ProjectHeader = ({ isEditMode }: ProjectHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative cursor-default select-none "
    >
      <div className="relative bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 dark:from-primary/10 dark:via-secondary/10 dark:to-accent/10 p-4 sm:p-6 lg:p-8 rounded-t-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-t-lg" />

        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6"
          >
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg">
              <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                {isEditMode ? 'Edit Project' : 'Create New Project'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {isEditMode ? 'Update your project details' : 'Start organizing your work with a new project'}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
              <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Organize tasks</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
              <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Set deadlines</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
              <Star className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Mark favorites</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectHeader;
