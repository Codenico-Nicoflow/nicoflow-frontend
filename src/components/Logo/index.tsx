import { cn } from '@/lib/utils';

const RING = 'M49.2 20A21 21 0 1 0 49.2 44';
const FLOW = 'M20 37C27 37 27 26 34 26C40 26 41 32 47 32H56';

type LogoVariant = 'mark' | 'lockup' | 'stacked';

interface LogoProps {
  /** mark only, horizontal lockup, or stacked lockup */
  variant?: LogoVariant;
  /** height of the mark in px */
  size?: number;
  /** render in a single colour (inherits currentColor) */
  mono?: boolean;
  className?: string;
}

function Mark({ size, mono }: { size: number; mono?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={mono ? 'text-current' : 'text-indigo-600 dark:text-indigo-400'}
    >
      <path d={RING} stroke="currentColor" strokeWidth={5} strokeLinecap="round" />
      <path
        d={FLOW}
        stroke="currentColor"
        strokeWidth={5}
        strokeLinecap="round"
        className={mono ? undefined : 'text-indigo-500'}
      />
    </svg>
  );
}

function Wordmark({ size }: { size: number }) {
  return (
    <span
      className="font-mono font-semibold uppercase leading-none tracking-[0.2em] text-slate-900 dark:text-slate-200"
      style={{ fontSize: Math.round(size * 0.5) }}
    >
      Nicoflow
    </span>
  );
}

export function Logo({ variant = 'lockup', size = 28, mono, className }: LogoProps) {
  if (variant === 'mark') {
    return (
      <span className={cn('inline-flex', className)}>
        <Mark size={size} mono={mono} />
      </span>
    );
  }

  if (variant === 'stacked') {
    return (
      <span className={cn('inline-flex flex-col items-center gap-3', className)}>
        <Mark size={size} mono={mono} />
        <span
          className="font-mono font-semibold uppercase leading-none tracking-[0.28em] text-slate-900 dark:text-slate-200"
          style={{ fontSize: Math.round(size * 0.25) }}
        >
          Nicoflow
        </span>
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Mark size={size} mono={mono} />
      <Wordmark size={size} />
    </span>
  );
}

export default Logo;
