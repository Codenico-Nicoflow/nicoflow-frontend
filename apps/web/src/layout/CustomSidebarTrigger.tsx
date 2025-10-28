import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/useMobile';
import { cn } from '@/lib/utils';

export function CustomSidebarTrigger() {
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-4 left-4 z-50"
      >
        <Button
          onClick={toggleSidebar}
          size="icon"
          className={cn(
            'h-12 w-12 rounded-full shadow-lg',
            'bg-background border-2 border-border',
            'hover:bg-accent hover:scale-105',
            'active:scale-95',
            'transition-all duration-200',
            'group'
          )}
        >
          <Menu className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
        </Button>
      </motion.div>
    );
  }

  return (
    <Button
      onClick={toggleSidebar}
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8 rounded-md mb-4', 'hover:bg-muted/50', 'transition-all duration-200 ease-out', 'group')}
    >
      <Menu className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </Button>
  );
}
