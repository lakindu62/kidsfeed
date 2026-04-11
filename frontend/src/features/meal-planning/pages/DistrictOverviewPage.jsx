import { useAuth } from '@clerk/clerk-react';
import {
  Bell,
  ChevronDown,
  ClipboardList,
  FileText,
  Plus,
  School2,
  Search,
  UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { describeApiFetchFailure } from '@/lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '@/lib/resolve-api-base';
import { useAuthRole } from '@/lib/auth/use-auth-role';
import { PageLoadingScreen } from '@/features/menu-management/components';
import MenuManagementLayout from '@/features/menu-management/layouts/MenuManagementLayout';
import { fetchDistrictOverview, fetchSchoolMealPlans } from '../api';

function normalizeText(value = '') {
  return String(value).trim().toLowerCase();
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0);
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

function getStatusTone(status = '') {
  const normalized = normalizeText(status);

  if (normalized === 'draft') {
    return 'bg-[#eef0ed] text-[#5f6760] border-[#d6ddd4]';
  }

  if (normalized === 'confirmed') {
    return 'bg-[#dff7e4] text-[#1c7b35] border-[#b9e6c0]';
  }

  if (normalized === 'served') {
    return 'bg-[#e8f2fb] text-[#205b8f] border-[#bdd3ea]';
  }

  return 'bg-[#fde7d5] text-[#c46f1a] border-[#f3caa6]';
}

function formatStatusLabel(status = '') {
  const normalized = normalizeText(status);

  if (!normalized) {
    return '--';
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getMealTypeTone(mealType = '') {
  const normalized = normalizeText(mealType);

  if (normalized === 'breakfast') {
    return 'bg-[#eff7ea] text-[#1f7a34]';
  }

  if (normalized === 'lunch') {
    return 'bg-[#fff4dd] text-[#a96a15]';
  }

  if (normalized === 'dinner') {
    return 'bg-[#edf3fb] text-[#2b5f9b]';
  }

  return 'bg-[#f2efe8] text-[#696257]';
}

function MealPlanningPage() {
  const { role } = useAuthRole();
  const { isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();
  const apiBaseUrl = resolveApiBaseUrl();

  const [query, setQuery] = useState('');
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [mealPlans, setMealPlans] = useState([]);
  const [schoolError, setSchoolError] = useState('');
  const [mealPlanError, setMealPlanError] = useState('');
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [isLoadingMealPlans, setIsLoadingMealPlans] = useState(false);

  useEffect(() => {
    if (!apiBaseUrl) {
      setSchoolError('Could not resolve API base URL for meal planning.');
      return undefined;
    }

    let active = true;

    const loadSchools = async () => {
      setIsLoadingSchools(true);
      setSchoolError('');

      try {
        const overview = await fetchDistrictOverview({
          apiUrl: apiBaseUrl,
          getToken: isSignedIn ? getToken : undefined,
        });

        if (!active) {
          return;
        }

        setSchools(overview);
        if (overview.length > 0) {
          setSelectedSchoolId((current) => current || overview[0].id);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        setSchoolError(
          describeApiFetchFailure(
            requestError,
            'Failed to load schools for meal planning.',
          ),
        );
      } finally {
        if (active) {
          setIsLoadingSchools(false);
        }
      }
    };

    loadSchools();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, getToken, isSignedIn]);

  useEffect(() => {
    if (!apiBaseUrl || !selectedSchoolId) {
      setMealPlans([]);
      return undefined;
    }

    let active = true;

    const loadMealPlans = async () => {
      setIsLoadingMealPlans(true);
      setMealPlanError('');

      try {
        const plans = await fetchSchoolMealPlans({
          apiUrl: apiBaseUrl,
          schoolId: selectedSchoolId,
          getToken: isSignedIn ? getToken : undefined,
        });

        if (active) {
          setMealPlans(plans);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        setMealPlanError(
          describeApiFetchFailure(
            requestError,
            'Failed to load meal plans from the meal planning backend.',
          ),
        );
      } finally {
        if (active) {
          setIsLoadingMealPlans(false);
        }
      }
    };

    loadMealPlans();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, getToken, isSignedIn, selectedSchoolId]);

  const selectedSchool = useMemo(
    () => schools.find((school) => school.id === selectedSchoolId) || null,
    [schools, selectedSchoolId],
  );

  const filteredMealPlans = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    return mealPlans.filter((plan) => {
      if (!normalizedQuery) {
        return true;
      }

      const haystack = normalizeText(
        `${plan.schoolName} ${plan.status} ${plan.meals
          .map((meal) => `${meal.day} ${meal.mealType} ${meal.recipeName}`)
          .join(' ')}`,
      );

      return haystack.includes(normalizedQuery);
    });
  }, [mealPlans, query]);

  const summary = useMemo(() => {
    const totalPlans = filteredMealPlans.length;
    const totalPlannedServings = filteredMealPlans.reduce(
      (sum, plan) => sum + (Number(plan.totalPlannedServings) || 0),
      0,
    );
    const currentWeekPlans = filteredMealPlans.filter(
      (plan) => plan.isCurrentWeek,
    ).length;

    return {
      totalPlans,
      totalPlannedServings,
      currentWeekPlans,
    };
  }, [filteredMealPlans]);

  return (
    <MenuManagementLayout
      role={role}
      activeItemKey="dashboard"
      title="Meal Planning Dashboard"
      subtitle="Browse district meal plans powered by the meal-planning backend."
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder="Search meal plans, recipes, or status..."
    >
      {isLoadingSchools || isLoadingMealPlans ? (
        <PageLoadingScreen message="Loading meal planning data..." />
      ) : null}

      {schoolError ? (
        <p className="mb-4 rounded-xl border border-[#f3cece] bg-[#fdecec] px-4 py-3 text-sm text-[#a61e1e]">
          {schoolError}
        </p>
      ) : null}

      {mealPlanError ? (
        <p className="mb-4 rounded-xl border border-[#f3cece] bg-[#fdecec] px-4 py-3 text-sm text-[#a61e1e]">
          {mealPlanError}
        </p>
      ) : null}

      {!isLoadingSchools && !isLoadingMealPlans ? (
        <div className="space-y-6">
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-[2rem] font-semibold tracking-[-0.03em] text-[#2a2f2c]">
                District Meal Plans
              </h2>
              <p className="text-sm text-[#6f766f]">
                Showing meal plans from the meal-planning backend for the
                selected school.
              </p>
            </div>

            <label className="flex items-center gap-3 rounded-[12px] border border-[#e6e9e5] bg-white px-3 py-2 text-sm text-[#5c665f] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <span className="font-medium text-[#6a736d]">
                Filter by School:
              </span>
              <div className="relative">
                <select
                  value={selectedSchoolId}
                  onChange={(event) => setSelectedSchoolId(event.target.value)}
                  className="appearance-none rounded-[10px] border border-[#e7e5df] bg-[#f7f7f4] px-3 py-2 pr-9 text-sm text-[#49524a] focus:outline-none"
                >
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[#7b837c]"
                />
              </div>
            </label>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-[18px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-[#7d8478] uppercase">
                Meal Plans
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#166534]">
                {summary.totalPlans}
              </p>
            </article>

            <article className="rounded-[18px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-[#7d8478] uppercase">
                Planned Servings
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#166534]">
                {formatNumber(summary.totalPlannedServings)}
              </p>
            </article>

            <article className="rounded-[18px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-[#7d8478] uppercase">
                Current Week
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#166534]">
                {summary.currentWeekPlans}
              </p>
            </article>
          </section>

          {selectedSchool ? (
            <section className="rounded-[18px] bg-[#f1f1eb] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-[#313733]">
                    {selectedSchool.schoolName}
                  </h3>
                  <p className="text-sm text-[#6d746e]">
                    District {selectedSchool.districtNumber} •{' '}
                    {selectedSchool.region}
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-[#516055] shadow-sm">
                  <School2 size={16} className="text-[#1f7a34]" />
                  Selected School
                </div>
              </div>
            </section>
          ) : null}

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="rounded-[18px] bg-[#eaf8d7] p-5">
              <p className="text-sm font-semibold text-[#1f7a34]">
                Create Plan
              </p>
              <p className="mt-2 text-sm text-[#4f6850]">
                Start a new meal plan for the selected school using the
                meal-planning backend.
              </p>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/meal-planning/plans/new?schoolId=${selectedSchoolId}&school=${encodeURIComponent(selectedSchool?.schoolName || '')}`,
                  )
                }
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#166534] px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus size={14} />
                Create Meal Plan
              </button>
            </article>

            <article className="rounded-[18px] bg-[#f3f7e8] p-5">
              <p className="text-sm font-semibold text-[#1f7a34]">
                Meals in Plans
              </p>
              <p className="mt-2 text-sm text-[#4f6850]">
                Track the number of meal entries included across all fetched
                meal plans.
              </p>
              <p className="mt-4 text-3xl font-semibold text-[#166534]">
                {formatNumber(
                  filteredMealPlans.reduce(
                    (sum, plan) => sum + (plan.meals?.length || 0),
                    0,
                  ),
                )}
              </p>
            </article>
          </section>

          <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between border-b border-[#ece8df] px-5 py-4">
              <h3 className="text-lg font-semibold text-[#313733]">
                Meal Plans
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#fafaf7] text-[11px] font-semibold tracking-[0.16em] text-[#7c8279] uppercase">
                  <tr>
                    <th className="px-5 py-3">Week</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Meals</th>
                    <th className="px-5 py-3">Planned Servings</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMealPlans.length > 0 ? (
                    filteredMealPlans.map((plan) => (
                      <tr key={plan.id} className="border-t border-[#f0ede6]">
                        <td className="px-5 py-4 font-medium text-[#303633]">
                          {formatDate(plan.weekStartDate)} -{' '}
                          {formatDate(plan.weekEndDate)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(plan.status)}`}
                          >
                            {formatStatusLabel(plan.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#676e68]">
                          {plan.meals?.length || 0} meals
                        </td>
                        <td className="px-5 py-4 text-[#676e68]">
                          {formatNumber(plan.totalPlannedServings)}
                        </td>
                        <td className="px-5 py-4 text-[#1f7a34]">
                          <div className="flex items-center gap-3 font-semibold">
                            <Link to={`/meal-planning/plans/${plan.id}`}>
                              View
                            </Link>
                            {normalizeText(plan.status) !== 'planned' ? (
                              <>
                                <span className="text-[#c9cec7]">|</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/meal-planning/plans/new?planId=${plan.id}`,
                                    )
                                  }
                                  title="Edit meal plan"
                                >
                                  Edit
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-8 text-center text-[#667267]"
                      >
                        No meal plans found for the selected school.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[18px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[#313733]">
                  Meal Plan Search
                </h3>
                <p className="text-sm text-[#6d746e]">
                  Search across week dates, meal types, recipe names, and
                  status.
                </p>
              </div>

              <label className="flex h-12 w-full max-w-md items-center gap-3 rounded-[16px] bg-[#f1f3ef] px-4 text-[#89928b]">
                <Search size={18} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="text"
                  placeholder="Search meal plans..."
                  className="w-full bg-transparent text-sm text-[#47504a] placeholder:text-[#8a918a] focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredMealPlans.slice(0, 6).map((plan) => (
                <article
                  key={plan.id}
                  className="rounded-[16px] border border-[#ece8df] bg-[#fcfcfa] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#313733]">
                        {formatDate(plan.weekStartDate)} -{' '}
                        {formatDate(plan.weekEndDate)}
                      </p>
                      <p className="text-xs text-[#6d746e]">
                        {plan.schoolName ||
                          selectedSchool?.schoolName ||
                          'School meal plan'}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(plan.status)}`}
                    >
                      {formatStatusLabel(plan.status)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(plan.meals || []).slice(0, 4).map((meal) => (
                      <span
                        key={`${plan.id}-${meal.day}-${meal.mealType}`}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getMealTypeTone(meal.mealType)}`}
                      >
                        {meal.day} {meal.mealType}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-[#667267]">
                    <span className="inline-flex items-center gap-1">
                      <UtensilsCrossed size={13} />
                      {formatNumber(plan.totalPlannedServings)} servings
                    </span>
                    <Link
                      to={`/meal-planning/plans/${plan.id}`}
                      className="font-semibold text-[#1f7a34]"
                    >
                      Open
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </MenuManagementLayout>
  );
}

export default MealPlanningPage;
