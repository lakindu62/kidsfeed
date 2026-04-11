import { cn } from '@/lib/utils';

function CardGrid({
  items = [],
  renderItem,
  emptyMessage = 'No items match your current filters.',
  columnsClassName = 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4',
  className,
  emptyStateClassName,
}) {
  return (
    <section className={cn(columnsClassName, className)}>
      {items.map((item, index) => renderItem?.(item, index))}

      {items.length === 0 ? (
        <div
          className={cn(
            'col-span-full rounded-[20px] border border-[#e6e9e5] bg-[#f7f7f7] px-4 py-5 text-center text-[#677067] shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
            emptyStateClassName,
          )}
        >
          {emptyMessage}
        </div>
      ) : null}
    </section>
  );
}

export default CardGrid;
