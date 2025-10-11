import { useCallback,useState } from 'react';

import type { CustomDialogProps } from '@/components/ui/custom-dialog';

export interface UseCustomDialogOptions {
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

export const useCustomDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<UseCustomDialogOptions>({});

  const openDialog = useCallback((dialogOptions: UseCustomDialogOptions) => {
    setOptions(dialogOptions);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  const dialogProps: CustomDialogProps = {
    open: isOpen,
    onOpenChange: setIsOpen,
    ...options,
  };

  return {
    openDialog,
    closeDialog,
    dialogProps,
    isOpen,
  };
};
