import { useAuth, useUser } from '@clerk/clerk-react';
import {
  CircleAlert,
  Clock3,
  FilePlus2,
  ImagePlus,
  ListChecks,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { describeApiFetchFailure } from '@/lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '@/lib/resolve-api-base';
import { useAuthRole } from '@/lib/auth/use-auth-role';
import {
  calculateRecipeNutrition,
  createRecipe,
  fetchRecipeById,
  updateRecipe,
} from '../api';
import MenuManagementLayout from '../layouts/MenuManagementLayout';

const SEASONS = ['spring', 'summer', 'fall', 'winter', 'all-year'];
const DIETARY_KEYS = [
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'halal', label: 'Halal' },
  { key: 'glutenFree', label: 'Gluten-Free' },
  { key: 'dairyFree', label: 'Dairy-Free' },
  { key: 'nutFree', label: 'Nut-Free' },
];
const INGREDIENT_UNITS = [
  { value: 'g', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'l', label: 'Liters (l)' },
  { value: 'cup', label: 'Cups (cup)' },
  { value: 'tbsp', label: 'Tablespoons (tbsp)' },
  { value: 'tsp', label: 'Teaspoons (tsp)' },
  { value: 'piece', label: 'Pieces (piece)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'lb', label: 'Pounds (lb)' },
];

function NewRecipePage() {
  const { role } = useAuthRole();
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(recipeId);
  const recipeHydratedRef = useRef(!isEditMode);

  const apiBaseUrl = resolveApiBaseUrl();

  const [recipeName, setRecipeName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [seasons, setSeasons] = useState([]);
  const [imageUrl, setImageUrl] = useState('');

  const [ingredients, setIngredients] = useState([]);
  const [instructions, setInstructions] = useState([]);

  const [dietaryFlags, setDietaryFlags] = useState({
    vegetarian: false,
    vegan: false,
    halal: false,
    glutenFree: false,
    dairyFree: false,
    nutFree: false,
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculatingNutrition, setIsCalculatingNutrition] = useState(false);
  const [nutritionResult, setNutritionResult] = useState(null);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(isEditMode);

  const activeDietaryCount = useMemo(
    () => Object.values(dietaryFlags).filter(Boolean).length,
    [dietaryFlags],
  );

  useEffect(() => {
    if (!recipeHydratedRef.current) {
      return;
    }

    setNutritionResult(null);
  }, [ingredients]);

  useEffect(() => {
    if (!isEditMode) {
      return undefined;
    }

    if (!apiBaseUrl) {
      setFormError('Could not resolve API base URL for menu management.');
      return undefined;
    }

    let active = true;

    const loadRecipe = async () => {
      try {
        setIsLoadingRecipe(true);
        setFormError('');
        recipeHydratedRef.current = false;

        const existingRecipe = await fetchRecipeById({
          apiUrl: apiBaseUrl,
          recipeId,
          getToken: isSignedIn ? getToken : undefined,
        });

        if (!active) {
          return;
        }

        setRecipeName(existingRecipe.name || '');
        setShortDescription(existingRecipe.description || '');
        setPrepTime(
          existingRecipe.prepTime ? String(existingRecipe.prepTime) : '',
        );
        setServingSize(
          existingRecipe.servingSize ? String(existingRecipe.servingSize) : '',
        );
        setSeasons(existingRecipe.seasonal || []);
        setImageUrl(existingRecipe.imageUrl || '');
        setIngredients(
          existingRecipe.ingredients?.length > 0
            ? existingRecipe.ingredients.map((ingredient) => ({
                name: ingredient.name || '',
                quantity:
                  ingredient.quantity === undefined ||
                  ingredient.quantity === null
                    ? ''
                    : ingredient.quantity,
                unit: ingredient.unit || '',
              }))
            : [{ name: '', quantity: '', unit: '' }],
        );
        setInstructions(
          typeof existingRecipe.instructions === 'string' &&
            existingRecipe.instructions.trim().length > 0
            ? existingRecipe.instructions
                .split('\n')
                .map((step) => step.trim())
                .filter(Boolean)
            : [],
        );
        setDietaryFlags({
          vegetarian: Boolean(existingRecipe.dietaryFlags?.vegetarian),
          vegan: Boolean(existingRecipe.dietaryFlags?.vegan),
          halal: Boolean(existingRecipe.dietaryFlags?.halal),
          glutenFree: Boolean(existingRecipe.dietaryFlags?.glutenFree),
          dairyFree: Boolean(existingRecipe.dietaryFlags?.dairyFree),
          nutFree: Boolean(existingRecipe.dietaryFlags?.nutFree),
        });
        setNutritionResult(existingRecipe.nutritionalInfo || null);
        setFormSuccess('');
        recipeHydratedRef.current = true;
      } catch (requestError) {
        if (!active) {
          return;
        }

        setFormError(
          describeApiFetchFailure(
            requestError,
            'Failed to load recipe for editing. Please go back and try again.',
          ),
        );
      } finally {
        if (active) {
          setIsLoadingRecipe(false);
        }
      }
    };

    loadRecipe();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, getToken, isEditMode, isSignedIn, recipeId]);

  const nutritionSnapshot = useMemo(() => {
    const calories = Number(nutritionResult?.calories) || 0;
    const protein = Number(nutritionResult?.protein) || 0;
    const carbs = Number(nutritionResult?.carbs) || 0;
    const fats = Number(nutritionResult?.fats) || 0;
    const fiber = Number(nutritionResult?.fiber) || 0;
    const sugar = Number(nutritionResult?.sugar) || 0;
    const macroTotalWeight = protein + carbs + fats;

    const macroBreakdown = [
      { key: 'carbs', label: 'Carbohydrates', value: carbs, color: '#0f7d2a' },
      { key: 'protein', label: 'Protein', value: protein, color: '#f2b482' },
      { key: 'fats', label: 'Fats', value: fats, color: '#3f7300' },
    ].map((item) => ({
      ...item,
      percentage:
        macroTotalWeight > 0
          ? Math.round((item.value / macroTotalWeight) * 100)
          : 0,
    }));

    const healthInsight =
      carbs > protein + fats
        ? 'This combination is carb-forward and suitable for sustained energy demand windows.'
        : 'This combination is comparatively balanced across major macronutrients.';

    return {
      calories,
      protein,
      carbs,
      fats,
      fiber,
      sugar,
      macroTotalWeight,
      macroBreakdown,
      healthInsight,
    };
  }, [nutritionResult]);

  const clearForm = () => {
    setRecipeName('');
    setShortDescription('');
    setPrepTime('');
    setServingSize('');
    setSeasons([]);
    setImageUrl('');
    setIngredients([]);
    setInstructions([]);
    setDietaryFlags({
      vegetarian: false,
      vegan: false,
      halal: false,
      glutenFree: false,
      dairyFree: false,
      nutFree: false,
    });
    setFormError('');
    setFormSuccess('Draft discarded.');
    setNutritionResult(null);
    setIsCalculatingNutrition(false);
  };

  const discardDraft = () => {
    if (isEditMode) {
      navigate(`/menu-management/recipes/${recipeId}`);
      return;
    }

    clearForm();
  };

  const toggleSeason = (seasonKey) => {
    setSeasons((current) => {
      if (seasonKey === 'all-year') {
        return current.includes('all-year') ? [] : ['all-year'];
      }

      const withoutAllYear = current.filter((item) => item !== 'all-year');
      if (withoutAllYear.includes(seasonKey)) {
        return withoutAllYear.filter((item) => item !== seasonKey);
      }

      return [...withoutAllYear, seasonKey];
    });
  };

  const toggleDietaryFlag = (key) => {
    setDietaryFlags((current) => ({ ...current, [key]: !current[key] }));
  };

  const addIngredient = () => {
    setIngredients((current) => [
      ...current,
      { name: '', quantity: '', unit: '' },
    ]);
  };

  const removeIngredient = (index) => {
    setIngredients((current) => current.filter((_, i) => i !== index));
  };

  const addInstruction = () => {
    setInstructions((current) => [...current, '']);
  };

  const removeInstruction = (index) => {
    setInstructions((current) => current.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors = [];

    if (!recipeName.trim()) {
      errors.push('Recipe name is required.');
    }

    const normalizedIngredients = ingredients
      .map((ingredient) => ({
        name: (ingredient.name || '').trim(),
        unit: (ingredient.unit || '').trim(),
        quantity:
          ingredient.quantity === '' ? NaN : Number(ingredient.quantity),
      }))
      .filter(
        (ingredient) =>
          ingredient.name ||
          ingredient.unit ||
          Number.isFinite(ingredient.quantity),
      );

    if (normalizedIngredients.length === 0) {
      errors.push('At least one ingredient is required.');
    }

    normalizedIngredients.forEach((ingredient, index) => {
      if (!ingredient.name) {
        errors.push(`Ingredient ${index + 1}: name is required.`);
      }
      if (!Number.isFinite(ingredient.quantity) || ingredient.quantity <= 0) {
        errors.push(
          `Ingredient ${index + 1}: quantity must be greater than 0.`,
        );
      }
      if (!ingredient.unit) {
        errors.push(`Ingredient ${index + 1}: unit is required.`);
      }
    });

    const normalizedInstructions = instructions
      .map((step) => (step || '').trim())
      .filter(Boolean);

    if (normalizedInstructions.length === 0) {
      errors.push('At least one kitchen instruction is required.');
    }

    const parsedServingSize = Number(servingSize);
    if (!Number.isFinite(parsedServingSize) || parsedServingSize <= 0) {
      errors.push('Serving size must be greater than 0.');
    }

    return {
      errors,
      normalizedIngredients,
      normalizedInstructions,
      parsedServingSize,
      parsedPrepTime: Number(prepTime) > 0 ? Number(prepTime) : 30,
    };
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setFormError('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        setFormError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async ({ navigateToDetails = false } = {}) => {
    const {
      errors,
      normalizedIngredients,
      normalizedInstructions,
      parsedServingSize,
      parsedPrepTime,
    } = validateForm();

    if (errors.length > 0) {
      setFormSuccess('');
      setFormError(errors[0]);
      return;
    }

    if (!apiBaseUrl) {
      setFormSuccess('');
      setFormError('Could not resolve API base URL for menu management.');
      return;
    }

    if (!nutritionResult) {
      setFormSuccess('');
      setFormError('Please calculate nutrition before saving the recipe.');
      return;
    }

    const createdBy =
      user?.id ||
      user?.primaryEmailAddress?.emailAddress ||
      'menu-management-ui';

    try {
      setIsSaving(true);
      setFormError('');
      setFormSuccess('');

      const nutritionPayload = {
        calories: Number(nutritionResult.calories) || 0,
        protein: Number(nutritionResult.protein) || 0,
        carbs: Number(nutritionResult.carbs) || 0,
        fats: Number(nutritionResult.fats) || 0,
        fiber: Number(nutritionResult.fiber) || 0,
        sugar: Number(nutritionResult.sugar) || 0,
      };

      const savePayload = {
        name: recipeName.trim(),
        description: shortDescription.trim(),
        imageUrl,
        ingredients: normalizedIngredients,
        instructions: normalizedInstructions.join('\n'),
        nutritionalInfo: nutritionPayload,
        servingSize: parsedServingSize,
        prepTime: parsedPrepTime,
        dietaryFlags,
        seasonal: seasons,
        allergens: [],
        createdBy,
      };

      const savedRecipe = isEditMode
        ? await updateRecipe({
            apiUrl: apiBaseUrl,
            recipeId,
            getToken: isSignedIn ? getToken : undefined,
            payload: savePayload,
          })
        : await createRecipe({
            apiUrl: apiBaseUrl,
            getToken: isSignedIn ? getToken : undefined,
            payload: savePayload,
          });

      setFormSuccess(
        isEditMode
          ? 'Recipe updated successfully.'
          : 'Recipe saved successfully.',
      );

      if (navigateToDetails && savedRecipe?.id) {
        navigate(`/menu-management/recipes/${savedRecipe.id}`, {
          state: {
            toastMessage: isEditMode
              ? 'Recipe updated successfully.'
              : 'Recipe saved successfully.',
          },
        });
      }
    } catch (requestError) {
      setFormSuccess('');
      setFormError(
        describeApiFetchFailure(
          requestError,
          'Failed to save recipe. Please review required fields.',
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCalculateNutrition = async () => {
    const normalizedIngredients = ingredients
      .map((ingredient) => ({
        name: (ingredient.name || '').trim(),
        unit: (ingredient.unit || '').trim(),
        quantity:
          ingredient.quantity === '' ? NaN : Number(ingredient.quantity),
      }))
      .filter(
        (ingredient) =>
          ingredient.name ||
          ingredient.unit ||
          Number.isFinite(ingredient.quantity),
      );

    if (normalizedIngredients.length === 0) {
      setFormSuccess('');
      setFormError('Add at least one ingredient before calculating nutrition.');
      return;
    }

    const hasInvalidIngredient = normalizedIngredients.some(
      (ingredient) =>
        !ingredient.name ||
        !ingredient.unit ||
        !Number.isFinite(ingredient.quantity) ||
        ingredient.quantity <= 0,
    );

    if (hasInvalidIngredient) {
      setFormSuccess('');
      setFormError(
        'Each ingredient must include a name, unit, and quantity greater than 0.',
      );
      return;
    }

    if (!apiBaseUrl) {
      setFormSuccess('');
      setFormError('Could not resolve API base URL for menu management.');
      return;
    }

    try {
      setIsCalculatingNutrition(true);
      setFormError('');
      setFormSuccess('');

      const nutrition = await calculateRecipeNutrition({
        apiUrl: apiBaseUrl,
        ingredients: normalizedIngredients,
        getToken: isSignedIn ? getToken : undefined,
      });

      setNutritionResult(nutrition);
      setFormSuccess('Nutrition calculated successfully.');
    } catch (requestError) {
      setFormSuccess('');
      setFormError(
        describeApiFetchFailure(
          requestError,
          'Failed to calculate nutrition. Please review ingredient details.',
        ),
      );
    } finally {
      setIsCalculatingNutrition(false);
    }
  };

  return (
    <MenuManagementLayout
      role={role}
      activeItemKey="recipes"
      title={isEditMode ? 'Edit Recipe' : 'Create New Recipe'}
      subtitle={
        isEditMode
          ? 'Update the saved recipe while keeping nutritional data in sync.'
          : 'Curate a fresh nutritional masterpiece for the district.'
      }
      searchPlaceholder=""
    >
      <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-[#6f7782] uppercase">
            Recipes • New Entry
          </p>
          <h2 className="text-[2rem] font-bold tracking-[-0.03em] text-[#27333f]">
            {isEditMode ? 'Edit Recipe' : 'Create New Recipe'}
          </h2>
          <p className="text-sm text-[#667383]">
            {isEditMode
              ? 'Update the recipe details and re-save the calculated nutrition.'
              : 'Ensure all dietary markers are strictly verified before publishing.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={discardDraft}
            disabled={isSaving || isLoadingRecipe}
            className="rounded-xl border border-[#d9dee4] bg-white px-4 py-2 text-sm font-semibold text-[#4b5a6a] hover:bg-[#f4f6f8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isEditMode ? 'Discard Changes' : 'Discard Draft'}
          </button>
          <button
            type="button"
            disabled={isSaving || isLoadingRecipe}
            onClick={() => handleSave({ navigateToDetails: isEditMode })}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f7d2a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d6d25] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={14} />
            {isSaving
              ? 'Saving...'
              : isEditMode
                ? 'Update Recipe'
                : 'Quick Save'}
          </button>
        </div>
      </section>

      {isLoadingRecipe ? (
        <p className="mb-4 rounded-xl border border-[#dfe6dc] bg-[#f4fbf5] px-4 py-3 text-sm text-[#1f7a34]">
          Loading recipe details...
        </p>
      ) : null}

      {formError ? (
        <p className="mb-4 rounded-xl border border-[#f3cece] bg-[#fdecec] px-4 py-3 text-sm text-[#a61e1e]">
          {formError}
        </p>
      ) : null}

      {formSuccess ? (
        <p className="mb-4 rounded-xl border border-[#cce8d0] bg-[#edf8ef] px-4 py-3 text-sm text-[#1f7a34]">
          {formSuccess}
        </p>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <article className="space-y-4 rounded-[20px] bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
          <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-[#1f7a34]">
            <FilePlus2 size={16} />
            Recipe Identity
          </h3>

          <div className="space-y-3">
            <label className="block text-xs font-semibold tracking-[0.08em] text-[#6e7480] uppercase">
              Recipe Name *
              <input
                value={recipeName}
                onChange={(event) => setRecipeName(event.target.value)}
                required
                placeholder="e.g. Heirloom Tomato & Basil Bisque"
                className="mt-1 w-full rounded-xl border border-[#dde2e7] bg-[#f5f7f6] px-3 py-3 text-sm text-[#344355] outline-none focus:ring-2 focus:ring-[#7cc08a]"
              />
            </label>

            <label className="block text-xs font-semibold tracking-[0.08em] text-[#6e7480] uppercase">
              Short Description
              <textarea
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
                rows={3}
                placeholder="A brief editorial note about this recipe's flavor profile..."
                className="mt-1 w-full resize-none rounded-xl border border-[#dde2e7] bg-[#f5f7f6] px-3 py-3 text-sm text-[#344355] outline-none focus:ring-2 focus:ring-[#7cc08a]"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="rounded-xl border border-[#dde2e7] bg-[#f5f7f6] p-3 text-xs font-semibold tracking-[0.08em] text-[#6e7480] uppercase">
              Prep Time (min)
              <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#2f3b4d] normal-case">
                <Clock3 size={14} />
                <input
                  type="number"
                  value={prepTime}
                  min={1}
                  onChange={(event) =>
                    setPrepTime(
                      event.target.value === ''
                        ? ''
                        : Number(event.target.value),
                    )
                  }
                  className="w-20 rounded-md border border-[#d4dbe2] bg-white px-2 py-1"
                />
              </div>
            </label>

            <label className="rounded-xl border border-[#dde2e7] bg-[#f5f7f6] p-3 text-xs font-semibold tracking-[0.08em] text-[#6e7480] uppercase">
              Serving Size *
              <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#2f3b4d] normal-case">
                <Users size={14} />
                <input
                  type="number"
                  value={servingSize}
                  min={1}
                  required
                  onChange={(event) =>
                    setServingSize(
                      event.target.value === ''
                        ? ''
                        : Number(event.target.value),
                    )
                  }
                  className="w-20 rounded-md border border-[#d4dbe2] bg-white px-2 py-1"
                />
                Students
              </div>
            </label>
          </div>

          <div className="rounded-xl bg-[#f5f7f6] p-3">
            <p className="mb-2 text-xs font-semibold tracking-[0.08em] text-[#6e7480] uppercase">
              Availability & Seasonality
            </p>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map((season) => {
                const active = seasons.includes(season);
                return (
                  <button
                    key={season}
                    type="button"
                    onClick={() => toggleSeason(season)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                      active
                        ? 'bg-[#0f7d2a] text-white'
                        : 'border border-[#d7dce2] bg-white text-[#536175] hover:bg-[#eef2f5]'
                    }`}
                  >
                    {season}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-[#f5f7f6] p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[#245e2f]">
                Kitchen Instructions *
              </h4>
              <button
                type="button"
                onClick={addInstruction}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#96571d]"
              >
                <Plus size={12} />
                Add Step
              </button>
            </div>

            <ol className="space-y-2">
              {instructions.map((step, index) => (
                <li
                  key={`step-${index}`}
                  className="grid grid-cols-[auto_1fr_auto] items-start gap-2"
                >
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#86d28f] text-xs font-semibold text-[#1d3f23]">
                    {index + 1}
                  </span>
                  <textarea
                    value={step}
                    required
                    onChange={(event) =>
                      setInstructions((current) =>
                        current.map((item, i) =>
                          i === index ? event.target.value : item,
                        ),
                      )
                    }
                    rows={2}
                    className="w-full resize-none rounded-lg border border-[#d8dee5] bg-white px-2 py-2 text-sm text-[#445468]"
                  />
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    className="mt-1 rounded-md p-1 text-[#7a848f] hover:bg-[#eceff2]"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </article>

        <article className="space-y-4">
          <div className="rounded-[20px] bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
            <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-[#1f7a34]">
              <ListChecks size={16} />
              Ingredients & Yield
            </h3>

            <div className="mt-3 grid grid-cols-[1.3fr_0.9fr_0.8fr_auto] items-center gap-2 border-b border-[#e3e6ea] pb-2 text-[11px] font-semibold tracking-[0.08em] text-[#667383] uppercase">
              <p>Ingredient Name</p>
              <p>Quantity</p>
              <p>Unit</p>
              <p>Actions</p>
            </div>

            <div className="mt-2 space-y-2">
              {ingredients.map((ingredient, index) => (
                <div
                  key={`ingredient-${index}`}
                  className="grid grid-cols-[1.3fr_0.9fr_0.8fr_auto] items-center gap-2 rounded-xl bg-[#f4f6f7] p-2"
                >
                  <input
                    value={ingredient.name}
                    required
                    placeholder="Ingredient name"
                    onChange={(event) =>
                      setIngredients((current) =>
                        current.map((item, i) =>
                          i === index
                            ? { ...item, name: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className="rounded-md border border-[#d8dee4] bg-[#edf1ef] px-2 py-1.5 text-xs text-[#425365]"
                  />
                  <input
                    type="number"
                    value={ingredient.quantity}
                    min={0}
                    required
                    placeholder="Qty"
                    onChange={(event) =>
                      setIngredients((current) =>
                        current.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                quantity:
                                  event.target.value === ''
                                    ? ''
                                    : Number(event.target.value),
                              }
                            : item,
                        ),
                      )
                    }
                    className="w-full rounded-md border border-[#d8dee4] bg-[#edf1ef] px-2 py-1.5 text-xs"
                  />
                  <select
                    value={ingredient.unit}
                    required
                    onChange={(event) =>
                      setIngredients((current) =>
                        current.map((item, i) =>
                          i === index
                            ? { ...item, unit: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className="w-full rounded-md border border-[#d8dee4] bg-[#edf1ef] px-2 py-1.5 text-xs text-[#425365]"
                  >
                    <option value="" disabled>
                      Unit
                    </option>
                    {INGREDIENT_UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="rounded-md p-1 text-[#b73a30] hover:bg-[#eceff2]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={addIngredient}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f7d2a]"
              >
                <Plus size={14} />
                Add Row
              </button>

              <button
                type="button"
                onClick={handleCalculateNutrition}
                disabled={isCalculatingNutrition}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f7d2a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d6d25] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ListChecks size={14} />
                {isCalculatingNutrition
                  ? 'Calculating...'
                  : 'Calculate Nutrition'}
              </button>
            </div>
          </div>

          <div className="rounded-[20px] bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
            <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-[#1f7a34]">
              <ShieldCheck size={16} />
              Dietary Compliance
            </h3>

            <p className="mt-2 text-xs font-semibold tracking-[0.08em] text-[#7a848f] uppercase">
              Dietary Markers
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {DIETARY_KEYS.map((item) => {
                const active = dietaryFlags[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleDietaryFlag(item.key)}
                    className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs font-semibold ${
                      active
                        ? 'border-[#76c588] bg-[#edf8ef] text-[#1f7a34]'
                        : 'border-[#dbe1e7] bg-[#f7f8f9] text-[#5e6c7f]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        active ? 'bg-[#1f7a34]' : 'bg-[#c7cfd8]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-[#667383]">
              {activeDietaryCount} dietary markers currently selected.
            </p>
          </div>

          <div className="overflow-hidden rounded-[20px] border border-[#e3e6ea] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Recipe preview"
                className="h-36 w-full object-cover"
              />
            ) : (
              <div className="h-36 bg-[linear-gradient(135deg,#ebd8bf_0%,#f3e7d8_45%,#d8e5cf_100%)]" />
            )}

            <label className="flex cursor-pointer items-center justify-center gap-2 border-t border-[#e3e6ea] bg-[#f8faf8] px-3 py-2 text-sm font-semibold text-[#49615a] hover:bg-[#eef3ef]">
              <ImagePlus size={14} />
              {imageUrl ? 'Change Image' : 'Add Image'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </article>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.7fr)]">
        <article className="rounded-[14px] border border-[#e1e5ea] bg-white p-4">
          <h4 className="text-2xl font-semibold tracking-[-0.02em] text-[#2e3338]">
            Nutritional Information
          </h4>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#b9e1c2] bg-[#d7f1dc] px-3 py-4">
              <p className="text-[10px] font-semibold tracking-[0.08em] text-[#4a6c52] uppercase">
                Calories
              </p>
              <p className="mt-1 text-3xl font-bold text-[#1f7a34]">
                {nutritionSnapshot.calories}
                <span className="ml-1 text-sm font-medium text-[#5f8067]">
                  kcal
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-[#e8ebef] bg-[#f3f5f4] px-3 py-4">
              <p className="text-[10px] font-semibold tracking-[0.08em] text-[#6a737e] uppercase">
                Protein
              </p>
              <p className="mt-1 text-3xl font-bold text-[#2e3338]">
                {nutritionSnapshot.protein}
                <span className="ml-1 text-sm font-medium text-[#737f8f]">
                  g
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-[#e8ebef] bg-[#f3f5f4] px-3 py-4">
              <p className="text-[10px] font-semibold tracking-[0.08em] text-[#6a737e] uppercase">
                Carbs
              </p>
              <p className="mt-1 text-3xl font-bold text-[#2e3338]">
                {nutritionSnapshot.carbs}
                <span className="ml-1 text-sm font-medium text-[#737f8f]">
                  g
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-[#e8ebef] bg-[#f3f5f4] px-3 py-4">
              <p className="text-[10px] font-semibold tracking-[0.08em] text-[#6a737e] uppercase">
                Fats
              </p>
              <p className="mt-1 text-3xl font-bold text-[#2e3338]">
                {nutritionSnapshot.fats}
                <span className="ml-1 text-sm font-medium text-[#737f8f]">
                  g
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-[#e8ebef] bg-[#f3f5f4] px-3 py-4">
              <p className="text-[10px] font-semibold tracking-[0.08em] text-[#6a737e] uppercase">
                Fiber
              </p>
              <p className="mt-1 text-3xl font-bold text-[#2e3338]">
                {nutritionSnapshot.fiber}
                <span className="ml-1 text-sm font-medium text-[#737f8f]">
                  g
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-[#e8ebef] bg-[#f3f5f4] px-3 py-4">
              <p className="text-[10px] font-semibold tracking-[0.08em] text-[#6a737e] uppercase">
                Sugar
              </p>
              <p className="mt-1 text-3xl font-bold text-[#2e3338]">
                {nutritionSnapshot.sugar}
                <span className="ml-1 text-sm font-medium text-[#737f8f]">
                  g
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[#f0e7df] bg-[#fbf5ef] px-4 py-3">
            <p className="inline-flex items-center gap-1 text-xs font-semibold text-[#a45a20]">
              <CircleAlert size={14} />
              Health Insight
            </p>
            <p className="mt-1 text-sm text-[#8b5f3d]">
              {nutritionSnapshot.healthInsight}
            </p>
          </div>
        </article>

        <article className="rounded-[14px] border border-[#e1e5ea] bg-white p-4">
          <h4 className="text-2xl font-semibold tracking-[-0.02em] text-[#2e3338]">
            Macro Breakdown
          </h4>

          <div className="mt-4 flex justify-center">
            <div
              className="relative h-36 w-36 rounded-full"
              style={{
                background: `conic-gradient(
                  #0f7d2a 0 ${nutritionSnapshot.macroBreakdown[0].percentage}%,
                  #f2b482 ${nutritionSnapshot.macroBreakdown[0].percentage}% ${nutritionSnapshot.macroBreakdown[0].percentage + nutritionSnapshot.macroBreakdown[1].percentage}%,
                  #3f7300 ${nutritionSnapshot.macroBreakdown[0].percentage + nutritionSnapshot.macroBreakdown[1].percentage}% 100%
                )`,
              }}
            >
              <div className="absolute inset-3.5 flex flex-col items-center justify-center rounded-full bg-white text-center">
                <p className="text-2xl font-bold text-[#2e3338]">
                  {nutritionSnapshot.macroTotalWeight}g
                </p>
                <p className="text-[10px] font-semibold tracking-widest text-[#7a828d] uppercase">
                  Total Weight
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {nutritionSnapshot.macroBreakdown.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between text-sm text-[#2e3338]"
              >
                <p className="inline-flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </p>
                <p className="font-semibold">{item.percentage}%</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <p className="mt-4 text-center text-[11px] text-[#818994]">
        Powered by USDA FoodData Central API
      </p>

      <footer className="mt-5 grid grid-cols-1 gap-3 rounded-[14px] border border-[#e1e5ea] bg-white p-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.12em] text-[#7b828f] uppercase">
            Current Status
          </p>
          <p className="text-sm font-semibold text-[#c06c1d]">Draft Mode</p>
        </div>

        <button
          type="button"
          disabled={isSaving || isLoadingRecipe}
          onClick={() => handleSave({ navigateToDetails: true })}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f7d2a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d6d25] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={14} />
          {isSaving
            ? 'Saving...'
            : isEditMode
              ? 'Update Recipe'
              : 'Save Recipe'}
        </button>
      </footer>
    </MenuManagementLayout>
  );
}

export default NewRecipePage;
