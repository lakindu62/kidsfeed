import {
  formatMealDistributionSchoolSubtitle,
  isLikelyMongoSchoolId,
} from '../hooks/mealDistributionSchoolScope';
import { useMealDistributionSchool } from '../hooks/mealDistributionSchoolContext';

export default function MealDistributionSchoolScopeBanner() {
  const { schoolId, schoolName } = useMealDistributionSchool();

  if (isLikelyMongoSchoolId(schoolId)) {
    return null;
  }

  return (
    <div
      className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900"
      role="status"
    >
      <p className="font-semibold text-amber-950">
        School not fully configured
      </p>
      <p className="mt-1 text-amber-900/90">
        <span className="font-medium text-amber-950">
          {formatMealDistributionSchoolSubtitle(schoolName)}
        </span>{' '}
        is shown for this workspace, but meal APIs need a real MongoDB school
        ObjectId in{' '}
        <code className="rounded bg-amber-100/80 px-1 py-0.5 font-mono text-[11px]">
          VITE_MEAL_DISTRIBUTION_SCHOOL_ID
        </code>{' '}
        (<code className="font-mono text-[11px]">frontend/.env</code>). Restart
        the dev server after you change it.
      </p>
    </div>
  );
}
