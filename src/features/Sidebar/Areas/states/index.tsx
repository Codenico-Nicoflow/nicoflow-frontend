import { motion } from 'framer-motion';
import { FolderOpen, Loader2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

interface AreasEmptyStateProps {
  onCreateArea?: () => void;
}

export function AreasLoadingState() {
  const { state } = useSidebar();
  const sidebarCollapsed = state === 'collapsed';

  if (sidebarCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex justify-center p-4"
      >
        <div className="p-3 rounded-xl bg-muted/30">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="p-6"
    >
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-muted/40">
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <div className="h-4 w-20 bg-muted/40 rounded animate-pulse"></div>
            <div className="h-3 w-16 bg-muted/30 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Loading skeleton items */}
        <div className="space-y-3 ml-6">
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/20"
            >
              <div className="p-1.5 rounded-lg bg-muted/40">
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-muted/40 rounded animate-pulse"></div>
                <div className="h-2 w-16 bg-muted/30 rounded animate-pulse"></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="flex items-center justify-center gap-2 pt-2"
        >
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          <span className="text-sm text-muted-foreground">Loading areas...</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function AreasEmptyState({ onCreateArea }: AreasEmptyStateProps) {
  const { state } = useSidebar();
  const sidebarCollapsed = state === 'collapsed';

  if (sidebarCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex justify-center p-4"
      >
        <div className="p-3 rounded-xl bg-muted/20">
          <FolderOpen className="w-5 h-5 text-muted-foreground" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="p-6"
    >
      <div className="text-center space-y-4">
        {/* Icon with subtle animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 border border-muted/20">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 rounded-2xl bg-primary/10"
            />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="space-y-2"
        >
          <h3 className="text-sm font-semibold text-foreground">No areas yet</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Create your first area to organize your projects and get started with NicoFlow.
          </p>
        </motion.div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="pt-2"
        >
          <Button size="sm" onClick={onCreateArea} className="gap-2" data-testid="areas-empty-create">
            <Plus className="w-4 h-4" />
            Create your first Area
          </Button>
        </motion.div>

        {/* Decorative elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="flex justify-center gap-1 pt-2"
        >
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
              className="w-1 h-1 rounded-full bg-muted-foreground/30"
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
