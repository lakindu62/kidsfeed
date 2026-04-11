import { useAuth } from '@clerk/clerk-react';
import { Leaf } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { describeApiFetchFailure } from '@/lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '@/lib/resolve-api-base';
import { useAuthRole } from '@/lib/auth/use-auth-role';
import { fetchRecipeCatalog } from '../api';
import {
  MenuHero,
  MenuStatCard,
  PageLoadingScreen,
  RecipeFilters,
  RecipeGrid,
  RecipePagination,
  RecipeStateMessage,
  WeeklyGoalCard,
} from '../components';
import MenuManagementLayout from '../layouts/MenuManagementLayout';

const DIETARY_FILTERS = [
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'halal', label: 'Halal' },
  { key: 'glutenFree', label: 'Gluten-Free' },
  { key: 'dairyFree', label: 'Dairy-Free' },
  { key: 'nutFree', label: 'Nut-Free' },
];

const PAGE_SIZE = 8;

function RecipeManagementPage() {
  const { role } = useAuthRole();
  const { isSignedIn, getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const apiBaseUrl = resolveApiBaseUrl();

  const [search, setSearch] = useState('');
  const [dietaryFilters, setDietaryFilters] = useState({
    vegetarian: false,
    vegan: false,
    halal: false,
    glutenFree: false,
    dairyFree: false,
    nutFree: false,
  });
  const [page, setPage] = useState(1);

  const [recipes, setRecipes] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const message = location.state?.toastMessage;
    if (!message) {
      return;
    }

    setToastMessage(message);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToastMessage(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    setPage(1);
  }, [dietaryFilters]);

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
          searchTerm: '',
          dietaryFlags: dietaryFilters,
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
  }, [apiBaseUrl, isSignedIn, getToken, page, dietaryFilters]);

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
    setDietaryFilters({
      vegetarian: false,
      vegan: false,
      halal: false,
      glutenFree: false,
      dairyFree: false,
      nutFree: false,
    });
  };

  const handleSearchSubmit = (value) => {
    const submittedQuery = String(value || '').trim();
    const endpoint = submittedQuery
      ? `/menu-management/recipes?query=${encodeURIComponent(submittedQuery)}`
      : '/menu-management/recipes';

    navigate(endpoint);
  };

  return (
    <MenuManagementLayout
      role={role}
      activeItemKey="dashboard"
      title="Recipe Management"
      subtitle="Create and curate nutritious institutional meal plans"
      query={search}
      onQueryChange={setSearch}
      onQuerySubmit={handleSearchSubmit}
      searchPlaceholder="Search by recipe name or ingredient..."
    >
      {isLoading ? <PageLoadingScreen message="Loading recipes..." /> : null}

      {toastMessage ? (
        <p className="mb-4 rounded-xl border border-[#cce8d0] bg-[#edf8ef] px-4 py-3 text-sm font-semibold text-[#1f7a34] shadow-sm">
          {toastMessage}
        </p>
      ) : null}

      <section className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:grid-rows-[auto_auto] xl:items-stretch">
        <div className="xl:col-start-1 xl:row-span-2 xl:row-start-1 xl:h-full">
          <MenuHero
            title="Nutritional Excellence"
            description="Manage institutional recipes with precision. Ensure every meal meets the highest dietary standards for student vitality."
            ctaLabel="+ New Recipe"
            onCtaClick={() => navigate('/menu-management/recipes/new')}
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
