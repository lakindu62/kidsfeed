import { Clock3, Users2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getRecipePalette,
  getRecipeDietaryBadges,
} from '../utils/recipePresentation';

function RecipeCard({
  recipe,
  item,
  titleField = 'name',
  descriptionField = 'description',
  imageField = 'imageUrl',
  leftMetricField = 'prepTime',
  rightMetricField = 'servingSize',
  leftMetricLabel = 'mins',
  rightMetricPrefix = 'Serves',
  badgesField = 'dietaryFlags',
  getBadges = getRecipeDietaryBadges,
  getPalette = getRecipePalette,
  maxBadges = Infinity,
  detailsLabel = 'View Details',
  detailsPathBuilder,
}) {
  const data = item || recipe || {};
  const title = data[titleField] || 'Untitled Item';
  const description = data[descriptionField] || 'No description available.';
  const imageUrl = data[imageField] || '';
  const leftMetric = data[leftMetricField] || 0;
  const rightMetric = data[rightMetricField] || 0;
  const [startColor, endColor] = getPalette(title);
  const badges = getBadges(data[badgesField]).slice(0, maxBadges);
  const hasImage = Boolean(imageUrl);
  const detailsPath = detailsPathBuilder
    ? detailsPathBuilder(data)
    : `/menu-management/recipes/${data.id || 'sample-rice-dhal'}`;

  return (
    <article className="overflow-hidden rounded-[20px] border border-[#e6e9e5] bg-[#f8f9f8] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div
        className="relative h-33 overflow-hidden"
        style={{ '--mm-media-start': startColor, '--mm-media-end': endColor }}
      >
        {hasImage ? (
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--mm-media-start)_0%,var(--mm-media-end)_100%)]" />
        )}

        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,23,42,0.34)_0%,rgba(15,23,42,0.05)_45%,rgba(15,23,42,0)_100%)]" />

        <div className="absolute top-2 right-2 left-2 flex flex-wrap gap-2">
          {badges.map((badge) => (
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
          {title}
        </h3>
        <p className="mt-1.5 mb-2 line-clamp-2 min-h-[2.2rem] overflow-hidden text-[0.77rem] leading-[1.3] text-ellipsis text-[#667]">
          {description}
        </p>
        <div className="mb-3 flex items-center justify-between text-[0.73rem] text-[#657267]">
          <span className="inline-flex items-center gap-1">
            <Clock3 size={14} />
            {leftMetric} {leftMetricLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users2 size={14} />
            {rightMetricPrefix} {rightMetric}
          </span>
        </div>
        <Link
          to={detailsPath}
          className="w-full rounded-[10px] border border-[#d8ddd7] bg-[#ecf1eb] px-3 py-2 text-sm font-semibold text-[#2d7236] transition-colors hover:bg-[#e2e9e2] focus-visible:ring-2 focus-visible:ring-[#2d7236] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {detailsLabel}
        </Link>
      </div>
    </article>
  );
}

export default RecipeCard;
