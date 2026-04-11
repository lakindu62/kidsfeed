import { useAuth } from '@clerk/clerk-react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Clock3,
  Search,
  Users2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { describeApiFetchFailure } from '@/lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '@/lib/resolve-api-base';
import { useAuthRole } from '@/lib/auth/use-auth-role';
import { fetchRecipeCatalog } from '../api';
import { PageLoadingScreen } from '../components';
import MenuManagementLayout from '../layouts/MenuManagementLayout';

const DIETARY_FILTERS = [
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'halal', label: 'Halal' },
  { key: 'glutenFree', label: 'Gluten-Free' },
  { key: 'dairyFree', label: 'Dairy-Free' },
  { key: 'nutFree', label: 'Nut-Free' },
];

const ALLERGEN_FILTERS = [
  { key: 'nuts', label: 'Nuts' },
  { key: 'dairy', label: 'Dairy' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'soy', label: 'Soy' },
  { key: 'gluten', label: 'Gluten' },
  { key: 'fish', label: 'Fish' },
  { key: 'shellfish', label: 'Shellfish' },
  { key: 'sesame', label: 'Sesame' },
  { key: 'wheat', label: 'Wheat' },
  { key: 'peanuts', label: 'Peanuts' },
];

const PREPARATION_OPTIONS = [
  { value: 'all', label: 'All times' },
  { value: '<15', label: '< 15 min' },
  { value: '15-30', label: '15 - 30 min' },
  { value: '30-60', label: '30 - 60 min' },
  { value: '60+', label: '60+ min' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'prep-asc', label: 'Shortest Prep' },
  { value: 'name-asc', label: 'A - Z' },
];

const DEFAULT_DRAFT_FILTERS = {
  dietary: {
    vegetarian: false,
    vegan: false,
    halal: false,
    glutenFree: false,
    dairyFree: false,
    nutFree: false,
  },
  allergens: {
    nuts: false,
    dairy: false,
    eggs: false,
    soy: false,
  },
  preparationTime: 'all',
};

const PAGE_SIZE = 100;

function normalizeText(value = '') {
  return String(value).trim().toLowerCase();
}

function toDisplayLabel(value = '') {
  const normalized = String(value)
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

  if (!normalized) {
    return '';
  }

  return normalized
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function matchesPreparationTime(recipe, value) {
  if (!value || value === 'all') {
    return true;
  }

  const prepTime = Number(recipe.prepTime) || 0;

  if (value === '<15') {
    return prepTime < 15;
  }

  if (value === '15-30') {
    return prepTime >= 15 && prepTime <= 30;
  }

  if (value === '30-60') {
    return prepTime > 30 && prepTime <= 60;
  }

  return prepTime > 60;
}

function recipeHasExcludedAllergen(recipe, allergens) {
  const recipeAllergens = (recipe.allergens || []).map((allergen) =>
    normalizeText(allergen),
  );

  return Object.entries(allergens).some(([key, active]) => {
    if (!active) {
      return false;
    }
    return recipeAllergens.includes(normalizeText(key));
  });
}

function getDietaryTags(recipe) {
  return DIETARY_FILTERS.filter(
    (filter) => recipe.dietaryFlags?.[filter.key],
  ).map((filter) => filter.label);
}

function getRecipeCardAccent(recipe) {
  const palette = [
    ['#e9f6ea', '#cdeac6'],
    ['#f8ecd9', '#f1d0a8'],
    ['#edf3fb', '#cddcf2'],
    ['#fbefe8', '#f3cdb7'],
  ];

  const name = recipe.name || '';
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(index);
    hash |= 0;
  }

  return palette[Math.abs(hash) % palette.length];
}

