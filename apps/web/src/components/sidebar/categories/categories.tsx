import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FolderOpen, Plus } from 'lucide-react';
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useGetCategoriesWithProjectsQuery } from '@my-monorepo/store';
import NewProject from '../NewProject';
import CategorySection from './CategorySection';
import { CategoriesLoadingState, CategoriesEmptyState } from './states';
import CategoryDialog from '@/components/category-dialog/CategoryDialog';
import DragAndDropContext from '@/components/drag-drop/DragAndDropContext';

export default function Categories() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [isOpen, setIsOpen] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set());
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const { data: categories, isLoading } = useGetCategoriesWithProjectsQuery();

  const toggleCategory = (categoryId: number) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return <CategoriesLoadingState />;
  }

  if (!categories || categories.length === 0) {
    return <CategoriesEmptyState />;
  }

  const sortedCategories = categories.map(category => ({
    ...category,
    projects: category.projects
      ? [...category.projects].sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return 0;
        })
      : [],
  }));

  return (
    <DragAndDropContext>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/categories">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger asChild>
                <motion.div
                  className="flex items-center mb-3 cursor-pointer justify-between w-full hover:bg-muted/30 transition-all duration-200 px-3 py-2.5 rounded-xl group"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-muted/50 group-hover:bg-muted/80 transition-colors">
                      <FolderOpen className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">Categories</p>
                        <p className="text-xs text-muted-foreground">
                          {categories?.length > 1
                            ? `${categories?.length} categories`
                            : `${categories?.length} category`}
                        </p>
                      </div>
                    )}
                  </div>
                  {!isCollapsed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        setIsCategoryDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                  {!isCollapsed && (
                    <motion.div animate={{ rotate: 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]/categories:rotate-180" />
                    </motion.div>
                  )}
                </motion.div>
              </CollapsibleTrigger>
            </SidebarGroupLabel>

            <CollapsibleContent>
              <SidebarGroupContent>
                <div className="space-y-1">
                  <AnimatePresence>
                    {sortedCategories.map((category, categoryIndex) => (
                      <CategorySection
                        key={category.id}
                        category={category}
                        isCollapsed={isCollapsed}
                        onToggleCategory={toggleCategory}
                        categoryIndex={categoryIndex}
                        isCategoryCollapsed={collapsedCategories.has(category.id)}
                      />
                    ))}
                  </AnimatePresence>

                  {!isCollapsed && <NewProject />}
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <CategoryDialog
          open={isCategoryDialogOpen}
          onOpenChange={setIsCategoryDialogOpen}
          onSuccess={() => {
            setIsCategoryDialogOpen(false);
          }}
        />
      </motion.div>
    </DragAndDropContext>
  );
}
