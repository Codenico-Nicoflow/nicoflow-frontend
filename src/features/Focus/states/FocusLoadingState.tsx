import { motion } from 'framer-motion';

import { ListItemCard } from '@/components';
import { Skeleton } from '@/components/ui/skeleton';

interface FocusLoadingStateProps {
  /** How many placeholder rows to show — matches the ranked shortlist length. */
  count?: number;
}

// Shown while the ranked shortlist is being calculated: skeleton rows mirroring
// FocusTaskRow so the layout doesn't jump when the real list arrives.
const FocusLoadingState = ({ count = 3 }: FocusLoadingStateProps) => {
  return (
    <div className="space-y-3 sm:space-y-4" data-testid="focus-loading" aria-busy>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <ListItemCard variant="default" borderColor="primary">
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-9 w-9 rounded-md flex-shrink-0" />
            </div>
          </ListItemCard>
        </motion.div>
      ))}
    </div>
  );
};

export default FocusLoadingState;
