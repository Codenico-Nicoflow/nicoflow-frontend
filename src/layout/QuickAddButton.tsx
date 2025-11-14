import { useState } from 'react';

import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BucketQuickInput from '@/features/bucket/components/BucketQuickInput';
import { cn } from '@/lib/utils';

const QuickAddButton = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  if (location.pathname === '/quick-access/bucket') {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className={cn(
            'h-14 w-14 rounded-full shadow-lg',
            'hover:scale-110 active:scale-95',
            'transition-all duration-200',
            'group'
          )}
        >
          <Inbox className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </Button>
      </motion.div>

      {/* Quick Add Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary" />
              Quick Add to Bucket
            </DialogTitle>
            <DialogDescription>Capture your thoughts quickly from anywhere.</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <BucketQuickInput onSuccess={() => setIsOpen(false)} placeholder="What's on your mind?" compact />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickAddButton;
