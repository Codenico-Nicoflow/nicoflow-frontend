import React, { useState } from 'react';

import { Edit, MoreVertical, Trash2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import { CustomDialog } from '@/components/CustomDialog';
import { Button } from '@/components/ui/button.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { useCustomDialog } from '@/hooks/useCustomDialog.ts';
import { areaApi, invalidateApiTags, useDeleteAreaMutation } from '@/lib/store';
import type { IArea } from '@/lib/types';
import { showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';

interface AreaContextMenuProps {
  area: IArea;
  onEdit: (area: IArea) => void;
}

export const AreaContextMenu: React.FC<AreaContextMenuProps> = ({ area, onEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteArea, { isLoading: isDeleteLoading }] = useDeleteAreaMutation();
  const dispatch = useDispatch();
  const { openDialog, closeDialog, dialogProps } = useCustomDialog();

  const handleEdit = () => {
    onEdit(area);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteArea(area.id).unwrap();
      invalidateApiTags(dispatch, areaApi, ['Area']);
      showSuccessToast(ToastMessages.AREA_DELETED, toast);
    } catch (error) {
      showErrorToast(error, toast);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DropdownMenu>
      <CustomDialog {...dialogProps} />
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-100 sm:opacity-0 group-hover/area:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
          onClick={e => e.stopPropagation()}
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
          <Edit className="h-4 w-4 mr-2" />
          Edit Area
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openDialog({
              title: 'Delete Area',
              description: 'Are you sure you want to delete this Area?',
              acceptButton: {
                text: 'Delete',
                onClick: handleDelete,
              },
              cancelButton: {
                text: 'Cancel',
                onClick: closeDialog,
              },
            })
          }
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          disabled={isDeleting || isDeleteLoading}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isDeleting || isDeleteLoading ? 'Deleting...' : 'Delete Area'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
