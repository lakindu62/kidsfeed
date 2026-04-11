import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';

function FilterBar({
  filters = [],
  onToggleFilter,
  selectValue,
  onSelectChange,
  selectOptions = [],
  selectLabel,
  onReset,
  resetLabel = 'Reset Filters',
  className,
}) {
  return (
    <section
      className={cn(
        'mb-4 flex flex-wrap items-center gap-3 rounded-[20px] border border-[#e6e9e5] bg-[#f7f7f7] p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        className,
      )}
    >
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={cn(
              'rounded-full border px-3 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#1f8a35] focus-visible:ring-offset-2 focus-visible:outline-none',
              filter.active
                ? 'border-[#1f8a35] bg-[#e6f3e6] text-[#16602a]'
                : 'border-[#dde3dd] bg-[#f4f4f2] text-[#556] hover:bg-[#ecece9]',
            )}
            onClick={() => onToggleFilter?.(filter.key)}
            disabled={filter.disabled}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {selectOptions.length > 0 && onSelectChange ? (
        <select
          className="ml-auto rounded-[10px] border border-[#dde3dd] bg-[#f4f4f2] px-3 py-2 text-sm text-[#484] focus-visible:ring-2 focus-visible:ring-[#1f8a35] focus-visible:ring-offset-2 focus-visible:outline-none"
          value={selectValue}
          aria-label={selectLabel}
          onChange={(event) => onSelectChange(event.target.value)}
        >
          {selectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}

      {onReset ? (
        <Button
          type="button"
          variant="outline"
          className="inline-flex items-center gap-2 rounded-[10px] border border-[#dde3dd] bg-[#f4f4f2] px-3 py-2 text-sm font-medium text-[#595] transition-colors hover:bg-[#ecece9] focus-visible:ring-2 focus-visible:ring-[#1f8a35] focus-visible:ring-offset-2 focus-visible:outline-none"
          onClick={onReset}
        >
          <RotateCcw size={14} />
          {resetLabel}
        </Button>
      ) : null}
    </section>
  );
}

export default FilterBar;
