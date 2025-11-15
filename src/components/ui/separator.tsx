import * as React from 'react';

import * as SeparatorPrimitive from '@radix-ui/react-separator';

import { cn } from '@/lib/utils';

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root> & { 'data-testid'?: string }) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      data-testid={testId || 'separator'}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className
      )}
      {...props}
    />
  );
}

export { Separator };
