import { cn } from '../../../lib/utils';

/** Main green CTA — generous padding so label never touches edges. */
export const mealPrimaryButtonClass = cn(
  'box-border inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border-0 bg-gradient-to-br from-[#116e20] to-[#006117] px-6 py-2.5 text-sm font-semibold tracking-normal text-white shadow-[0px_8px_20px_-8px_rgba(0,97,23,0.45)] transition-all',
  'hover:translate-y-[-1px] hover:shadow-[0px_12px_24px_-8px_rgba(0,97,23,0.55)]',
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#116e20]/50 focus-visible:ring-offset-2',
);

/** Smaller variant (roster row actions). */
export const mealPrimaryButtonCompactClass = cn(
  mealPrimaryButtonClass,
  'h-9 min-h-9 rounded-lg px-4 py-2 text-xs leading-tight shadow-sm hover:translate-y-0',
);
