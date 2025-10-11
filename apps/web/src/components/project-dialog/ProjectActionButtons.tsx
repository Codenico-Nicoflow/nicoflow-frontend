import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ProjectActionButtonsProps {
  isLoading: boolean;
  isEditMode: boolean;
  onCancel: () => void;
}

const ProjectActionButtons = ({ isLoading, isEditMode, onCancel }: ProjectActionButtonsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 pt-4 sm:pt-6 border-t border-border"
    >
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="h-10 sm:h-12 px-4 sm:px-6 font-semibold order-2 sm:order-1"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isLoading}
        className="h-10 sm:h-12 px-6 sm:px-8 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200 order-1 sm:order-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isEditMode ? 'Updating...' : 'Creating...'}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            {isEditMode ? 'Update Project' : 'Create Project'}
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default ProjectActionButtons;
