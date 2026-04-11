import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-muted animate-pulse rounded-2xl', className)}
      {...props}
    />
  );
}

export { Skeleton };
