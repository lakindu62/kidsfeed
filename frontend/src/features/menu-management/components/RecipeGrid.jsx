import RecipeCard from './RecipeCard';

function RecipeGrid({
  recipes,
  emptyMessage = 'No recipes match your current filters.',
}) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id || recipe.name} recipe={recipe} />
      ))}

      {recipes.length === 0 ? (
        <div className="col-span-full rounded-[20px] border border-[#e6e9e5] bg-[#f7f7f7] px-4 py-5 text-center text-[#677067] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {emptyMessage}
        </div>
      ) : null}
    </section>
  );
}

export default RecipeGrid;
