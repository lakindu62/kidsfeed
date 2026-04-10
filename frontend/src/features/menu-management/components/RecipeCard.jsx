import { Clock3, Users2 } from 'lucide-react';
import {
  getRecipePalette,
  getRecipeDietaryBadges,
} from '../utils/recipePresentation';

function RecipeCard({ recipe }) {
  const [startColor, endColor] = getRecipePalette(recipe.name);
  const dietaryBadges = getRecipeDietaryBadges(recipe.dietaryFlags);

  return (
    <article className="overflow-hidden rounded-[20px] border border-[#e6e9e5] bg-[#f8f9f8] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div
        className="relative h-[132px]"
        style={{ '--mm-media-start': startColor, '--mm-media-end': endColor }}
      >
        <div className="absolute top-2 left-2 flex gap-2">
          {dietaryBadges.slice(0, 2).map((badge) => (
            <span
              key={badge}
              className="cursor-default rounded-full bg-[#dcedc8] px-3 py-1 text-xs font-semibold text-[#2f6f33]"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      <div className="px-3 py-3">
        <h3 className="m-0 text-[0.95rem] font-bold tracking-[-0.02em] text-[#2a2a2a]">
          {recipe.name}
        </h3>
        <p className="mt-1.5 mb-2 line-clamp-2 min-h-[2.2rem] overflow-hidden text-[0.77rem] leading-[1.3] text-ellipsis text-[#667]">
          {recipe.description}
        </p>
        <div className="mb-3 flex items-center justify-between text-[0.73rem] text-[#657267]">
          <span className="inline-flex items-center gap-1">
            <Clock3 size={14} />
            {recipe.prepTime || 0} mins
          </span>
          <span className="inline-flex items-center gap-1">
            <Users2 size={14} />
            Serves {recipe.servingSize || 0}
          </span>
        </div>
        <button
          type="button"
          className="w-full rounded-[10px] border border-[#d8ddd7] bg-[#ecf1eb] px-3 py-2 text-sm font-semibold text-[#2d7236] transition-colors hover:bg-[#e2e9e2] focus-visible:ring-2 focus-visible:ring-[#2d7236] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          View Details
        </button>
      </div>
    </article>
  );
}

export default RecipeCard;
