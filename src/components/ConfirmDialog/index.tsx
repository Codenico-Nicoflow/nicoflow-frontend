import * as React from 'react';

import { motion } from 'framer-motion';
import { Loader2, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CONFIRM_DIALOG_CANCEL_BUTTON, CONFIRM_DIALOG_CONFIRM_BUTTON } from '@/lib/test_ids';
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
  'data-testid'?: string;
}

const variantStyles = {
  danger: {
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
  },
  warning: {
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  info: {
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
};

export const ConfirmDialog = ({
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
  'data-testid': testId,
}: ConfirmDialogProps) => {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  const styles = variantStyles[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange} data-testid={testId || 'confirm-dialog'}>
      <DialogContent
        data-testid={testId ? `${testId}-content` : 'confirm-dialog-content'}
        className="w-[95vw] max-w-md p-0 border border-border shadow-lg sm:rounded-lg rounded-none"
      >
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
            data-testid={CONFIRM_DIALOG_CANCEL_BUTTON}
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-1/2 h-10"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            data-testid={CONFIRM_DIALOG_CONFIRM_BUTTON}
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-1/2 h-10"
          >
            {isLoading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {confirmLabel}...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
