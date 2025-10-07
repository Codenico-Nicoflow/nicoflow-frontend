import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  acceptButton,
  cancelButton,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md cursor-default">
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {(acceptButton || cancelButton) && (
          <DialogFooter>
            {cancelButton && (
              <Button variant="outline" onClick={cancelButton.onClick}>
                {cancelButton.text}
              </Button>
            )}
            {acceptButton && <Button onClick={acceptButton.onClick}>{acceptButton.text}</Button>}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomDialog;
