/** Invisible native date input overlay (custom calendar UI). */
export const mealDistributionDateInputOverlayClassName = [
  'absolute inset-0 h-full w-full cursor-pointer opacity-0',
  'appearance-none [color-scheme:light]',
  '[&::-webkit-calendar-picker-indicator]:pointer-events-none',
  '[&::-webkit-calendar-picker-indicator]:opacity-0',
].join(' ');
