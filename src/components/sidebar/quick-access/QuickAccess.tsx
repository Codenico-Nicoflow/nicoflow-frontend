import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

import { useSidebar } from '../../ui/sidebar';
import { quickAccessItems } from '../data';

import CollapsedQuickAccess from './CollapsedQuickAccess';
import FullView from './FullView';

export const QuickAccess = () => {
  const { state } = useSidebar();
  const [selectedItem, setSelectedItem] = useState<number>(0);
  const location = useLocation();
  const isCollapsed = state === 'collapsed';
  const currentItem = quickAccessItems.findIndex(item => item.url === location.pathname);

  useEffect(() => {
    setSelectedItem(currentItem);
  }, [currentItem]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      {isCollapsed ? (
        <CollapsedQuickAccess selectedItem={selectedItem} quickAccessItems={quickAccessItems} />
      ) : (
        <FullView selectedItem={selectedItem} setSelectedItem={setSelectedItem} quickAccessItems={quickAccessItems} />
      )}
    </motion.div>
  );
};

export default QuickAccess;
