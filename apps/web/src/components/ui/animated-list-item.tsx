import * as React from 'react';

import { AnimatePresence, motion } from 'framer-motion';

export interface AnimatedListItemProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  className?: string;
}

const AnimatedListItem = ({ children, index = 0, delay = 0.02, className }: AnimatedListItemProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
        transition={{ duration: 0.2, delay: index * delay }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export { AnimatedListItem };
