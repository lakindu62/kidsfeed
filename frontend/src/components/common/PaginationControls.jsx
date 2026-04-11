import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function PaginationControls({
  page,
  totalPages,
  pageNumbers = [],
  onPrevious,
  onPageSelect,
  onNext,
  ariaLabel = 'Pagination',
  className,
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className={cn(
        'mx-auto mt-4 flex w-fit gap-1 rounded-[16px] border border-[#e6e9e5] bg-[#f7f7f7] p-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        className,
      )}
      aria-label={ariaLabel}
    >
      <Button
        type="button"
        variant="ghost"
        className="h-8 min-w-8 rounded-[8px] px-2 font-semibold text-[#596] transition-colors hover:bg-[#ecece9] disabled:cursor-not-allowed disabled:opacity-45"
        onClick={onPrevious}
        disabled={page === 1}
      >
        &lt;
      </Button>

      {pageNumbers.map((number) => (
        <Button
          key={number}
          type="button"
          variant={number === page ? 'default' : 'ghost'}
          className={cn(
            'h-8 min-w-8 rounded-[8px] px-2 font-semibold transition-colors',
            number === page
              ? 'bg-[#0f7d2a] text-white hover:bg-[#0f7d2a]'
              : 'text-[#596] hover:bg-[#ecece9]',
          )}
          onClick={() => onPageSelect(number)}
        >
          {number}
        </Button>
      ))}

      <Button
        type="button"
        variant="ghost"
        className="h-8 min-w-8 rounded-[8px] px-2 font-semibold text-[#596] transition-colors hover:bg-[#ecece9] disabled:cursor-not-allowed disabled:opacity-45"
        onClick={onNext}
        disabled={page === totalPages}
      >
        &gt;
      </Button>
    </nav>
  );
}

export default PaginationControls;
