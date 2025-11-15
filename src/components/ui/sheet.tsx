'use client';

import * as React from 'react';

import * as SheetPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Sheet({
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root> & { 'data-testid'?: string }) {
  return <SheetPrimitive.Root data-slot="sheet" data-testid={testId || 'sheet'} {...props} />;
}

function SheetTrigger({
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger> & { 'data-testid'?: string }) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" data-testid={testId || 'sheet-trigger'} {...props} />;
}

function SheetClose({
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close> & { 'data-testid'?: string }) {
  return <SheetPrimitive.Close data-slot="sheet-close" data-testid={testId || 'sheet-close'} {...props} />;
}

function SheetPortal({
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal> & { 'data-testid'?: string }) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" data-testid={testId || 'sheet-portal'} {...props} />;
}

function SheetOverlay({
  className,
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay> & { 'data-testid'?: string }) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      data-testid={testId || 'sheet-overlay'}
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = 'right',
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  'data-testid'?: string;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-testid={testId || 'sheet-content'}
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
          side === 'right' &&
            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
          side === 'left' &&
            'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
          side === 'top' &&
            'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b',
          side === 'bottom' &&
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t',
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({
  className,
  'data-testid': testId,
  ...props
}: React.ComponentProps<'div'> & { 'data-testid'?: string }) {
  return (
    <div
      data-slot="sheet-header"
      data-testid={testId || 'sheet-header'}
      className={cn('flex flex-col gap-1.5 p-4', className)}
      {...props}
    />
  );
}

function SheetFooter({
  className,
  'data-testid': testId,
  ...props
}: React.ComponentProps<'div'> & { 'data-testid'?: string }) {
  return (
    <div
      data-slot="sheet-footer"
      data-testid={testId || 'sheet-footer'}
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title> & { 'data-testid'?: string }) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      data-testid={testId || 'sheet-title'}
      className={cn('text-foreground font-semibold', className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description> & { 'data-testid'?: string }) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      data-testid={testId || 'sheet-description'}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger };
