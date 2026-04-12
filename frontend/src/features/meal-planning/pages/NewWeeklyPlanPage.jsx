import { useAuth, useUser } from '@clerk/clerk-react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Leaf,
  Loader2,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { describeApiFetchFailure } from '@/lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '@/lib/resolve-api-base';
import { useAuthRole } from '@/lib/auth/use-auth-role';
import { PageLoadingScreen } from '@/features/menu-management/components';
import { fetchRecipeCatalog } from '@/features/menu-management/api';
import MenuManagementLayout from '@/features/menu-management/layouts/MenuManagementLayout';
import {
  fetchDistrictOverview,
  createMealPlan,
  decrementInventoryQuantity,
  fetchMealPlanById,
  fetchInventoryItems,
  fetchSchoolEnrollment,
  updateMealPlan,
} from '../api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const UNIT_ALIASES = {
  g: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  l: 'l',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  cup: 'cup',
  cups: 'cup',
  piece: 'piece',
  pieces: 'piece',
  pc: 'piece',
  pcs: 'piece',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',
};

const UNIT_FACTORS = {
  mass: {
    g: 1,
    kg: 1000,
    oz: 28.3495,
    lb: 453.592,
  },
  volume: {
    ml: 1,
    l: 1000,
    tsp: 5,
    tbsp: 15,
    cup: 240,
  },
  count: {
    piece: 1,
  },
};

const MEAL_CONFIGS = [
  {
    key: 'breakfast',
    title: 'Breakfast',
    subtitle: 'Morning Vitality',
    icon: UtensilsCrossed,
    iconClassName: 'rounded-[10px] bg-[#fde9d7] p-2 text-[#ad6a2d]',
  },
  {
    key: 'lunch',
    title: 'Lunch',
    subtitle: 'Nutritional Peak',
    icon: Sparkles,
    iconClassName: 'rounded-[10px] bg-[#def4dc] p-2 text-[#2d7b3a]',
  },
  {
    key: 'snack',
    title: 'Snack',
    subtitle: 'Sustained Energy',
    icon: Leaf,
    iconClassName: 'rounded-[10px] bg-[#eff5d3] p-2 text-[#678b20]',
  },
];

function buildEmptyDayMeals() {
  return {
    breakfast: '',
    lunch: '',
    snack: '',
  };
}

function buildInitialMealsByDay() {
  return DAYS.reduce((accumulator, day) => {
    accumulator[day] = buildEmptyDayMeals();
    return accumulator;
  }, {});
}

function formatInputDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildCurrentWeekRange() {
  const start = new Date();
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 4);

  return {
    startDate: formatInputDate(start),
    endDate: formatInputDate(end),
  };
}

function alignToMonday(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return formatInputDate(date);
}

function mondayToFriday(mondayValue) {
  const monday = new Date(mondayValue);
  if (Number.isNaN(monday.getTime())) {
    return '';
  }

  monday.setDate(monday.getDate() + 4);
  return formatInputDate(monday);
}

function toLabelDate(value) {
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

function normalizeText(value = '') {
  return String(value).trim().toLowerCase();
}

function normalizeUnit(value = '') {
  const normalized = normalizeText(value);
  return UNIT_ALIASES[normalized] || normalized;
}

function formatQuantity(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0';
  }

  if (Math.abs(numeric) >= 100) {
    return numeric.toFixed(0);
  }

  return numeric.toFixed(2);
}

function convertUnit(quantity, fromUnit, toUnit) {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);

  if (!Number.isFinite(quantity)) {
    return null;
  }

  if (!from || !to) {
    return null;
  }

  if (from === to) {
    return quantity;
  }

  const groupName = Object.keys(UNIT_FACTORS).find((group) => {
    return UNIT_FACTORS[group][from] && UNIT_FACTORS[group][to];
  });

  if (!groupName) {
    return null;
  }

  const fromFactor = UNIT_FACTORS[groupName][from];
  const toFactor = UNIT_FACTORS[groupName][to];
  const inBaseUnit = quantity * fromFactor;

  return inBaseUnit / toFactor;
}

function findInventoryForIngredient(inventoryItems, ingredientName) {
  const normalizedIngredient = normalizeText(ingredientName);
  if (!normalizedIngredient) {
    return null;
  }

  return (
    inventoryItems.find(
      (item) => normalizeText(item.name) === normalizedIngredient,
    ) ||
    inventoryItems.find((item) => {
      const itemName = normalizeText(item.name);
      return (
        itemName.includes(normalizedIngredient) ||
        normalizedIngredient.includes(itemName)
      );
    }) ||
    null
  );
}

function buildMealInsight(
  recipe,
  studentCount,
  inventoryItems,
  reservedByItemId = new Map(),
) {
  if (!recipe) {
    return null;
  }

  const students = Math.max(0, Number(studentCount) || 0);
  const recipeServingSize = Math.max(1, Number(recipe.servingSize) || 1);
  const multiplier = students > 0 ? students / recipeServingSize : 0;

  const ingredientChecks = (
    Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  ).map((ingredient) => {
    const requiredQuantity = (Number(ingredient.quantity) || 0) * multiplier;
    const inventoryMatch = findInventoryForIngredient(
      inventoryItems,
      ingredient.name,
    );
    const availableQuantity = Number(inventoryMatch?.quantity);
    const inventoryId = inventoryMatch?.id || inventoryMatch?._id || null;
    const reservedQuantity = inventoryId
      ? Number(reservedByItemId.get(inventoryId) || 0)
      : 0;
    const hasInventoryItem = Boolean(inventoryMatch);
    const availableAfterReservation = Number.isFinite(availableQuantity)
      ? availableQuantity - reservedQuantity
      : null;
    const requiredInInventoryUnit = hasInventoryItem
      ? convertUnit(requiredQuantity, ingredient.unit, inventoryMatch?.unit)
      : null;

    const availableInRecipeUnit =
      hasInventoryItem && Number.isFinite(availableAfterReservation)
        ? convertUnit(
            availableAfterReservation,
            inventoryMatch?.unit,
            ingredient.unit,
          )
        : null;

    const comparableUnits =
      hasInventoryItem &&
      availableInRecipeUnit !== null &&
      requiredInInventoryUnit !== null;
    const enoughStock =
      comparableUnits &&
      Number.isFinite(availableAfterReservation) &&
      availableAfterReservation + 0.0001 >= requiredInInventoryUnit;
    const needsStock = requiredQuantity > 0;
    const shortageQuantity =
      comparableUnits && !enoughStock
        ? requiredQuantity - availableInRecipeUnit
        : 0;
    const reservationAmount =
      needsStock && comparableUnits && Number.isFinite(requiredInInventoryUnit)
        ? requiredInInventoryUnit
        : 0;

    return {
      ingredientName: ingredient.name,
      inventoryId,
      unit: ingredient.unit,
      requiredQuantity,
      availableQuantity: Number.isFinite(availableAfterReservation)
        ? availableAfterReservation
        : 0,
      availableUnit: inventoryMatch?.unit || '',
      availableInRecipeUnit,
      hasInventoryItem,
      comparableUnits,
      needsStock,
      enoughStock,
      shortageQuantity,
      reservationAmount,
    };
  });

  const blockingChecks = ingredientChecks.filter(
    (check) =>
      check.needsStock &&
      (!check.hasInventoryItem || !check.comparableUnits || !check.enoughStock),
  );

  const orderedChecks = [...ingredientChecks].sort((a, b) => {
    const aBlocked =
      a.needsStock &&
      (!a.hasInventoryItem || !a.comparableUnits || !a.enoughStock);
    const bBlocked =
      b.needsStock &&
      (!b.hasInventoryItem || !b.comparableUnits || !b.enoughStock);

    if (aBlocked === bBlocked) {
      return 0;
    }

    return aBlocked ? -1 : 1;
  });

  return {
    targetServings: students,
    portionMultiplier: multiplier,
    ingredientChecks: orderedChecks,
    canServe: blockingChecks.length === 0,
    reservations: orderedChecks
      .filter((check) => check.inventoryId && check.reservationAmount > 0)
      .map((check) => ({
        inventoryId: check.inventoryId,
        amount: check.reservationAmount,
      })),
  };
}

function MealCard({
  config,
  recipes,
  selectedRecipeId,
  onSelectRecipe,
  mealInsight,
  studentCount,
}) {
  const Icon = config.icon;
  const insufficientChecks = (mealInsight?.ingredientChecks || []).filter(
    (check) =>
      check.needsStock &&
      (!check.hasInventoryItem || !check.comparableUnits || !check.enoughStock),
  );

  return (
    <article className="rounded-[18px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-3 flex items-center gap-3">
        <span className={config.iconClassName}>
          <Icon size={16} />
        </span>
        <div>
          <h3 className="text-xl font-semibold text-[#303633]">
            {config.title}
          </h3>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#7f857d] uppercase">
            {config.subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)_minmax(0,1fr)]">
        <label className="text-xs font-semibold tracking-widest text-[#7e847c] uppercase">
          Select Recipe
          <select
            value={selectedRecipeId}
            onChange={(event) => onSelectRecipe(event.target.value)}
            className="mt-1 w-full rounded-[10px] border border-[#e2e8df] bg-[#f5f7f4] px-3 py-2 text-sm font-medium text-[#3f4c43] normal-case"
          >
            <option value="">Select {config.key} recipe</option>
            {recipes.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold tracking-widest text-[#7e847c] uppercase">
          Portions
          <input
            type="number"
            readOnly
            value={mealInsight?.targetServings ?? studentCount}
            className="mt-1 w-full rounded-[10px] border border-[#e2e8df] bg-[#eef2ec] px-3 py-2 text-sm font-medium text-[#3f4c43] normal-case"
          />
        </label>

        <label className="text-xs font-semibold tracking-widest text-[#7e847c] uppercase">
          Portion Multiplier
          <input
            type="text"
            readOnly
            value={
              mealInsight
                ? `${mealInsight.portionMultiplier.toFixed(2)}x`
                : '--'
            }
            className="mt-1 w-full rounded-[10px] border border-[#e2e8df] bg-[#eef2ec] px-3 py-2 text-sm font-medium text-[#3f4c43] normal-case"
          />
        </label>
      </div>

      <div className="mt-4 rounded-[12px] border border-[#e6ece3] bg-[#f8faf7] px-3 py-3">
        <p className="text-xs font-semibold tracking-widest text-[#6f766f] uppercase">
          Auto Portion & Inventory Check
        </p>
        <p className="mt-1 text-sm text-[#4d574f]">
          Students in selected school:{' '}
          <span className="font-semibold">{studentCount}</span>
        </p>

        {mealInsight ? (
          <>
            <div className="mt-2 flex items-center gap-2 text-sm">
              {mealInsight.canServe ? (
                <>
                  <CheckCircle2 size={16} className="text-[#1f7a34]" />
                  <span className="font-medium text-[#1f7a34]">
                    Ingredients are sufficient.
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} className="text-[#b25e1a]" />
                  <span className="font-medium text-[#b25e1a]">
                    Missing or insufficient ingredients detected.
                  </span>
                </>
              )}
            </div>

            {!mealInsight.canServe ? (
              <div className="mt-3 space-y-2">
                {insufficientChecks.map((check) => (
                  <div
                    key={check.ingredientName}
                    className="rounded-[10px] border border-[#f3d2b1] bg-[#fff1e4] px-3 py-2 text-xs text-[#9a5d24]"
                  >
                    <p className="font-semibold">{check.ingredientName}</p>
                    <p>
                      Required: {formatQuantity(check.requiredQuantity)}{' '}
                      {check.unit}
                    </p>
                    {check.hasInventoryItem ? (
                      check.comparableUnits ? (
                        <p>
                          Available:{' '}
                          {formatQuantity(check.availableInRecipeUnit)}{' '}
                          {check.unit}
                        </p>
                      ) : (
                        <p>
                          Available: {formatQuantity(check.availableQuantity)}{' '}
                          {check.availableUnit} ({check.unit} comparison
                          unavailable)
                        </p>
                      )
                    ) : (
                      <p>Not found in inventory.</p>
                    )}
                    {check.shortageQuantity > 0 ? (
                      <p>
                        Short by: {formatQuantity(check.shortageQuantity)}{' '}
                        {check.unit}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-2 text-sm text-[#6f766f]">
            Select a recipe to auto-calculate portions and verify ingredients.
          </p>
        )}
      </div>
    </article>
  );
}

function NewWeeklyPlanPage() {
  const { role } = useAuthRole();
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const apiBaseUrl = resolveApiBaseUrl();
  const [searchParams] = useSearchParams();

  const editPlanIdFromQuery = searchParams.get('planId') || '';
  const isEditMode = Boolean(editPlanIdFromQuery);
  const schoolIdFromQuery = searchParams.get('schoolId') || '';
  const schoolNameFromQuery = searchParams.get('school') || '';

  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(schoolIdFromQuery);
  const [schoolError, setSchoolError] = useState('');
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);

  const initialRange = useMemo(() => buildCurrentWeekRange(), []);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);

  const [recipes, setRecipes] = useState([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [recipesError, setRecipesError] = useState('');

  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState('');

  const [studentCount, setStudentCount] = useState(0);
  const [isLoadingStudentCount, setIsLoadingStudentCount] = useState(false);
  const [studentError, setStudentError] = useState('');
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveAction, setSaveAction] = useState('');
  const [saveFeedback, setSaveFeedback] = useState({ type: '', message: '' });

  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedMealsByDay, setSelectedMealsByDay] = useState(
    buildInitialMealsByDay,
  );

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
        const schoolList = await fetchDistrictOverview({
          apiUrl: apiBaseUrl,
          getToken: isSignedIn ? getToken : undefined,
        });

        if (!active) {
          return;
        }

        setSchools(schoolList);
        setSelectedSchoolId((current) => {
          if (current && schoolList.some((school) => school.id === current)) {
            return current;
          }

          if (
            schoolIdFromQuery &&
            schoolList.some((school) => school.id === schoolIdFromQuery)
          ) {
            return schoolIdFromQuery;
          }

          return schoolList[0]?.id || '';
        });
      } catch (requestError) {
        if (!active) {
          return;
        }

        setSchoolError(
          describeApiFetchFailure(
            requestError,
            'Failed to load schools for creating meal plans.',
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
  }, [apiBaseUrl, getToken, isSignedIn, schoolIdFromQuery]);

  useEffect(() => {
    if (!apiBaseUrl || !selectedSchoolId || !startDate || !endDate) {
      setRecipes([]);
      return undefined;
    }

    let active = true;

    const loadRecipes = async () => {
      setIsLoadingRecipes(true);
      setRecipesError('');

      try {
        const result = await fetchRecipeCatalog({
          apiUrl: apiBaseUrl,
          getToken: isSignedIn ? getToken : undefined,
          page: 1,
          pageSize: 100,
          searchTerm: '',
          dietaryFlags: {},
          course: 'all',
        });

        if (!active) {
          return;
        }

        setRecipes(Array.isArray(result?.allRecipes) ? result.allRecipes : []);
      } catch (requestError) {
        if (!active) {
          return;
        }

        setRecipesError(
          describeApiFetchFailure(
            requestError,
            'Failed to load recipes from the recipes database.',
          ),
        );
      } finally {
        if (active) {
          setIsLoadingRecipes(false);
        }
      }
    };

    loadRecipes();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, endDate, getToken, isSignedIn, selectedSchoolId, startDate]);

  useEffect(() => {
    if (!apiBaseUrl || !editPlanIdFromQuery) {
      return undefined;
    }

    let active = true;

    const loadPlanForEditing = async () => {
      setIsLoadingPlan(true);
      setSaveFeedback({ type: '', message: '' });

      try {
        const existingPlan = await fetchMealPlanById({
          apiUrl: apiBaseUrl,
          planId: editPlanIdFromQuery,
          getToken: isSignedIn ? getToken : undefined,
        });

        if (!active || !existingPlan) {
          return;
        }

        const mondayValue = alignToMonday(
          formatInputDate(existingPlan.weekStartDate),
        );
        const nextMealsByDay = buildInitialMealsByDay();

        (existingPlan.meals || []).forEach((meal) => {
          const day = meal?.day;
          const mealType = meal?.mealType;
          if (
            !DAYS.includes(day) ||
            !MEAL_CONFIGS.some((config) => config.key === mealType)
          ) {
            return;
          }

          nextMealsByDay[day][mealType] = meal.recipeId || '';
        });

        setSelectedSchoolId(existingPlan.schoolId || '');
        setStartDate(mondayValue);
        setEndDate(mondayToFriday(mondayValue));
        setSelectedMealsByDay(nextMealsByDay);
        setSelectedDay('Monday');
      } catch (requestError) {
        if (!active) {
          return;
        }

        setSaveFeedback({
          type: 'error',
          message: describeApiFetchFailure(
            requestError,
            'Failed to load meal plan for editing.',
          ),
        });
      } finally {
        if (active) {
          setIsLoadingPlan(false);
        }
      }
    };

    loadPlanForEditing();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, editPlanIdFromQuery, getToken, isSignedIn]);

  useEffect(() => {
    if (!apiBaseUrl || !selectedSchoolId) {
      setStudentCount(0);
      return undefined;
    }

    let active = true;

    const loadStudentCount = async () => {
      setIsLoadingStudentCount(true);
      setStudentError('');

      try {
        const enrollment = await fetchSchoolEnrollment({
          apiUrl: apiBaseUrl,
          schoolId: selectedSchoolId,
          getToken: isSignedIn ? getToken : undefined,
        });

        if (active) {
          setStudentCount(enrollment);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        setStudentError(
          describeApiFetchFailure(
            requestError,
            'Failed to load student count for the selected school.',
          ),
        );
      } finally {
        if (active) {
          setIsLoadingStudentCount(false);
        }
      }
    };

    loadStudentCount();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, getToken, isSignedIn, selectedSchoolId]);

  useEffect(() => {
    if (!apiBaseUrl) {
      return undefined;
    }

    let active = true;

    const loadInventory = async () => {
      setIsLoadingInventory(true);
      setInventoryError('');

      try {
        const items = await fetchInventoryItems({
          apiUrl: apiBaseUrl,
          getToken: isSignedIn ? getToken : undefined,
        });

        if (active) {
          setInventoryItems(items);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        setInventoryError(
          describeApiFetchFailure(
            requestError,
            'Failed to load inventory items for ingredient checks.',
          ),
        );
      } finally {
        if (active) {
          setIsLoadingInventory(false);
        }
      }
    };

    loadInventory();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, getToken, isSignedIn]);

  const selectedSchool = useMemo(
    () => schools.find((school) => school.id === selectedSchoolId) || null,
    [schools, selectedSchoolId],
  );

  const effectiveSchoolName =
    selectedSchool?.schoolName || schoolNameFromQuery || 'School not selected';

  const recipeById = useMemo(() => {
    return recipes.reduce((map, recipe) => {
      map.set(recipe.id, recipe);
      return map;
    }, new Map());
  }, [recipes]);

  const planningComputation = useMemo(() => {
    const reservationMap = new Map();
    const mealInsightsByDay = {};

    DAYS.forEach((day) => {
      mealInsightsByDay[day] = {};
      const dayMeals = selectedMealsByDay[day] || buildEmptyDayMeals();

      MEAL_CONFIGS.forEach((config) => {
        const insight = buildMealInsight(
          recipeById.get(dayMeals[config.key]),
          studentCount,
          inventoryItems,
          reservationMap,
        );

        mealInsightsByDay[day][config.key] = insight;

        if (insight?.reservations) {
          insight.reservations.forEach((reservation) => {
            const current = Number(
              reservationMap.get(reservation.inventoryId) || 0,
            );
            reservationMap.set(
              reservation.inventoryId,
              current + reservation.amount,
            );
          });
        }
      });
    });

    return {
      mealInsightsByDay,
      deductions: [...reservationMap.entries()].map(
        ([inventoryId, amount]) => ({
          inventoryId,
          amount,
        }),
      ),
    };
  }, [inventoryItems, recipeById, selectedMealsByDay, studentCount]);

  const mealInsightsByDay = planningComputation.mealInsightsByDay;
  const mealInsights = mealInsightsByDay[selectedDay] || {};
  const plannedDeductions = planningComputation.deductions;

  const handleMealRecipeChange = (day, mealKey, value) => {
    setSelectedMealsByDay((current) => ({
      ...current,
      [day]: {
        ...(current[day] || buildEmptyDayMeals()),
        [mealKey]: value,
      },
    }));
  };

  const hasAnyMealSelected = DAYS.some((day) => {
    const dayMeals = selectedMealsByDay[day] || buildEmptyDayMeals();
    return MEAL_CONFIGS.some((config) => Boolean(dayMeals[config.key]));
  });

  const isMealPlanComplete = DAYS.every((day) => {
    const dayMeals = selectedMealsByDay[day] || buildEmptyDayMeals();
    return MEAL_CONFIGS.every((config) => Boolean(dayMeals[config.key]));
  });

  const getFirstBlockingSelection = () => {
    for (const day of DAYS) {
      const dayMeals = selectedMealsByDay[day] || buildEmptyDayMeals();

      for (const config of MEAL_CONFIGS) {
        const selected = Boolean(dayMeals[config.key]);
        const insight = mealInsightsByDay[day]?.[config.key];

        if (selected && insight && !insight.canServe) {
          return { day, title: config.title };
        }
      }
    }

    return null;
  };

  const buildMealPlanPayload = (status) => {
    const createdBy =
      user?.id || user?.primaryEmailAddress?.emailAddress || 'meal-planning-ui';

    const meals = [];

    DAYS.forEach((day) => {
      const dayMeals = selectedMealsByDay[day] || buildEmptyDayMeals();

      MEAL_CONFIGS.forEach((config) => {
        const recipeId = dayMeals[config.key];
        if (!recipeId) {
          return;
        }

        const recipe = recipeById.get(recipeId);
        const insight = mealInsightsByDay[day]?.[config.key];

        meals.push({
          day,
          mealType: config.key,
          recipeId,
          recipeName: recipe?.name || '',
          plannedServings: Math.max(
            1,
            Math.round(insight?.targetServings || studentCount || 1),
          ),
          notes: '',
        });
      });
    });

    return {
      schoolId: selectedSchoolId,
      schoolName: selectedSchool?.schoolName || schoolNameFromQuery || '',
      weekStartDate: startDate,
      weekEndDate: endDate,
      meals,
      status,
      createdBy,
    };
  };

  const handleStartDateChange = (value) => {
    const mondayValue = alignToMonday(value);
    if (!mondayValue) {
      return;
    }

    setStartDate(mondayValue);
    setEndDate(mondayToFriday(mondayValue));
  };

  const loadInventory = async () => {
    const items = await fetchInventoryItems({
      apiUrl: apiBaseUrl,
      getToken: isSignedIn ? getToken : undefined,
    });
    setInventoryItems(items);
  };

  const handleSaveMealPlan = async (status) => {
    setSaveFeedback({ type: '', message: '' });

    if (!hasAnyMealSelected) {
      setSaveFeedback({
        type: 'error',
        message: 'Select at least one meal before saving.',
      });
      return;
    }

    const blockingMeal = getFirstBlockingSelection();
    if (blockingMeal) {
      setSaveFeedback({
        type: 'error',
        message: `Cannot save. ${blockingMeal.day} ${blockingMeal.title} has insufficient ingredients.`,
      });
      return;
    }

    if (status === 'planned' && plannedDeductions.length === 0) {
      setSaveFeedback({
        type: 'error',
        message: 'No inventory deductions were calculated for selected meals.',
      });
      return;
    }

    if (status === 'planned' && !isMealPlanComplete) {
      setSaveFeedback({
        type: 'error',
        message:
          'Select breakfast, lunch, and snack for every day before creating the meal plan.',
      });
      return;
    }

    setSaveAction(status);
    setIsSaving(true);

    try {
      const mealPlanPayload = buildMealPlanPayload(status);

      if (!mealPlanPayload.meals.length) {
        setSaveFeedback({
          type: 'error',
          message:
            'No meal plan payload was generated from the selected meals.',
        });
        return;
      }

      if (isEditMode) {
        await updateMealPlan({
          apiUrl: apiBaseUrl,
          planId: editPlanIdFromQuery,
          getToken: isSignedIn ? getToken : undefined,
          payload: mealPlanPayload,
        });
      } else {
        await createMealPlan({
          apiUrl: apiBaseUrl,
          getToken: isSignedIn ? getToken : undefined,
          payload: mealPlanPayload,
        });
      }

      if (status === 'planned') {
        for (const deduction of plannedDeductions) {
          const roundedAmount = Number(deduction.amount.toFixed(4));
          if (roundedAmount <= 0) {
            continue;
          }

          // Sequential decrement avoids concurrent over-allocation races in the UI flow.
          await decrementInventoryQuantity({
            apiUrl: apiBaseUrl,
            itemId: deduction.inventoryId,
            amount: roundedAmount,
            getToken: isSignedIn ? getToken : undefined,
          });
        }

        await loadInventory();
      }

      setSaveFeedback({
        type: 'success',
        message: isEditMode
          ? 'Meal plan updated successfully.'
          : status === 'draft'
            ? 'Meal draft saved to the database successfully.'
            : 'Meal plan saved as planned and inventory quantities deducted successfully.',
      });
      navigate(-1);
    } catch (requestError) {
      setSaveFeedback({
        type: 'error',
        message: describeApiFetchFailure(
          requestError,
          isEditMode
            ? 'Failed to update meal plan.'
            : status === 'draft'
              ? 'Failed to save draft.'
              : 'Failed to save planned meal plan and deduct inventory quantities.',
        ),
      });
    } finally {
      setSaveAction('');
      setIsSaving(false);
    }
  };

  const planningStatus = useMemo(
    () => `${isEditMode ? 'Editing' : 'Drafting'} ${selectedDay}`,
    [isEditMode, selectedDay],
  );
  const dateRangeLabel = `${toLabelDate(startDate)} - ${toLabelDate(endDate)}`;
  const isChecking =
    isLoadingRecipes ||
    isLoadingStudentCount ||
    isLoadingInventory ||
    isLoadingPlan;

  return (
    <MenuManagementLayout
      role={role}
      activeItemKey="dashboard"
      title={isEditMode ? 'Edit Weekly Plan' : 'New Weekly Plan'}
      subtitle={
        isEditMode
          ? 'Update an existing meal plan with refreshed selections.'
          : 'Design a structured meal plan with nutrition-first controls.'
      }
      searchPlaceholder=""
    >
      <div className="grid grid-cols-1 gap-5">
        <section className="space-y-4">
          {isLoadingSchools ? (
            <PageLoadingScreen message="Loading schools..." />
          ) : null}
          {isLoadingPlan ? (
            <PageLoadingScreen message="Loading meal plan..." />
          ) : null}

          {schoolError ? (
            <p className="rounded-xl border border-[#f3cece] bg-[#fdecec] px-4 py-3 text-sm text-[#a61e1e]">
              {schoolError}
            </p>
          ) : null}

          {recipesError ? (
            <p className="rounded-xl border border-[#f3cece] bg-[#fdecec] px-4 py-3 text-sm text-[#a61e1e]">
              {recipesError}
            </p>
          ) : null}

          {studentError ? (
            <p className="rounded-xl border border-[#f3cece] bg-[#fdecec] px-4 py-3 text-sm text-[#a61e1e]">
              {studentError}
            </p>
          ) : null}

          {inventoryError ? (
            <p className="rounded-xl border border-[#f3cece] bg-[#fdecec] px-4 py-3 text-sm text-[#a61e1e]">
              {inventoryError}
            </p>
          ) : null}

          <div className="rounded-[18px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#7d8478] uppercase">
              {isEditMode
                ? 'Meal Plans › Edit Weekly Plan'
                : 'Meal Plans › New Weekly Plan'}
            </p>
            <h2 className="mt-1 text-[2.1rem] font-semibold tracking-[-0.03em] text-[#2a2f2c]">
              {effectiveSchoolName}
            </h2>
            <p className="text-sm text-[#6f766f]">
              Portions and ingredient readiness are calculated automatically per
              meal.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="text-xs font-semibold tracking-widest text-[#7e847c] uppercase">
                School
                <div className="relative mt-1">
                  <select
                    value={selectedSchoolId}
                    onChange={(event) =>
                      setSelectedSchoolId(event.target.value)
                    }
                    className="w-full appearance-none rounded-[10px] border border-[#e2e8df] bg-[#f5f7f4] px-3 py-2 pr-9 text-sm font-medium text-[#3f4c43] normal-case"
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

              <label className="text-xs font-semibold tracking-widest text-[#7e847c] uppercase">
                Start Date
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    handleStartDateChange(event.target.value)
                  }
                  title="Start date is restricted to Mondays"
                  className="mt-1 w-full rounded-[10px] border border-[#e2e8df] bg-[#f5f7f4] px-3 py-2 text-sm font-medium text-[#3f4c43] normal-case"
                />
              </label>

              <label className="text-xs font-semibold tracking-widest text-[#7e847c] uppercase">
                End Date
                <input
                  type="date"
                  value={endDate}
                  readOnly
                  disabled
                  title="End date is set automatically to Friday"
                  className="mt-1 w-full cursor-not-allowed rounded-[10px] border border-[#e2e8df] bg-[#eef2ec] px-3 py-2 text-sm font-medium text-[#3f4c43] normal-case"
                />
              </label>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#dce3d8] bg-[#f8faf7] px-4 py-2 text-sm text-[#4e5d52]">
              <CalendarDays size={15} className="text-[#1f7a34]" />
              {dateRangeLabel}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-[#edf4ec] px-3 py-1 font-semibold text-[#2b6b36]">
                Students: {studentCount}
              </span>
              <span className="rounded-full bg-[#f2f4f1] px-3 py-1 font-semibold text-[#5b665f]">
                Inventory Items: {inventoryItems.length}
              </span>
              {isChecking ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#f5efe7] px-3 py-1 font-semibold text-[#9a5d24]">
                  <Loader2 size={12} className="animate-spin" />
                  Updating calculations
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 rounded-[16px] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {DAYS.map((day) => {
              const active = day === selectedDay;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-[#0f7d2a] text-white'
                      : 'bg-[#f3f5f2] text-[#5d665f] hover:bg-[#e9ede7]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            {MEAL_CONFIGS.map((config) => (
              <MealCard
                key={config.key}
                config={config}
                recipes={recipes}
                selectedRecipeId={
                  selectedMealsByDay[selectedDay]?.[config.key] || ''
                }
                onSelectRecipe={(value) =>
                  handleMealRecipeChange(selectedDay, config.key, value)
                }
                mealInsight={mealInsights[config.key]}
                studentCount={studentCount}
              />
            ))}
          </div>
        </section>

        <footer className="rounded-[16px] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {saveFeedback.message ? (
            <p
              className={`mb-3 rounded-[10px] border px-3 py-2 text-sm ${
                saveFeedback.type === 'success'
                  ? 'border-[#cde7d2] bg-[#edf8ef] text-[#226f35]'
                  : 'border-[#f3d2b1] bg-[#fff1e4] text-[#9a5d24]'
              }`}
            >
              {saveFeedback.message}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-[#666f67]">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-[#7b8278] uppercase">
                Status
              </p>
              <p className="font-semibold text-[#c06c1d]">
                {planningStatus}
                {isChecking ? ' • Calculating portions' : ''}
              </p>
            </div>

            <div className="text-sm text-[#666f67]">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-[#7b8278] uppercase">
                Data Source
              </p>
              <p className="font-semibold text-[#1f7a34]">
                {recipes.length} recipes • {inventoryItems.length} inventory
                items
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSaveMealPlan('draft')}
                disabled={isSaving || isChecking}
                className="rounded-full px-4 py-2 text-sm font-semibold text-[#1f7a34]"
              >
                {isSaving && saveAction === 'draft'
                  ? 'Saving...'
                  : isEditMode
                    ? 'Save Changes'
                    : 'Save as Draft'}
              </button>
              <button
                type="button"
                onClick={() => handleSaveMealPlan('planned')}
                disabled={isSaving || isChecking || !isMealPlanComplete}
                className="rounded-full bg-[#0f7d2a] px-5 py-2 text-sm font-semibold text-white"
                title={
                  isMealPlanComplete
                    ? isEditMode
                      ? 'Update meal plan as planned'
                      : 'Create meal plan'
                    : 'Select breakfast, lunch, and snack for every day to create the meal plan'
                }
              >
                {isSaving && saveAction === 'planned'
                  ? isEditMode
                    ? 'Updating...'
                    : 'Saving...'
                  : isEditMode
                    ? 'Update as Planned'
                    : 'Create Meal Plan'}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </MenuManagementLayout>
  );
}

export default NewWeeklyPlanPage;
