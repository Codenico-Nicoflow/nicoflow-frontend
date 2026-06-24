import * as React from 'react';

import { motion } from 'framer-motion';
import { Loader2, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FORM_DIALOG_CANCEL_BUTTON, FORM_DIALOG_SUBMIT_BUTTON } from '@/lib/test_ids';
import { cn } from '@/lib/utils';

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  isEditMode?: boolean;
  isLoading?: boolean;
  hasChanges?: boolean;
  onSubmit: (e?: React.FormEvent) => void;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  'data-testid'?: string;
}

const maxWidthClasses = {
  sm: 'sm:max-w-[400px]',
  md: 'sm:max-w-[500px]',
  lg: 'sm:max-w-[650px]',
  xl: 'sm:max-w-[800px]',
  '2xl': 'sm:max-w-[900px]',
};

export const FormDialog = ({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  isEditMode = false,
  isLoading = false,
  hasChanges = true,
  onSubmit,
  children,
  maxWidth = 'lg',
  'data-testid': testId,
}: FormDialogProps) => {
  const { t } = useTranslation('common');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} data-testid={testId || 'form-dialog'}>
      <DialogContent
        data-testid={testId ? `${testId}-content` : 'form-dialog-content'}
        className={cn(
          'w-[95vw] p-0 border border-border shadow-lg sm:rounded-lg rounded-none max-h-[90vh] overflow-hidden flex flex-col',
          maxWidthClasses[maxWidth]
        )}
      >
        <DialogHeader className="p-4 sm:p-6 pb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3"
          >
            {Icon && (
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            )}
            <div>
              <DialogTitle className="text-base sm:text-lg font-semibold text-foreground">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </motion.div>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 space-y-4 pb-6">{children}</div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              data-testid={FORM_DIALOG_CANCEL_BUTTON}
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-1/2 h-10"
            >
              {t('actions.cancel')}
            </Button>
            <Button
              type="submit"
              data-testid={FORM_DIALOG_SUBMIT_BUTTON}
              disabled={isLoading || !hasChanges}
              className="w-full sm:w-1/2 h-10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {isEditMode ? t('actions.saving') : t('actions.creating')}
                </>
              ) : (
                <>{isEditMode ? t('actions.save') : t('actions.create')}</>
              )}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
};
