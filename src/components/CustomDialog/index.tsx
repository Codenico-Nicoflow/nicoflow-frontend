import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DIALOG_ACCEPT_BUTTON, DIALOG_CANCEL_BUTTON } from '@/lib/test_ids';

export interface CustomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  acceptButton?: {
    text: string;
    onClick: () => void;
  };
  cancelButton?: {
    text: string;
    onClick: () => void;
  };
  'data-testid'?: string;
}

export const CustomDialog: React.FC<CustomDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  acceptButton,
  cancelButton,
  'data-testid': testId,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} data-testid={testId || 'custom-dialog'}>
      <DialogContent
        data-testid={testId ? `${testId}-content` : 'custom-dialog-content'}
        className="sm:max-w-md cursor-default"
      >
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {(acceptButton || cancelButton) && (
          <DialogFooter>
            {cancelButton && (
              <Button variant="outline" data-testid={DIALOG_CANCEL_BUTTON} onClick={cancelButton.onClick}>
                {cancelButton.text}
              </Button>
            )}
            {acceptButton && (
              <Button data-testid={DIALOG_ACCEPT_BUTTON} onClick={acceptButton.onClick}>
                {acceptButton.text}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
