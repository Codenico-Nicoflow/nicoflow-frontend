import * as React from 'react';

import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '@/lib/utils';

function Avatar({
  className,
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & { 'data-testid'?: string }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-testid={testId || 'avatar'}
      className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image> & { 'data-testid'?: string }) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      data-testid={testId || 'avatar-image'}
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback> & { 'data-testid'?: string }) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      data-testid={testId || 'avatar-fallback'}
      className={cn('bg-muted flex size-full items-center justify-center rounded-full', className)}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback, AvatarImage };
