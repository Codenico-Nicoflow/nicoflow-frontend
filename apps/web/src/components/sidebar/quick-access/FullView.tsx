import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '@/components/ui/sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ChevronDown } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Link } from 'react-router-dom';
import { type QuickAccessItem } from '../data';

const FullView = ({
  selectedItem,
  setSelectedItem,
  quickAccessItems,
}: {
  selectedItem: number;
  setSelectedItem: (index: number) => void;
  quickAccessItems: QuickAccessItem[];
}) => {
  return (
    <Collapsible defaultOpen className="group/quick-access">
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger asChild>
            <motion.div
              className="flex items-center mb-2 cursor-pointer justify-between w-full hover:bg-accent/50 transition-all duration-200 px-2 py-2 rounded-lg group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Quick Access</p>
              </div>
              <motion.div animate={{ rotate: 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]/quick-access:rotate-180" />
              </motion.div>
            </motion.div>
          </CollapsibleTrigger>
        </SidebarGroupLabel>

        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <AnimatePresence>
                {quickAccessItems.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <SidebarMenuItem>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <SidebarMenuButton
                          asChild
                          onClick={() => setSelectedItem(index)}
                          className={`hover:bg-accent/50 transition-all duration-200 rounded-lg user-select-none ${
                            selectedItem === index ? 'bg-primary/80 text-primary-foreground' : ''
                          }`}
                        >
                          <Link
                            to={item.url}
                            className="flex items-center gap-2 px-2 py-1 text-muted-foreground hover:text-white transition-colors user-select-none"
                          >
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                              <item.icon className="w-4 h-4 user-select-none" />
                            </motion.div>
                            <span className="user-select-none">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </motion.div>
                    </SidebarMenuItem>
                  </motion.div>
                ))}
              </AnimatePresence>
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
};

export default FullView;
