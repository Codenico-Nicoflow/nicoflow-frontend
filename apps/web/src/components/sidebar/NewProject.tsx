import { motion } from 'framer-motion';
import { useState } from 'react';
import { SidebarMenuItem, SidebarMenuButton } from '../ui/sidebar';
import { Plus, Sparkles } from 'lucide-react';
import ProjectDialog from '@/components/project-dialog/ProjectDialog';

const NewProject = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="pt-3 mt-3"
      >
        <SidebarMenuItem>
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <SidebarMenuButton
              onClick={e => {
                e.stopPropagation();
                setIsDialogOpen(true);
              }}
              className="transition-all duration-200 rounded-lg border border-transparent hover:bg-transparent active:bg-primary/10 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-primary to-secondary  transition-all duration-200 shadow-sm group-hover:shadow-md">
                  <Plus className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-semibold text-foreground group-hover:text-primary">New Project</span>
                <Sparkles className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </SidebarMenuButton>
          </motion.div>
        </SidebarMenuItem>
      </motion.div>

      <ProjectDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
};

export default NewProject;
