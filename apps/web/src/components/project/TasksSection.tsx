import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckSquare, Plus, Calendar, Target, Sparkles } from 'lucide-react';

interface TasksSectionProps {
  projectId: number;
}

const TasksSection = ({ projectId }: TasksSectionProps) => {
  console.log(projectId);
  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="max-w-4xl mx-auto"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Tasks</h2>
              <p className="text-sm text-muted-foreground">Manage your project tasks</p>
            </div>
          </div>

          <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Empty State */}
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
                <h3 className="text-xl font-semibold text-foreground">No tasks yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Start organizing your work by creating your first task. Break down your project into manageable
                  pieces.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="mt-8"
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Task
                </Button>
              </motion.div>

              {/* Feature highlights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-medium text-sm">Set Deadlines</h4>
                  <p className="text-xs text-muted-foreground">Track due dates and stay on schedule</p>
                </div>

                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-medium text-sm">Track Progress</h4>
                  <p className="text-xs text-muted-foreground">Monitor completion and stay focused</p>
                </div>

                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-medium text-sm">Stay Organized</h4>
                  <p className="text-xs text-muted-foreground">Keep everything structured and clear</p>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TasksSection;
