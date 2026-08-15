import { motion } from 'framer-motion';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TasksLoadingStateProps {
  /** Row count — fewer for an in-flight next-page fetch than a first load. */
  count?: number;
}

const TasksLoadingState = ({ count = 4 }: TasksLoadingStateProps) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card>
            <CardContent>
              <div className="flex items-center justify-between px-4">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-1/8" />

                  <Skeleton className="h-4 w-1/5" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md scale-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default TasksLoadingState;
