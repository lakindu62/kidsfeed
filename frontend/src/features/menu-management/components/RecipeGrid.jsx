import RecipeCard from './RecipeCard';

function RecipeGrid({
  recipes,
  items,
  renderItem,
  getItemKey,
  emptyMessage = 'No recipes match your current filters.',
}) {
  const data = items || recipes || [];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {data.map((entry, index) => {
        const key = getItemKey
          ? getItemKey(entry, index)
          : entry.id || entry.name || index;

        if (renderItem) {
          return <div key={key}>{renderItem(entry, index)}</div>;
        }

        return <RecipeCard key={key} item={entry} />;
      })}

      {data.length === 0 ? (
        <div className="col-span-full rounded-[20px] border border-[#e6e9e5] bg-[#f7f7f7] px-4 py-5 text-center text-[#677067] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {emptyMessage}
        </div>
      ) : null}
    </section>
  );
}

export default RecipeGrid;
