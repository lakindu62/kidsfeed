import { useAuth } from '@clerk/clerk-react';
import { Leaf } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { describeApiFetchFailure } from '@/lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '@/lib/resolve-api-base';
import { useAuthRole } from '@/lib/auth/use-auth-role';
import { fetchRecipeCatalog } from '../api';
import {
  MenuHero,
  MenuStatCard,
  RecipeFilters,
  RecipeGrid,
  RecipePagination,
  RecipeStateMessage,
  WeeklyGoalCard,
} from '../components';
import MenuManagementLayout from '../layouts/MenuManagementLayout';
import useDebouncedValue from '../hooks/useDebouncedValue';

const DIETARY_FILTERS = [
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'halal', label: 'Halal' },
  { key: 'glutenFree', label: 'Gluten-Free' },
];

const COURSE_OPTIONS = [
  { value: 'all', label: 'Course: All' },
  { value: 'breakfast', label: 'Course: Breakfast' },
  { value: 'lunch', label: 'Course: Lunch' },
  { value: 'dinner', label: 'Course: Dinner' },
];

const PAGE_SIZE = 8;

function RecipeManagementPage() {
  const { role } = useAuthRole();
  const { isSignedIn, getToken } = useAuth();

  const apiBaseUrl = resolveApiBaseUrl();

  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('all');
  const [dietaryFilters, setDietaryFilters] = useState({
    vegetarian: false,
    vegan: false,
    halal: false,
    glutenFree: false,
  });
  const [page, setPage] = useState(1);

  const [recipes, setRecipes] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, course, dietaryFilters]);

  useEffect(() => {
    if (!apiBaseUrl) {
      setError('Could not resolve API base URL for menu management.');
      return;
    }

    let active = true;

    const loadRecipes = async () => {
      setIsLoading(true);
      setError('');

      try {
        const result = await fetchRecipeCatalog({
          apiUrl: apiBaseUrl,
          getToken: isSignedIn ? getToken : undefined,
          page,
          pageSize: PAGE_SIZE,
          searchTerm: debouncedSearch,
          dietaryFlags: dietaryFilters,
          course,
        });

        if (!active) {
          return;
        }

        setRecipes(result.recipes);
        setAllRecipes(result.allRecipes);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (requestError) {
        if (!active) {
          return;
        }
        setError(
          describeApiFetchFailure(
            requestError,
            'Failed to load menu management recipes.',
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
  }, [
    apiBaseUrl,
    isSignedIn,
    getToken,
    page,
    debouncedSearch,
    course,
    dietaryFilters,
  ]);

  const vegetarianCount = useMemo(
    () =>
      allRecipes.filter((recipe) => recipe.dietaryFlags?.vegetarian === true)
        .length,
    [allRecipes],
  );

  const weeklyGoalProgress = useMemo(() => {
    if (total === 0) {
      return 0;
    }
    return Math.min(100, Math.round((vegetarianCount / total) * 100));
  }, [vegetarianCount, total]);

  const pageNumbers = useMemo(() => {
    const visible = [];
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, page + 1);

    for (let current = start; current <= end; current += 1) {
      visible.push(current);
    }
    return visible;
  }, [page, totalPages]);

  const toggleDietaryFilter = (key) => {
    setDietaryFilters((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const resetFilters = () => {
    setSearch('');
    setCourse('all');
    setDietaryFilters({
      vegetarian: false,
      vegan: false,
      halal: false,
      glutenFree: false,
    });
  };

  return (
    <MenuManagementLayout
      role={role}
      activeItemKey="dashboard"
      title="Recipe Management"
      subtitle="Create and curate nutritious institutional meal plans"
      query={search}
      onQueryChange={setSearch}
      searchPlaceholder="Search ingredients..."
    >
      <section className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:grid-rows-[auto_auto] xl:items-stretch">
        <div className="xl:col-start-1 xl:row-span-2 xl:row-start-1 xl:h-full">
          <MenuHero
            title="Nutritional Excellence"
            description="Manage institutional recipes with precision. Ensure every meal meets the highest dietary standards for student vitality."
            ctaLabel="+ New Recipe"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:col-start-2 xl:row-start-1">
          <MenuStatCard
            icon={<Leaf size={18} />}
            value={total}
            label="Total Recipes"
          />

          <MenuStatCard
            icon={<Leaf size={18} />}
            value={vegetarianCount}
            label="Vegetarian"
            variant="highlight"
          />
        </div>

        <div className="xl:col-start-2 xl:row-start-2">
          <WeeklyGoalCard progress={weeklyGoalProgress} />
        </div>
      </section>

      <RecipeFilters
        filters={DIETARY_FILTERS.map((filter) => ({
          ...filter,
          active: dietaryFilters[filter.key],
        }))}
        onToggleFilter={toggleDietaryFilter}
        course={course}
        onCourseChange={setCourse}
        courseOptions={COURSE_OPTIONS}
        onReset={resetFilters}
      />

      <RecipeStateMessage kind="error" message={error} />
      <RecipeStateMessage message={isLoading ? 'Loading recipes...' : ''} />

      {!isLoading && !error ? <RecipeGrid recipes={recipes} /> : null}

      {!isLoading && !error ? (
        <RecipePagination
          page={page}
          totalPages={totalPages}
          pageNumbers={pageNumbers}
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onPageSelect={setPage}
          onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
        />
      ) : null}
    </MenuManagementLayout>
  );
}

export default RecipeManagementPage;
