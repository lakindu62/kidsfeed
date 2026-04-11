import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
          <Button
            key={filter.key}
            type="button"
            variant={filter.active ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'typography-body-sm rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[#1f8a35] focus-visible:ring-offset-2 focus-visible:outline-none',
              filter.active
                ? 'border-[#1f8a35] bg-[#e6f3e6] text-[#16602a] hover:bg-[#d7ecd8]'
                : 'border-[#dde3dd] bg-[#f4f4f2] text-[#556] hover:bg-[#ecece9]',
            )}
            onClick={() => onToggleFilter?.(filter.key)}
            disabled={filter.disabled}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {selectOptions.length > 0 && onSelectChange ? (
        <Select value={selectValue} onValueChange={onSelectChange}>
          <SelectTrigger
            className="typography-body-sm ml-auto min-w-40 rounded-[10px] border border-[#dde3dd] bg-[#f4f4f2] text-[#484]"
            aria-label={selectLabel}
          >
            <SelectValue placeholder={selectLabel || 'Select an option'} />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {onReset ? (
        <Button
          type="button"
          variant="outline"
          className="typography-body-sm inline-flex items-center gap-2 rounded-[10px] border border-[#dde3dd] bg-[#f4f4f2] px-3 py-2 text-[#595] transition-colors hover:bg-[#ecece9] focus-visible:ring-2 focus-visible:ring-[#1f8a35] focus-visible:ring-offset-2 focus-visible:outline-none"
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
