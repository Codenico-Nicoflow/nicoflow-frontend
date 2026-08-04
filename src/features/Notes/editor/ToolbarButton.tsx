import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ToolbarButtonProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  /** Omitted for one-shot actions — aria-pressed only belongs on a toggle. */
  isActive?: boolean;
  disabled?: boolean;
}

// Every control is icon-only, so the label does double duty: aria-label for
// assistive tech, and a hover/focus tooltip for everyone else. A native `title`
// can't do the second job well — it takes ~1s to appear, never shows on
// keyboard focus, and can't be styled.
export const ToolbarButton = ({ label, icon: Icon, onClick, isActive, disabled }: ToolbarButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={label}
        aria-pressed={isActive}
        disabled={disabled}
        onClick={onClick}
        className={cn('h-8 w-8', isActive && 'bg-accent text-accent-foreground')}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);
