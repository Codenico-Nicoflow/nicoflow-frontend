import { type LucideIcon, MoreVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface ItemAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface ItemActionsMenuProps {
  actions: ItemAction[];
  triggerClassName?: string;
  align?: 'start' | 'center' | 'end';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accessible name for the icon-only trigger button. */
  triggerLabel?: string;
  'data-testid'?: string;
}

export const ItemActionsMenu = ({
  actions,
  triggerClassName,
  align = 'end',
  open,
  onOpenChange,
  triggerLabel = 'Open actions menu',
  'data-testid': testId,
}: ItemActionsMenuProps) => {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} data-testid={testId || 'item-actions-menu'}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={triggerLabel}
          data-testid={testId ? `${testId}-trigger` : 'item-actions-menu-trigger'}
          className={cn('h-8 w-8 sm:h-9 sm:w-9', triggerClassName)}
          onClick={e => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} data-testid={testId ? `${testId}-content` : 'item-actions-menu-content'}>
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            data-testid={`${testId ?? 'item-actions-menu'}-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={action.onClick}
            disabled={action.disabled}
            variant={action.destructive ? 'destructive' : 'default'}
          >
            <action.icon className="me-2 h-4 w-4 text-current" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