function RecipeSearchPage() {
  const { role } = useAuthRole();
  const { isSignedIn, getToken } = useAuth();
  const [searchParams] = useSearchParams();

  const apiBaseUrl = resolveApiBaseUrl();
  const initialQuery = searchParams.get('query') || '';

  const [query, setQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState('newest');
  const [draftFilters, setDraftFilters] = useState(DEFAULT_DRAFT_FILTERS);
  const [activeFilters, setActiveFilters] = useState(DEFAULT_DRAFT_FILTERS);
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const allergenFilters = useMemo(() => {
    const known = new Map(
      ALLERGEN_FILTERS.map((filter) => [
        normalizeText(filter.key),
        filter.label,
      ]),
    );

    recipes.forEach((recipe) => {
      (recipe.allergens || []).forEach((allergen) => {
        const key = normalizeText(allergen);
        if (!key || known.has(key)) {
          return;
        }
        known.set(key, toDisplayLabel(key));
      });
    });

    return Array.from(known.entries()).map(([key, label]) => ({ key, label }));
  }, [recipes]);

  useEffect(() => {
    if (allergenFilters.length === 0) {
      return;
    }

    const keys = allergenFilters.map((filter) => filter.key);

    setDraftFilters((current) => {
      const nextAllergens = { ...current.allergens };
      keys.forEach((key) => {
        if (nextAllergens[key] === undefined) {
          nextAllergens[key] = false;
        }
      });

      return {
        ...current,
        allergens: nextAllergens,
      };
    });

    setActiveFilters((current) => {
      const nextAllergens = { ...current.allergens };
      keys.forEach((key) => {
        if (nextAllergens[key] === undefined) {
          nextAllergens[key] = false;
        }
      });

      return {
        ...current,
        allergens: nextAllergens,
      };
    });
  }, [allergenFilters]);

  useEffect(() => {
    setQuery(searchParams.get('query') || '');
  }, [searchParams]);

  useEffect(() => {
    if (!apiBaseUrl) {
      setError('Could not resolve API base URL for menu management.');
      return undefined;
    }

    let active = true;

    const loadRecipes = async () => {
      setIsLoading(true);
      setError('');

      try {
        const result = await fetchRecipeCatalog({
          apiUrl: apiBaseUrl,
          getToken: isSignedIn ? getToken : undefined,
          page: 1,
          pageSize: PAGE_SIZE,
        });

        if (!active) {
          return;
        }

        setRecipes(result.allRecipes || result.recipes || []);
      } catch (requestError) {
        if (!active) {
          return;
        }

        setError(
          describeApiFetchFailure(
            requestError,
            'Failed to load recipe library.',
          ),
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadRecipes();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, getToken, isSignedIn]);

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    const result = recipes.filter((recipe) => {
      const haystack = normalizeText(
        `${recipe.name} ${(recipe.ingredients || [])
          .map((ingredient) => ingredient.name)
          .join(' ')}`,
      );

      const matchesQuery = normalizedQuery
        ? haystack.includes(normalizedQuery)
        : true;

      const matchesDietary = Object.entries(activeFilters.dietary).every(
        ([key, isActive]) => !isActive || recipe.dietaryFlags?.[key] === true,
      );

      const matchesAllergens = !recipeHasExcludedAllergen(
        recipe,
        activeFilters.allergens,
      );

      const matchesPrep = matchesPreparationTime(
        recipe,
        activeFilters.preparationTime,
      );

      return matchesQuery && matchesDietary && matchesAllergens && matchesPrep;
    });

    const sorted = [...result].sort((left, right) => {
      if (sortBy === 'prep-asc') {
        return (Number(left.prepTime) || 0) - (Number(right.prepTime) || 0);
      }

      if (sortBy === 'name-asc') {
        return (left.name || '').localeCompare(right.name || '');
      }

      return (right.id || '').localeCompare(left.id || '');
    });

    return sorted;
  }, [activeFilters, query, recipes, sortBy]);

  const featuredRecipes = filteredRecipes.slice(0, 12);

  const allergyAlertCount = filteredRecipes.filter((recipe) =>
    (recipe.allergens || []).some((allergen) =>
      ['nuts', 'dairy', 'eggs', 'soy'].includes(normalizeText(allergen)),
    ),
  ).length;

  const handleToggleDraftDietary = (key) => {
    setDraftFilters((current) => ({
      ...current,
      dietary: {
        ...current.dietary,
        [key]: !current.dietary[key],
      },
    }));
  };

  const handleToggleDraftAllergen = (key) => {
    setDraftFilters((current) => ({
      ...current,
      allergens: {
        ...current.allergens,
        [key]: !current.allergens[key],
      },
    }));
  };

  const handleApplyFilters = () => {
    setActiveFilters(draftFilters);
  };

  const handleClearAll = () => {
    setQuery('');
    setSortBy('newest');
    setDraftFilters(DEFAULT_DRAFT_FILTERS);
    setActiveFilters(DEFAULT_DRAFT_FILTERS);
  };

  return (
    <MenuManagementLayout
      role={role}
      activeItemKey="recipes"
      title="Recipe Library"
      subtitle="Search, filter, and compare institutional recipes."
      searchPlaceholder=""
    >
      {isLoading ? <PageLoadingScreen message="Loading recipes..." /> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(260px,290px)_minmax(0,1fr)]">
        <aside className="rounded-[20px] border border-[#ece8de] bg-[#f7f5ef] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <p className="text-sm font-semibold tracking-[0.16em] text-[#2d7136] uppercase">
            Filters
          </p>

          <div className="mt-5 space-y-6">
            <section>
              <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-[#2d7136] uppercase">
                Dietary Requirements
              </p>
              <div className="space-y-2">
                {DIETARY_FILTERS.map((filter) => {
                  const active = draftFilters.dietary[filter.key];

                  return (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => handleToggleDraftDietary(filter.key)}
                      className="flex w-full items-center gap-3 text-left text-sm text-[#38443a]"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-lg border ${
                          active
                            ? 'border-[#167534] bg-[#167534] text-white'
                            : 'border-[#c8cdc4] bg-white'
                        }`}
                      >
                        {active ? <Check size={11} /> : null}
                      </span>
                      <span>{filter.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-[#2d7136] uppercase">
                Allergens to Exclude
              </p>
              <div className="space-y-2">
                {allergenFilters.map((filter) => {
                  const active = draftFilters.allergens[filter.key];

                  return (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => handleToggleDraftAllergen(filter.key)}
                      className="flex w-full items-center gap-3 text-left text-sm text-[#38443a]"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-lg border ${
                          active
                            ? 'border-[#167534] bg-[#167534] text-white'
                            : 'border-[#c8cdc4] bg-white'
                        }`}
                      >
                        {active ? <Check size={11} /> : null}
                      </span>
                      <span>{filter.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-[#2d7136] uppercase">
                Preparation Time
              </p>
              <div className="space-y-2">
                {PREPARATION_OPTIONS.filter(
                  (option) => option.value !== 'all',
                ).map((option) => {
                  const active = draftFilters.preparationTime === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setDraftFilters((current) => ({
                          ...current,
                          preparationTime: option.value,
                        }))
                      }
                      className="flex w-full items-center gap-3 text-left text-sm text-[#38443a]"
                    >
                      <span
                        className={`h-4 w-4 rounded-full border ${
                          active
                            ? 'border-[#167534] bg-[#167534]'
                            : 'border-[#c8cdc4] bg-white'
                        }`}
                      />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <button
            type="button"
            onClick={handleApplyFilters}
            className="mt-6 w-full rounded-[12px] bg-[#167534] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#13662d]"
          >
            Apply Filters
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="mt-4 w-full text-center text-sm font-medium text-[#5d665d]"
          >
            Clear All
          </button>
        </aside>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:flex-row lg:items-center lg:justify-between">
            <label className="flex h-14 flex-1 items-center gap-3 rounded-[18px] bg-[#f1f3ef] px-4 text-[#89928b]">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="text"
                placeholder="Search by ingredient (e.g., rice, lentils...)"
                className="w-full bg-transparent text-sm text-[#47504a] placeholder:text-[#8a918a] focus:outline-none"
              />
            </label>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#6b736c]">
                Sort by:
              </span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="appearance-none rounded-[12px] border border-[#e7e5df] bg-[#f6f3ea] px-4 py-2.5 pr-10 text-sm font-medium text-[#465147] focus:outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#6b736c]"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[1.8rem] font-semibold tracking-[-0.03em] text-[#363b38]">
                  Recipe Library
                </h2>
                <p className="text-sm text-[#7a8079]">
                  Showing {filteredRecipes.length} curated recipes for your
                  academy
                </p>
              </div>
            </div>

            {error ? (
              <p className="mt-4 rounded-[14px] border border-[#f2d0d0] bg-[#fff1f1] px-4 py-3 text-sm text-[#a43a3a]">
                {error}
              </p>
            ) : null}

            {!isLoading && !error ? (
              <div className="mt-6 space-y-4">
                {featuredRecipes.length > 0 ? (
                  featuredRecipes.map((recipe) => {
                    const [startColor, endColor] = getRecipeCardAccent(recipe);
                    const badges = getDietaryTags(recipe);

                    return (
                      <article
                        key={recipe.id || recipe.name}
                        className="flex flex-col gap-4 rounded-[18px] border border-[#f0ede6] bg-[#fffefe] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] lg:flex-row lg:items-center"
                      >
                        <div
                          className="relative h-24 w-full shrink-0 overflow-hidden rounded-[14px] lg:w-28"
                          style={{
                            background: `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`,
                          }}
                        >
                          {recipe.imageUrl ? (
                            <img
                              src={recipe.imageUrl}
                              alt={recipe.name}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-[1.05rem] font-semibold text-[#313733]">
                                {recipe.name}
                              </h3>
                              <p className="mt-1 line-clamp-2 text-sm text-[#6f766f]">
                                {recipe.description}
                              </p>
                            </div>
                            <Link
                              to={`/menu-management/recipes/${recipe.id}`}
                              className="hidden text-[#8b948a] transition-colors hover:text-[#295f31] lg:block"
                            >
                              <ChevronDown className="-rotate-90" size={18} />
                            </Link>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#667267]">
                            {badges.map((badge) => (
                              <span
                                key={badge}
                                className="rounded-full bg-[#eff7ea] px-3 py-1 font-semibold text-[#2d7236]"
                              >
                                {badge}
                              </span>
                            ))}

                            <span className="inline-flex items-center gap-1 border-l border-[#e2e5dd] pl-2">
                              <Clock3 size={13} />
                              Prep: {Number(recipe.prepTime) || 0} min
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users2 size={13} />
                              Serves: {Number(recipe.servingSize) || 0}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-[18px] border border-dashed border-[#d8ddd4] bg-[#fafaf8] px-6 py-8 text-center text-[#667267]">
                    No recipes match the current search and filters.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <section className="grid grid-cols-1 gap-4 lg:max-w-[420px]">
            <article className="rounded-[24px] bg-[#f7ede0] p-5 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#d8a06b] text-[#c9721d]">
                <AlertTriangle size={26} />
              </div>
              <p className="mt-4 text-[2rem] font-semibold text-[#c06c1d]">
                {allergyAlertCount} Allergy Alerts
              </p>
              <p className="mt-2 text-sm leading-6 text-[#9a6c42]">
                Pending review for recipes containing the selected allergen
                flags.
              </p>
            </article>
          </section>
        </section>
      </div>
    </MenuManagementLayout>
  );
}

export default RecipeSearchPage;
