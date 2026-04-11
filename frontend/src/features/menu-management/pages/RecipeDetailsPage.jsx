import { useAuth } from '@clerk/clerk-react';
import {
  BadgeCheck,
  BookOpen,
  Clock3,
  Heart,
  Leaf,
  Minus,
  Pencil,
  Plus,
  Printer,
  ShoppingBasket,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { describeApiFetchFailure } from '@/lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '@/lib/resolve-api-base';
import { useAuthRole } from '@/lib/auth/use-auth-role';
import { deleteRecipe, fetchRecipeById, updateRecipeServingSize } from '../api';
import { PageLoadingScreen } from '../components';
import MenuManagementLayout from '../layouts/MenuManagementLayout';

const FALLBACK_RECIPE = {
  id: 'sample-rice-dhal',
  name: 'Rice and Dhal',
  description:
    'A staple school-day favorite: wholesome red lentils paired with fluffy basmati rice. Balanced, filling, and cost-effective for large batches.',
  prepTime: 30,
  servingSize: 4,
  ingredients: [
    { name: 'Rice (Basmati)', quantity: 200, unit: 'g' },
    { name: 'Red Lentils', quantity: 100, unit: 'g' },
    { name: 'Onion (Finely diced)', quantity: 50, unit: 'g' },
    { name: 'Salt', quantity: 5, unit: 'g' },
  ],
  dietaryFlags: {
    vegetarian: true,
    vegan: true,
    halal: true,
    glutenFree: true,
  },
  allergens: [],
  nutritionalInfo: {
    calories: 130,
    protein: 4,
    carbs: 27,
    fats: 0.5,
    fiber: 2,
  },
};

const PREPARATION_STEPS = [
  {
    title: 'Rinse Lentils & Rice',
    description:
      'Thoroughly wash the red lentils and rice under cold running water until the water runs clear. Soak the lentils for 15 minutes if time permits for faster cooking.',
  },
  {
    title: 'Simmer Dhal',
    description:
      'Place lentils in a large pot with 300ml water and diced onion. Bring to a boil, then simmer on low heat for 20 minutes until the lentils are soft and creamy.',
  },
  {
    title: 'Cook Rice',
    description:
      'While dhal is simmering, cook rice in a separate steamer or pot until fluffy. Season with half the salt provided.',
  },
  {
    title: 'Combine & Season',
    description:
      'Stir remaining salt into the dhal. Serve the dhal over a generous bed of rice. Garnish with fresh herbs if available in the kitchen inventory.',
  },
];

function formatQuantity(quantity) {
  if (typeof quantity !== 'number' || Number.isNaN(quantity)) {
    return '--';
  }
  if (Number.isInteger(quantity)) {
    return String(quantity);
  }
  return quantity.toFixed(1);
}

function getActiveDietTags(dietaryFlags = {}) {
  return Object.entries({
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    halal: 'Halal',
    glutenFree: 'Gluten-Free',
    dairyFree: 'Dairy-Free',
    nutFree: 'Nut-Free',
  })
    .filter(([key]) => dietaryFlags[key] === true)
    .map(([, label]) => label);
}

function RecipeDetailsPage() {
  const { role } = useAuthRole();
  const { isSignedIn, getToken } = useAuth();
  const { recipeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const apiBaseUrl = resolveApiBaseUrl();
  const [servings, setServings] = useState(FALLBACK_RECIPE.servingSize);
  const [recipe, setRecipe] = useState(FALLBACK_RECIPE);
  const [error, setError] = useState('');
  const [isPageLoading, setIsPageLoading] = useState(Boolean(recipeId));
  const [isUpdatingServings, setIsUpdatingServings] = useState(false);
  const [servingsSaved, setServingsSaved] = useState(false);
  const [isDeletingRecipe, setIsDeletingRecipe] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!recipeId) {
      setRecipe(FALLBACK_RECIPE);
      setServings(FALLBACK_RECIPE.servingSize);
      setIsPageLoading(false);
      return;
    }

    if (!apiBaseUrl) {
      setError('Could not resolve API base URL for menu management.');
      return;
    }

    let active = true;

    const loadRecipe = async () => {
      setIsPageLoading(true);
      setError('');
      try {
        const fetched = await fetchRecipeById({
          apiUrl: apiBaseUrl,
          recipeId,
          getToken: isSignedIn ? getToken : undefined,
        });

        if (!active) {
          return;
        }

        setRecipe(fetched);
        setServings(fetched.servingSize || 1);
      } catch (requestError) {
        if (!active) {
          return;
        }
        setError(
          describeApiFetchFailure(
            requestError,
            'Failed to load recipe details. Showing sample view instead.',
          ),
        );
        setRecipe(FALLBACK_RECIPE);
        setServings(FALLBACK_RECIPE.servingSize);
      } finally {
        if (active) {
          setIsPageLoading(false);
        }
      }
    };

    loadRecipe();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, getToken, isSignedIn, recipeId]);

  const dietTags = useMemo(
    () => getActiveDietTags(recipe.dietaryFlags),
    [recipe.dietaryFlags],
  );
  const preparationSteps = useMemo(() => {
    const instructionLines =
      typeof recipe.instructions === 'string'
        ? recipe.instructions
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
        : [];

    if (instructionLines.length > 0) {
      return instructionLines.map((line, index) => ({
        title: `Step ${index + 1}`,
        description: line,
      }));
    }

    return PREPARATION_STEPS;
  }, [recipe.instructions]);

  const nutrition = recipe.nutritionalInfo || FALLBACK_RECIPE.nutritionalInfo;
  const canMutateRecipe = Boolean(recipeId && recipeId !== FALLBACK_RECIPE.id);

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

  const handleEditRecipe = () => {
    if (!canMutateRecipe) {
      return;
    }

    navigate(`/menu-management/recipes/${recipeId}/edit`);
  };

  const handleDeleteRecipe = async () => {
    if (!canMutateRecipe) {
      return;
    }

    const confirmed = window.confirm(
      'Delete this recipe? This action cannot be undone.',
    );

    if (!confirmed) {
      return;
    }

    if (!apiBaseUrl) {
      setError('Could not resolve API base URL for menu management.');
      return;
    }

    try {
      setIsDeletingRecipe(true);
      setError('');

      await deleteRecipe({
        apiUrl: apiBaseUrl,
        recipeId,
        getToken: isSignedIn ? getToken : undefined,
      });

      setTimeout(() => {
        navigate('/menu-management/menus', {
          state: { toastMessage: 'Recipe deleted successfully.' },
        });
      }, 900);
    } catch (requestError) {
      setError(
        describeApiFetchFailure(
          requestError,
          'Failed to delete recipe. Please try again.',
        ),
      );
    } finally {
      setIsDeletingRecipe(false);
    }
  };

  const persistServings = async (nextServings) => {
    if (nextServings < 1) {
      return;
    }

    const previousServings = servings;
    setServings(nextServings);

    // Keep fallback/sample mode local-only when no persisted recipe id exists.
    if (!recipeId || recipeId === FALLBACK_RECIPE.id) {
      setRecipe((current) => ({ ...current, servingSize: nextServings }));
      setServingsSaved(true);
      return;
    }

    if (!apiBaseUrl) {
      setError('Could not resolve API base URL for menu management.');
      setServings(previousServings);
      return;
    }

    try {
      setIsUpdatingServings(true);
      setError('');

      const updated = await updateRecipeServingSize({
        apiUrl: apiBaseUrl,
        recipeId,
        servingSize: nextServings,
        getToken: isSignedIn ? getToken : undefined,
      });

      setRecipe(updated);
      setServings(updated.servingSize || nextServings);
      setServingsSaved(true);
    } catch (requestError) {
      setServings(previousServings);
      setServingsSaved(false);
      setError(
        describeApiFetchFailure(requestError, 'Failed to update serving size.'),
      );
    } finally {
      setIsUpdatingServings(false);
    }
  };

  useEffect(() => {
    if (!servingsSaved) {
      return undefined;
    }

    const timer = window.setTimeout(() => setServingsSaved(false), 1800);
    return () => window.clearTimeout(timer);
  }, [servingsSaved]);

  return (
    <MenuManagementLayout
      role={role}
      activeItemKey="recipes"
      title="Recipes"
      subtitle={recipe.name}
      searchPlaceholder="Search institutional database..."
    >
      {isPageLoading ? (
        <PageLoadingScreen message="Loading recipe details..." />
      ) : null}

      {toastMessage ? (
        <p className="mb-4 rounded-xl border border-[#cce8d0] bg-[#edf8ef] px-4 py-3 text-sm font-semibold text-[#1f7a34] shadow-sm">
          {toastMessage}
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-xl border border-[#f3cece] bg-[#fdecec] px-4 py-3 text-sm text-[#a61e1e]">
          {error}
        </p>
      ) : null}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="overflow-hidden rounded-[24px] bg-[#151a22] shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
          <div className="relative h-full min-h-84 bg-[radial-gradient(circle_at_20%_20%,#5d6f83_0%,#263443_45%,#171c26_100%)]">
            {recipe.imageUrl ? (
              <img
                src={recipe.imageUrl}
                alt={recipe.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_36%,#f7d856_0%,#f0c832_18%,#b58d2a_34%,transparent_40%),radial-gradient(circle_at_42%_58%,#fafafa_0%,#ececec_22%,#d8d8d8_38%,transparent_48%)] opacity-90" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(9,13,19,0.82)_0%,rgba(9,13,19,0.14)_45%,rgba(9,13,19,0)_100%)]" />
            <div className="absolute right-4 bottom-4 left-4 z-10">
              <div className="mb-3 flex flex-wrap gap-2">
                {dietTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#d9f0a9] px-2.5 py-1 text-[11px] font-semibold text-[#39521f]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h2 className="text-[2.55rem] leading-tight font-bold tracking-[-0.03em] text-white">
                {recipe.name}
              </h2>
            </div>
          </div>
        </article>

        <article className="rounded-[24px] bg-white p-5 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleEditRecipe}
              disabled={!canMutateRecipe}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#d8dee5] bg-white px-4 py-2 text-sm font-semibold text-[#334255] hover:bg-[#f4f6f8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pencil size={14} />
              Edit Recipe
            </button>
            <button
              type="button"
              onClick={handleDeleteRecipe}
              disabled={!canMutateRecipe || isDeletingRecipe}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#b83a2f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9f2f26] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={14} />
              {isDeletingRecipe ? 'Deleting...' : 'Delete Recipe'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#f4f7f3] p-3">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-[#6d6f74] uppercase">
                Prep Time
              </p>
              <p className="mt-1 text-sm font-semibold text-[#1c2633]">
                {recipe.prepTime || 0} min
              </p>
            </div>
            <div className="rounded-2xl bg-[#f4f7f3] p-3">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-[#6d6f74] uppercase">
                Difficulty
              </p>
              <p className="mt-1 text-sm font-semibold text-[#1c2633]">
                Beginner
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-[#5d6675]">
            {recipe.description}
          </p>

          <div className="mt-5 rounded-xl border border-[#e6e8eb] bg-[#f9faf9] p-3">
            <div className="flex items-center justify-between text-sm font-semibold text-[#223447]">
              <span>Adjust Servings</span>
              <div className="flex items-center gap-2 rounded-full bg-white px-2 py-1 shadow-sm">
                <button
                  type="button"
                  className="rounded-md p-1 text-[#526071] hover:bg-[#eef1f3]"
                  onClick={() => persistServings(Math.max(1, servings - 1))}
                  disabled={isUpdatingServings}
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-5 text-center text-sm font-bold text-[#1f2f40]">
                  {servings}
                </span>
                <button
                  type="button"
                  className="rounded-md p-1 text-[#526071] hover:bg-[#eef1f3]"
                  onClick={() => persistServings(servings + 1)}
                  disabled={isUpdatingServings}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            {isUpdatingServings ? (
              <p className="mt-2 text-xs font-medium text-[#526071]">
                Saving serving size...
              </p>
            ) : null}
            {!isUpdatingServings && servingsSaved ? (
              <p className="mt-2 text-xs font-semibold text-[#12702a]">
                Serving size updated.
              </p>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f7d2a] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0d6d25]"
            >
              <Printer size={14} />
              Print Batch Labels
            </button>
            <button
              type="button"
              className="rounded-xl bg-[#f4d8b9] px-3 text-[#744d2d] hover:bg-[#efcca4]"
            >
              <Heart size={16} />
            </button>
          </div>
        </article>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)]">
        <article className="space-y-4">
          <div className="rounded-[20px] bg-white p-5 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
            <h3 className="mb-3 inline-flex items-center gap-2 text-[1.65rem] font-semibold tracking-[-0.02em] text-[#27333f]">
              <ShoppingBasket size={18} className="text-[#12702a]" />
              Ingredients
            </h3>

            <ul className="space-y-3">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={`${ingredient.name}-${index}`}
                  className="flex items-center gap-2"
                >
                  <span className="inline-block h-4 w-4 rounded-lg border border-[#98e0a2] bg-[#e9f7eb]" />
                  <span className="w-16 text-sm font-semibold text-[#212932]">
                    {formatQuantity(ingredient.quantity)}
                    {ingredient.unit}
                  </span>
                  <span className="text-sm text-[#566273]">
                    {ingredient.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[16px] border-l-4 border-[#168a34] bg-[#f4f5f5] p-4">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#58606a] uppercase">
              Allergens
            </p>
            <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-[#1f2a35]">
              <BadgeCheck size={15} className="text-[#1c7d32]" />
              {recipe.allergens.length > 0
                ? recipe.allergens.join(', ')
                : 'None'}
            </p>
          </div>
        </article>

        <article className="rounded-[20px] bg-white p-5 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
          <h3 className="mb-4 inline-flex items-center gap-2 text-[1.65rem] font-semibold tracking-[-0.02em] text-[#27333f]">
            <BookOpen size={18} className="text-[#12702a]" />
            Preparation Steps
          </h3>

          <ol className="space-y-5">
            {preparationSteps.map((step, index) => (
              <li
                key={`${step.title}-${index}`}
                className="grid grid-cols-[2.2rem_1fr] gap-4"
              >
                <div className="relative flex justify-center">
                  <span className="z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#117b2f] text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  {index < preparationSteps.length - 1 ? (
                    <span className="absolute top-8 h-[calc(100%+1rem)] w-px bg-[#d7dde3]" />
                  ) : null}
                </div>
                <div>
                  <p className="text-base font-semibold text-[#25313f]">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#5b6677]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="mt-5 rounded-[24px] bg-[radial-gradient(circle_at_10%_20%,#3f2212_0%,transparent_24%),radial-gradient(circle_at_88%_26%,#1a4f2d_0%,transparent_26%),linear-gradient(135deg,#11141b_0%,#202632_100%)] p-6 text-white shadow-[0_8px_22px_rgba(0,0,0,0.25)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[1.95rem] font-semibold tracking-[-0.03em]">
              Nutritional Profile
            </h3>
            <p className="mt-1 text-xs text-[#bdc3ce]">
              Verified values per standard serving (Approx. 350g cooked)
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-[#1f3428] px-3 py-1 text-[10px] font-semibold tracking-[0.12em] text-[#8ee49f] uppercase">
            <Leaf size={12} />
            Green Tier Rating
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-2xl border border-[#2a2f3a] bg-[#1d212c] p-4">
            <p className="text-[10px] tracking-[0.12em] text-[#9ca4b0] uppercase">
              Calories
            </p>
            <p className="mt-1 text-4xl font-bold text-white">
              {nutrition.calories}
              <span className="ml-1 text-sm text-[#8ee49f]">kcal</span>
            </p>
          </div>

          <div className="rounded-2xl border border-[#2a2f3a] bg-[#1d212c] p-4">
            <p className="text-[10px] tracking-[0.12em] text-[#9ca4b0] uppercase">
              Protein
            </p>
            <p className="mt-1 text-4xl font-bold text-white">
              {nutrition.protein}
              <span className="ml-1 text-sm text-[#8ee49f]">g</span>
            </p>
          </div>

          <div className="rounded-2xl border border-[#2a2f3a] bg-[#1d212c] p-4">
            <p className="text-[10px] tracking-[0.12em] text-[#9ca4b0] uppercase">
              Carbs
            </p>
            <p className="mt-1 text-4xl font-bold text-white">
              {nutrition.carbs}
              <span className="ml-1 text-sm text-[#8ee49f]">g</span>
            </p>
          </div>

          <div className="rounded-2xl border border-[#2a2f3a] bg-[#1d212c] p-4">
            <p className="text-[10px] tracking-[0.12em] text-[#9ca4b0] uppercase">
              Fats
            </p>
            <p className="mt-1 text-4xl font-bold text-white">
              {nutrition.fats}
              <span className="ml-1 text-sm text-[#8ee49f]">g</span>
            </p>
          </div>

          <div className="rounded-2xl border border-[#2a2f3a] bg-[#1d212c] p-4">
            <p className="text-[10px] tracking-[0.12em] text-[#9ca4b0] uppercase">
              Fiber
            </p>
            <p className="mt-1 text-4xl font-bold text-white">
              {nutrition.fiber}
              <span className="ml-1 text-sm text-[#8ee49f]">g</span>
            </p>
          </div>
        </div>
      </section>
    </MenuManagementLayout>
  );
}

export default RecipeDetailsPage;
