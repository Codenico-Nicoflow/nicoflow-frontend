import * as React from 'react';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close asChild>
            <motion.button
              data-slot="dialog-close"
              className={cn(
                'absolute top-4 right-4 z-50',
                'h-8 w-8 rounded-full',
                'bg-background/80 backdrop-blur-sm',
                'border border-border/50',
                'hover:bg-destructive/10 hover:border-destructive/20',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'transition-all duration-200 ease-out',
                'group overflow-hidden',
                'cursor-pointer'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="relative flex items-center justify-center h-full w-full">
                {/* Subtle glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-destructive/20 to-orange-500/20 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />

                {/* Icon with smooth rotation */}
                <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                  <X className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors relative z-10" />
                </motion.div>

                {/* Ripple effect on click */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-destructive/30"
                  initial={{ scale: 0, opacity: 0 }}
                  whileTap={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <span className="sr-only">Close</span>
            </motion.button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
