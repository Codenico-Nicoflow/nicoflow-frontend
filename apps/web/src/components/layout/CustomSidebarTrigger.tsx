import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

import { Button } from '../ui/button';

export function CustomSidebarTrigger() {
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Button
      onClick={toggleSidebar}
      variant="ghost"
      size="icon"
      className={cn(
        'relative h-10 w-10 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5',
        'hover:border-primary/40 hover:bg-gradient-to-br hover:from-primary/20 hover:to-primary/10',
        'transition-all duration-200 ease-out shadow-sm hover:shadow-md',
        'group'
      )}
    >
      <motion.div
        className="flex items-center justify-center"
        animate={{ rotate: isCollapsed ? 0 : 180 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {isCollapsed ? (
          <Menu className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
        ) : (
          <X className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
        )}
      </motion.div>
    </Button>
  );
}
