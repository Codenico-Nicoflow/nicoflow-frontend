import { motion } from 'framer-motion';
import { CheckSquare, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TasksEmptyStateProps {
  onAddTask?: () => void;
}

const TasksEmptyState = ({ onAddTask }: TasksEmptyStateProps) => {
  const { t } = useTranslation('task');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="border-dashed border-2 border-muted-foreground/25 bg-gradient-to-br from-muted/20 to-muted/10">
        <CardContent className="p-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            className="mb-6"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
              <CheckSquare className="h-10 w-10 text-primary" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-foreground">{t('empty.title')}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">{t('empty.description')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-8"
          >
            <Button
              onClick={onAddTask}
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-5 w-5 me-2" />
              {t('empty.createFirstTask')}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TasksEmptyState;
