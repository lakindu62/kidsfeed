import { RotateCcw } from 'lucide-react';

function RecipeFilters({
  filters,
  onToggleFilter,
  course,
  onCourseChange,
  courseOptions,
  onReset,
  chips,
  selectedOption,
  onOptionChange,
  options,
  resetLabel = 'Reset Filters',
}) {
  const activeChips = chips || filters || [];
  const activeOptions = options || courseOptions || [];
  const currentOption = selectedOption ?? course ?? '';
  const handleOptionChange = onOptionChange || onCourseChange;

  return (
    <section className="mb-4 flex flex-wrap items-center gap-3 rounded-[20px] border border-[#e6e9e5] bg-[#f7f7f7] p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap gap-2">
        {activeChips.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={`rounded-full border px-3 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#1f8a35] focus-visible:ring-offset-2 focus-visible:outline-none ${
              filter.active
                ? 'border-[#1f8a35] bg-[#e6f3e6] text-[#16602a]'
                : 'border-[#dde3dd] bg-[#f4f4f2] text-[#556] hover:bg-[#ecece9]'
            }`}
            onClick={() => onToggleFilter(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {activeOptions.length > 0 && handleOptionChange ? (
        <select
          className="ml-auto rounded-[10px] border border-[#dde3dd] bg-[#f4f4f2] px-3 py-2 text-sm text-[#484] focus-visible:ring-2 focus-visible:ring-[#1f8a35] focus-visible:ring-offset-2 focus-visible:outline-none"
          value={currentOption}
          onChange={(event) => handleOptionChange(event.target.value)}
        >
          {activeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-[10px] border border-[#dde3dd] bg-[#f4f4f2] px-3 py-2 text-sm font-medium text-[#595] transition-colors hover:bg-[#ecece9] focus-visible:ring-2 focus-visible:ring-[#1f8a35] focus-visible:ring-offset-2 focus-visible:outline-none"
        onClick={onReset}
      >
        <RotateCcw size={14} />
        {resetLabel}
      </button>
    </section>
  );
}

export default RecipeFilters;
