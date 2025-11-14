import { useMemo, useState } from 'react';

import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

import { LazyIcon } from '@/components/LazyIcon';
import CategoryContextMenu from '@/features/category/components/CategoryContextMenu';
import CategoryDialog from '@/features/category/components/CategoryDialog';
import type { ICategory } from '@/lib/types';
import type { IconId } from '@/lib/utils';
import { capitalize, cn } from '@/lib/utils';

import Project from './Project';
import ShowMore from './ShowMore';

interface CategorySectionProps {
  category: ICategory;
  isCollapsed: boolean;
  onToggleCategory: (categoryId: number) => void;
  categoryIndex: number;
  isCategoryCollapsed: boolean;
}

const CategorySection = ({
  category,
  isCollapsed,
  onToggleCategory,
  categoryIndex,
  isCategoryCollapsed,
}: CategorySectionProps) => {
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const maxInitialProjects = 3;

  const projects = category.projects || [];
  const displayedProjects = showAllProjects ? projects : projects.slice(0, maxInitialProjects);
  const hasMoreProjects = projects.length > maxInitialProjects;

  const { isOver, setNodeRef } = useDroppable({
    id: `category-${category.id}`,
  });

  const CategoryIcon = useMemo(() => {
    return (
      <LazyIcon
        iconId={(category?.icon as IconId) || 'briefcase'}
        className="w-4 h-4 text-primary group-hover/category:text-primary/80 transition-colors"
      />
    );
  }, [category?.icon]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: categoryIndex * 0.1 }}
      className={cn('group/category', isCollapsed && 'hidden')}
      style={{
        backgroundColor: isOver ? 'var(--primary-light)' : 'transparent',
        border: isOver ? '2px dashed var(--primary)' : '2px dashed transparent',
        borderRadius: '12px',
        padding: isOver ? '12px' : '8px',
        transform: isOver ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isOver ? '0 4px 12px var(--primary-light)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      ref={setNodeRef}
    >
      <motion.div
        className={cn(
          'flex items-center gap-3 cursor-pointer transition-all duration-300 rounded-xl px-3 py-2.5 mb-2',
          'hover:bg-primary/10 hover:shadow-sm',
          isCollapsed && 'justify-center p-2'
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onToggleCategory(category.id)}
      >
        {!isCollapsed && (
          <>
            <motion.div
              animate={{ rotate: isCategoryCollapsed ? 0 : 90 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.div>
            <div className="p-2 rounded-lg bg-primary/15 group-hover/category:bg-primary/25 transition-all duration-300 shadow-sm group-hover/category:shadow-md">
              {CategoryIcon}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground block truncate">{capitalize(category.name)}</span>
              <span className="text-xs text-muted-foreground">
                {projects.length > 1 ? `${projects.length} projects` : `${projects.length} project`}
              </span>
            </div>
            {category.name !== 'general' && (
              <CategoryContextMenu category={category} onEdit={() => setIsEditDialogOpen(true)} />
            )}
          </>
        )}
        {isCollapsed && (
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="p-2 rounded-lg bg-primary/15 hover:bg-primary/25 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            {CategoryIcon}
          </motion.div>
        )}
      </motion.div>

      {!isCollapsed && !isCategoryCollapsed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-1 ml-6 pl-4 border-l border-muted/20"
        >
          <AnimatePresence>
            {displayedProjects?.map((project, projectIndex) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: projectIndex * 0.05 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <Project project={project} />
              </motion.div>
            ))}
          </AnimatePresence>

          {hasMoreProjects && !showAllProjects && (
            <ShowMore
              onClick={() => setShowAllProjects(true)}
              label="Show more"
              icon={<ChevronRight className="w-3.5 h-3.5 rotate-90" />}
            />
          )}

          {hasMoreProjects && showAllProjects && (
            <ShowMore
              onClick={() => setShowAllProjects(false)}
              label="Show less"
              icon={<ChevronRight className="w-3.5 h-3.5 rotate-270" />}
            />
          )}
        </motion.div>
      )}

      <CategoryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        category={category}
        onSuccess={() => {
          setIsEditDialogOpen(false);
        }}
      />
    </motion.div>
  );
};

export default CategorySection;
