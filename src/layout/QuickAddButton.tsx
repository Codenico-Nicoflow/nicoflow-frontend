import { useState } from 'react';

import { motion } from 'framer-motion';
import { Inbox, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { matchPath, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BucketQuickInput } from '@/features/Bucket/components/BucketQuickInput';
import TaskQuickAdd from '@/features/Tasks/components/TaskQuickAdd';
import { useIsMobile } from '@/hooks';
import { cn } from '@/lib/utils';

const QuickAddButton = () => {
  const { t } = useTranslation('task');
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // On a project page the FAB captures a task into that project;
  // everywhere else it stays the bucket capture.
  const projectMatch = matchPath('/projects/:projectId', location.pathname);
  const projectId = projectMatch?.params.projectId;

  // Bucket already is the capture surface; on /ai the FAB sits on top of the
  // composer's send button and swallows the click.
  if (location.pathname === '/quick-access/bucket' || location.pathname.startsWith('/ai')) {
    return null;
  }

  const Icon = projectId ? Plus : Inbox;

  return (
    <>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className={cn('fixed right-6 z-40', isMobile ? 'bottom-20' : 'bottom-6')}
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          aria-label={projectId ? t('quickAdd.fabTask') : t('quickAdd.fabBucket')}
          data-testid="quick-add-fab"
          className={cn(
            'h-14 w-14 rounded-full shadow-lg',
            'hover:scale-110 active:scale-95',
            'transition-all duration-200',
            'group'
          )}
        >
          <Icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </Button>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              {projectId ? t('quickAdd.fabTask') : t('quickAdd.fabBucket')}
            </DialogTitle>
            <DialogDescription>
              {projectId ? t('quickAdd.fabTaskDescription') : t('quickAdd.fabBucketDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {projectId ? (
              <TaskQuickAdd projectId={projectId} onCreated={() => setIsOpen(false)} />
            ) : (
              <BucketQuickInput
                onSuccess={() => setIsOpen(false)}
                placeholder={t('quickAdd.fabBucketPlaceholder')}
                compact
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickAddButton;
