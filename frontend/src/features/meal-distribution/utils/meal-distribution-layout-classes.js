/**
 * Tailwind-only layout for meal-distribution screens (replaces meal-distribution.css).
 * Do not use `[&_button]:bg-*` / `[&_button]:text-*` here — those override every nested
 * button (including `mealPrimaryButtonClass`) and made CTAs look unchanged / broken.
 */
export const mealDistributionRootClassName = [
  'min-h-screen bg-[#f6f6f6] text-zinc-900',
].join(' ');

/** Invisible native date input overlay (custom calendar UI). */
export const mealDistributionDateInputOverlayClassName = [
  'absolute inset-0 h-full w-full cursor-pointer opacity-0',
  'appearance-none [color-scheme:light]',
  '[&::-webkit-calendar-picker-indicator]:pointer-events-none',
  '[&::-webkit-calendar-picker-indicator]:opacity-0',
].join(' ');
