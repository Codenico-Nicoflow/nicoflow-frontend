import * as React from 'react';

import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | React.ReactNode;
  icon?: LucideIcon;
  variant?: 'warning' | 'danger' | 'info';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  destructive?: boolean;
}

const variantStyles = {
  danger: {
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    iconBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  info: {
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  variant = 'danger',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isLoading = false,
  destructive = false,
}: ConfirmDialogProps) => {
  const handleConfirm = async () => {
    await onConfirm();
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  const styles = variantStyles[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md p-0 border-0 shadow-2xl sm:rounded-lg rounded-none">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 mb-4"
          >
            {Icon && (
              <div className={cn('p-2 rounded-lg', styles.iconBg)}>
                <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', styles.iconColor)} />
              </div>
            )}
            <div>
              <DialogTitle className="text-base sm:text-lg font-semibold text-foreground">{title}</DialogTitle>
            </div>
          </motion.div>
          <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 pt-4"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-1/2 h-9 sm:h-10"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-1/2 h-9 sm:h-10"
          >
            {isLoading ? 'Loading...' : confirmLabel}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export { ConfirmDialog };
