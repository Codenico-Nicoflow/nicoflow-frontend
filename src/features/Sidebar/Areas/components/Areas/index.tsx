import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, FolderOpen, Plus } from 'lucide-react';

import { DragAndDropContext } from '@/components';
import { Button } from '@/components/ui/button.tsx';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible.tsx';
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, useSidebar } from '@/components/ui/sidebar.tsx';
import { AreaDialog } from '@/features/Area/components/AreaDialog';
import { useGetAreasWithProjectsQuery } from '@/lib/store';

import NewProject from '../../../components/NewProject';
import { AreasEmptyState, AreasLoadingState } from '../../states';
import AreaSection from '../AreaSection';

export default function Areas() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [isOpen, setIsOpen] = useState(true);
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set());
  const [isAreaDialogOpen, setIsAreaDialogOpen] = useState(false);

  const { data: areas, isLoading } = useGetAreasWithProjectsQuery();

  const toggleArea = (areaId: string) => {
    setCollapsedAreas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(areaId)) {
        newSet.delete(areaId);
      } else {
        newSet.add(areaId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return <AreasLoadingState />;
  }

  if (!areas || areas.length === 0) {
    return (
      <>
        <AreasEmptyState onCreateArea={() => setIsAreaDialogOpen(true)} />
        <AreaDialog
          open={isAreaDialogOpen}
          onOpenChange={setIsAreaDialogOpen}
          onSuccess={() => setIsAreaDialogOpen(false)}
        />
      </>
    );
  }

  const sortedAreas = areas
    .map(area => ({
      ...area,
      projects: area.projects ? [...area.projects].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)) : [],
    }))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <DragAndDropContext>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/areas">
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
                        <p className="text-sm font-semibold text-foreground">Areas</p>
                        <p className="text-xs text-muted-foreground">
                          {areas?.length > 1 ? `${areas?.length} areas` : `${areas?.length} area`}
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
                        setIsAreaDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                  {!isCollapsed && (
                    <motion.div animate={{ rotate: 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]/areas:rotate-180" />
                    </motion.div>
                  )}
                </motion.div>
              </CollapsibleTrigger>
            </SidebarGroupLabel>

            <CollapsibleContent>
              <SidebarGroupContent>
                <div className="space-y-1">
                  <AnimatePresence>
                    {sortedAreas.map((area, areaIndex) => (
                      <AreaSection
                        key={area.id}
                        area={area}
                        isCollapsed={isCollapsed}
                        onToggleArea={toggleArea}
                        areaIndex={areaIndex}
                        isAreaCollapsed={collapsedAreas.has(area.id)}
                      />
                    ))}
                  </AnimatePresence>

                  {!isCollapsed && <NewProject />}
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <AreaDialog
          open={isAreaDialogOpen}
          onOpenChange={setIsAreaDialogOpen}
          onSuccess={() => {
            setIsAreaDialogOpen(false);
          }}
        />
      </motion.div>
    </DragAndDropContext>
  );
}
