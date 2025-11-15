import * as React from 'react';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils';

function TooltipProvider({
  delayDuration = 0,
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider> & { 'data-testid'?: string }) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      data-testid={testId || 'tooltip-provider'}
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root> & { 'data-testid'?: string }) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" data-testid={testId || 'tooltip'} {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger> & { 'data-testid'?: string }) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" data-testid={testId || 'tooltip-trigger'} {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & { 'data-testid'?: string }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        data-testid={testId || 'tooltip-content'}
        sideOffset={sideOffset}
        className={cn(
          'bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance',
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
