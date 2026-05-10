import { motion } from 'framer-motion';

import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar.tsx';

const ShowMore = ({ onClick, label, icon }: { onClick: () => void; label: string; icon: React.ReactNode }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <SidebarMenuItem>
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <SidebarMenuButton
            onClick={onClick}
            className="hover:bg-muted/30 transition-all duration-200 group rounded-lg text-muted-foreground hover:text-foreground"
          >
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-md bg-muted/20 group-hover:bg-muted/40 transition-colors">{icon}</div>
              <span className="text-sm">{label}</span>
            </div>
          </SidebarMenuButton>
        </motion.div>
      </SidebarMenuItem>
    </motion.div>
  );
};

export default ShowMore;
