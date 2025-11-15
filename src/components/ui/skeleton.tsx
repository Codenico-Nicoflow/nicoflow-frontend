import { cn } from '@/lib/utils';

function Skeleton({
  className,
  'data-testid': testId,
  ...props
}: React.ComponentProps<'div'> & { 'data-testid'?: string }) {
  return (
    <div
      data-slot="skeleton"
      data-testid={testId || 'skeleton'}
      className={cn('bg-accent animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
