import {
  SidebarGroup,
  SidebarMenu,
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { QuickAccessItem } from '../data';

const CollapsedQuickAccess = ({
  selectedItem,
  quickAccessItems,
}: {
  selectedItem: number;
  quickAccessItems: QuickAccessItem[];
}) => {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1">
          {quickAccessItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <SidebarMenuItem>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex justify-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <SidebarMenuButton
                      asChild
                      className={`hover:bg-transparent active:text-primary active:bg-transparent hover:text-primary transition-all duration-200 group rounded-full w-8 h-8 p-0 justify-center ${
                        selectedItem === index ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <Link to={item.url}>
                        <item.icon className="w-4 h-4 hover:text-primary active:text-primary" />
                      </Link>
                    </SidebarMenuButton>
                  </motion.div>
                </motion.div>
              </SidebarMenuItem>
            </motion.div>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default CollapsedQuickAccess;
