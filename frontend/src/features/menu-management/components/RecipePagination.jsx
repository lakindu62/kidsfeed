function RecipePagination({
  page,
  totalPages,
  pageNumbers,
  onPrevious,
  onPageSelect,
  onNext,
  ariaLabel = 'Pagination',
  previousLabel = '<',
  nextLabel = '>',
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="mx-auto mt-4 flex w-fit gap-1 rounded-[16px] border border-[#e6e9e5] bg-[#f7f7f7] p-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="h-8 min-w-8 rounded-[8px] px-2 font-semibold text-[#596] transition-colors hover:bg-[#ecece9] disabled:cursor-not-allowed disabled:opacity-45"
        onClick={onPrevious}
        disabled={page === 1}
      >
        {previousLabel}
      </button>

      {pageNumbers.map((number) => (
        <button
          key={number}
          type="button"
          className={`h-8 min-w-8 rounded-[8px] px-2 font-semibold transition-colors ${
            number === page
              ? 'bg-[#0f7d2a] text-white'
              : 'text-[#596] hover:bg-[#ecece9]'
          }`}
          onClick={() => onPageSelect(number)}
        >
          {number}
        </button>
      ))}

      <button
        type="button"
        className="h-8 min-w-8 rounded-[8px] px-2 font-semibold text-[#596] transition-colors hover:bg-[#ecece9] disabled:cursor-not-allowed disabled:opacity-45"
        onClick={onNext}
        disabled={page === totalPages}
      >
        {nextLabel}
      </button>
    </nav>
  );
}

export default RecipePagination;
