import * as React from 'react';

import { AnimatePresence, motion } from 'framer-motion';

export interface AnimatedListItemProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  className?: string;
  'data-testid'?: string;
}

export const AnimatedListItem = ({
  children,
  index = 0,
  delay = 0.02,
  className,
  'data-testid': testId,
}: AnimatedListItemProps) => {
  return (
    <AnimatePresence>
      <motion.div
        data-testid={testId || 'animated-list-item'}
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
