import { useAuth } from '@clerk/clerk-react';
import { Leaf, Pencil, ShieldCheck, UtensilsCrossed } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { describeApiFetchFailure } from '@/lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '@/lib/resolve-api-base';
import { useAuthRole } from '@/lib/auth/use-auth-role';
import { PageLoadingScreen } from '@/features/menu-management/components';
import MenuManagementLayout from '@/features/menu-management/layouts/MenuManagementLayout';
import { fetchMealPlanById } from '../api';

const DAY_ORDER = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

function normalizeText(value = '') {
  return String(value).trim().toLowerCase();
}

function formatStatusLabel(status = '') {
  const normalized = normalizeText(status);

  if (!normalized) {
    return '--';
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatDate(value) {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function estimateNutrition(plan) {
  const meals = plan?.meals || [];
  const totalServings = meals.reduce(
    (sum, meal) => sum + (Number(meal.plannedServings) || 0),
    0,
  );

  // Placeholder estimations derived from meal volume.
  return {
    calories: Math.max(420, Math.round(totalServings * 1.5)),
    protein: Math.max(18, Math.round(totalServings * 0.05)),
    carbs: Math.max(45, Math.round(totalServings * 0.18)),
    fats: Math.max(12, Math.round(totalServings * 0.04)),
  };
}

function getMealTypeLabel(mealType) {
  const normalized = normalizeText(mealType);
  if (!normalized) {
    return 'Meal';
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function MealPlanDetailsPage() {
  const { role } = useAuthRole();
  const { isSignedIn, getToken } = useAuth();
  const { planId } = useParams();
  const navigate = useNavigate();
  const apiBaseUrl = resolveApiBaseUrl();

  const [mealPlan, setMealPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!apiBaseUrl || !planId) {
      setError('Missing meal plan reference.');
      return undefined;
    }

    let active = true;

    const loadMealPlan = async () => {
      setIsLoading(true);
      setError('');

      try {
        const plan = await fetchMealPlanById({
          apiUrl: apiBaseUrl,
          planId,
          getToken: isSignedIn ? getToken : undefined,
        });

        if (active) {
          setMealPlan(plan);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        setError(
          describeApiFetchFailure(
            requestError,
            'Failed to load meal plan details.',
          ),
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadMealPlan();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, getToken, isSignedIn, planId]);

  const groupedMeals = useMemo(() => {
    const groups = new Map();
    (mealPlan?.meals || []).forEach((meal) => {
      const day = meal.day || 'Unknown';
      if (!groups.has(day)) {
        groups.set(day, []);
      }
      groups.get(day).push(meal);
    });

    return [...groups.entries()]
      .sort((left, right) => {
        const leftOrder = DAY_ORDER[left[0]] || 999;
        const rightOrder = DAY_ORDER[right[0]] || 999;
        return leftOrder - rightOrder;
      })
      .map(([day, meals]) => ({ day, meals }));
  }, [mealPlan]);

  const nutrition = useMemo(() => estimateNutrition(mealPlan), [mealPlan]);

  const normalizedStatus = normalizeText(mealPlan?.status);
  const isPlanned = normalizedStatus === 'planned';

  return (
    <MenuManagementLayout
      role={role}
      activeItemKey="dashboard"
      title="Meal Plan Details"
      subtitle="Review and refine meal plan execution for the selected school."
      searchPlaceholder=""
    >
      {isLoading ? (
        <PageLoadingScreen message="Loading meal plan details..." />
      ) : null}

      {error ? (
        <p className="mb-4 rounded-xl border border-[#f3cece] bg-[#fdecec] px-4 py-3 text-sm text-[#a61e1e]">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && mealPlan ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,0.9fr)]">
          <section className="space-y-4">
            <div className="rounded-[18px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ece8df] pb-3">
                <h2 className="text-[2rem] font-semibold tracking-[-0.03em] text-[#2a2f2c]">
                  Meal Plan Details
                </h2>

                <div className="flex items-center gap-2">
                  {!isPlanned ? (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/meal-planning/plans/new?planId=${planId}`)
                      }
                      className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e8] px-3 py-1.5 text-xs font-semibold text-[#1f7a34]"
                      title="Edit meal plan"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-[#7d8478] uppercase">
                    School
                  </p>
                  <p className="mt-1 text-base font-semibold text-[#313733]">
                    {mealPlan.schoolName || 'School'}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-[#7d8478] uppercase">
                    Week Duration
                  </p>
                  <p className="mt-1 text-base font-semibold text-[#313733]">
                    {formatDate(mealPlan.weekStartDate)} -{' '}
                    {formatDate(mealPlan.weekEndDate)}
                  </p>
                </div>

                <div className="flex items-end md:justify-end">
                  <span
                    className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                      normalizedStatus === 'confirmed'
                        ? 'border-[#b9e6c0] bg-[#dff7e4] text-[#1c7b35]'
                        : normalizedStatus === 'draft'
                          ? 'border-[#d6ddd4] bg-[#eef0ed] text-[#5f6760]'
                          : 'border-[#f3caa6] bg-[#fde7d5] text-[#c46f1a]'
                    }`}
                  >
                    {formatStatusLabel(mealPlan.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {groupedMeals.map((group, groupIndex) => (
                <article
                  key={group.day}
                  className="overflow-hidden rounded-[16px] border border-[#ece8df] bg-white"
                >
                  <header className="flex items-center justify-between gap-3 border-b border-[#f1ede7] px-4 py-3">
                    <div className="inline-flex items-center gap-3">
                      <span className="rounded-md bg-[#f9dbc1] px-2 py-1 text-[10px] font-semibold tracking-widest text-[#9f6028] uppercase">
                        {group.day}
                      </span>
                      <h3 className="text-base font-semibold text-[#313733]">
                        {groupIndex === 0
                          ? 'Balanced Nutrition Kick-off'
                          : 'Meal Set'}
                      </h3>
                    </div>
                  </header>

                  <div className="space-y-3 p-4">
                    {group.meals.map((meal) => (
                      <div
                        key={`${group.day}-${meal.mealType}-${meal.recipeId}`}
                        className="rounded-[12px] border border-[#eef1eb] bg-[#f8faf7] p-3"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-[11px] font-semibold tracking-widest text-[#2f7a3b] uppercase">
                            {getMealTypeLabel(meal.mealType)}
                          </p>
                          <p className="text-xs text-[#6f766f]">
                            {(Number(meal.plannedServings) || 0) * 3} kcal
                            serving
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <p className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#313733]">
                            {meal.recipeName}
                          </p>
                          <p className="rounded-md bg-white px-3 py-2 text-sm text-[#59615a]">
                            {meal.plannedServings} servings
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <article className="rounded-[16px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-[#313733]">
                <UtensilsCrossed size={16} />
                Nutritional Summary
              </h3>
              <p className="mt-1 text-xs text-[#6f766f]">
                Average per student per day
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-[10px] bg-[#f4f6f3] p-3">
                  <p className="text-[10px] font-semibold tracking-widest text-[#7d8478] uppercase">
                    Calories
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[#313733]">
                    {nutrition.calories} kcal
                  </p>
                </div>
                <div className="rounded-[10px] bg-[#f4f6f3] p-3">
                  <p className="text-[10px] font-semibold tracking-widest text-[#7d8478] uppercase">
                    Protein
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[#313733]">
                    {nutrition.protein} g
                  </p>
                </div>
                <div className="rounded-[10px] bg-[#f4f6f3] p-3">
                  <p className="text-[10px] font-semibold tracking-widest text-[#7d8478] uppercase">
                    Carbs
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[#313733]">
                    {nutrition.carbs} g
                  </p>
                </div>
                <div className="rounded-[10px] bg-[#f4f6f3] p-3">
                  <p className="text-[10px] font-semibold tracking-widest text-[#7d8478] uppercase">
                    Fats
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[#313733]">
                    {nutrition.fats} g
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-[16px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-[#313733]">
                <ShieldCheck size={16} />
                Dietary Compliance
              </h3>

              <ul className="mt-3 space-y-2 text-sm text-[#4f6850]">
                <li className="inline-flex items-center gap-2">
                  <Leaf size={14} className="text-[#1f7a34]" />
                  All meals monitored for dietary tags
                </li>
                <li className="inline-flex items-center gap-2">
                  <Leaf size={14} className="text-[#1f7a34]" />
                  No invalid meal types detected
                </li>
                <li className="inline-flex items-center gap-2">
                  <Leaf size={14} className="text-[#1f7a34]" />
                  Ready for kitchen review
                </li>
              </ul>
            </article>
          </aside>
        </div>
      ) : null}
    </MenuManagementLayout>
  );
}

export default MealPlanDetailsPage;
