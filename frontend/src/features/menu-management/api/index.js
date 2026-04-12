import { fetchApi } from '@/lib/api-client';

const DIETARY_KEYS = [
  'vegetarian',
  'vegan',
  'halal',
  'glutenFree',
  'dairyFree',
  'nutFree',
];

const BREAKFAST_KEYWORDS = ['breakfast', 'oat', 'pancake', 'porridge', 'egg'];
const LUNCH_KEYWORDS = ['lunch', 'rice', 'curry', 'stir fry', 'sandwich'];
const DINNER_KEYWORDS = ['dinner', 'soup', 'stew', 'pasta'];

function normalizeRecipe(recipe = {}) {
  return {
    id: recipe.id,
    name: recipe.name || 'Untitled Recipe',
    description: recipe.description || 'No description available.',
    imageUrl: recipe.imageUrl || '',
    instructions: recipe.instructions || '',
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    servingSize: Number(recipe.servingSize) || 0,
    prepTime: Number(recipe.prepTime) || 0,
    seasonal: Array.isArray(recipe.seasonal) ? recipe.seasonal : [],
    allergens: Array.isArray(recipe.allergens) ? recipe.allergens : [],
    dietaryFlags: recipe.dietaryFlags || {},
    nutritionalInfo: recipe.nutritionalInfo || null,
  };
}

function hasAnyDietaryFlag(flags = {}) {
  return DIETARY_KEYS.some((key) => flags[key] === true);
}

function buildDietaryQuery(flags = {}) {
  const params = new URLSearchParams();
  DIETARY_KEYS.forEach((key) => {
    if (flags[key] === true) {
      params.set(key, 'true');
    }
  });
  return params.toString();
}

function matchesRecipeQuery(recipe, query) {
  const normalizedQuery = String(query || '')
    .trim()
    .toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const name = String(recipe.name || '').toLowerCase();
  const ingredientNames = (recipe.ingredients || [])
    .map((ingredient) => String(ingredient.name || '').toLowerCase())
    .join(' ');

  return (
    name.includes(normalizedQuery) || ingredientNames.includes(normalizedQuery)
  );
}

function inferCourse(recipe) {
  const haystack = `${recipe.name} ${recipe.description}`.toLowerCase();

  if (BREAKFAST_KEYWORDS.some((word) => haystack.includes(word))) {
    return 'breakfast';
  }
  if (LUNCH_KEYWORDS.some((word) => haystack.includes(word))) {
    return 'lunch';
  }
  if (DINNER_KEYWORDS.some((word) => haystack.includes(word))) {
    return 'dinner';
  }
  return 'any';
}

function filterByCourse(recipes, course) {
  if (!course || course === 'all') {
    return recipes;
  }

  return recipes.filter((recipe) => {
    const inferred = inferCourse(recipe);
    return inferred === course || inferred === 'any';
  });
}

async function fetchMenuApi({ url, getToken, options }) {
  const response = await fetchApi({ url, getToken, options });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.error ||
        payload?.message ||
        `Request failed with status ${response.status}`,
    );
  }

  return payload;
}

export async function fetchRecipeCatalog({
  apiUrl,
  getToken,
  page = 1,
  pageSize = 8,
  searchTerm = '',
  dietaryFlags = {},
  course = 'all',
}) {
  if (!apiUrl) {
    throw new Error('API base URL is not configured.');
  }

  const query = searchTerm.trim();
  let payload;

  if (query) {
    const endpoint = new URL('/api/recipes', apiUrl);
    endpoint.searchParams.set('page', '1');
    endpoint.searchParams.set('limit', '100');
    payload = await fetchMenuApi({ url: endpoint.toString(), getToken });
  } else if (hasAnyDietaryFlag(dietaryFlags)) {
    const endpoint = new URL('/api/recipes/search/dietary', apiUrl);
    const dietaryQuery = buildDietaryQuery(dietaryFlags);
    if (dietaryQuery) {
      endpoint.search = dietaryQuery;
    }
    payload = await fetchMenuApi({ url: endpoint.toString(), getToken });
  } else {
    const endpoint = new URL('/api/recipes', apiUrl);
    endpoint.searchParams.set('page', '1');
    endpoint.searchParams.set('limit', '100');
    payload = await fetchMenuApi({ url: endpoint.toString(), getToken });
  }

  const normalizedRecipes = Array.isArray(payload?.data)
    ? payload.data.map(normalizeRecipe)
    : [];

  const searchFilteredRecipes = query
    ? normalizedRecipes.filter((recipe) => matchesRecipeQuery(recipe, query))
    : normalizedRecipes;

  const courseFilteredRecipes = filterByCourse(searchFilteredRecipes, course);
  const total = courseFilteredRecipes.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    recipes: courseFilteredRecipes.slice(start, start + pageSize),
    allRecipes: courseFilteredRecipes,
    total,
    page: safePage,
    totalPages,
  };
}

export async function fetchRecipeById({ apiUrl, recipeId, getToken }) {
  if (!apiUrl) {
    throw new Error('API base URL is not configured.');
  }

  if (!recipeId) {
    throw new Error('Recipe id is required.');
  }

  const endpoint = new URL(`/api/recipes/${recipeId}`, apiUrl);
  const payload = await fetchMenuApi({ url: endpoint.toString(), getToken });

  return normalizeRecipe(payload?.data || {});
}

export async function updateRecipeServingSize({
  apiUrl,
  recipeId,
  servingSize,
  getToken,
}) {
  if (!apiUrl) {
    throw new Error('API base URL is not configured.');
  }

  if (!recipeId) {
    throw new Error('Recipe id is required.');
  }

  if (!Number.isFinite(servingSize) || servingSize <= 0) {
    throw new Error('Serving size must be greater than 0.');
  }

  const endpoint = new URL(`/api/recipes/${recipeId}`, apiUrl);
  const payload = await fetchMenuApi({
    url: endpoint.toString(),
    getToken,
    options: {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ servingSize }),
    },
  });

  return normalizeRecipe(payload?.data || {});
}

export async function updateRecipe({ apiUrl, recipeId, payload, getToken }) {
  if (!apiUrl) {
    throw new Error('API base URL is not configured.');
  }

  if (!recipeId) {
    throw new Error('Recipe id is required.');
  }

  const endpoint = new URL(`/api/recipes/${recipeId}`, apiUrl);
  const responsePayload = await fetchMenuApi({
    url: endpoint.toString(),
    getToken,
    options: {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  });

  return normalizeRecipe(responsePayload?.data || {});
}

export async function deleteRecipe({ apiUrl, recipeId, getToken }) {
  if (!apiUrl) {
    throw new Error('API base URL is not configured.');
  }

  if (!recipeId) {
    throw new Error('Recipe id is required.');
  }

  const endpoint = new URL(`/api/recipes/${recipeId}`, apiUrl);
  await fetchMenuApi({
    url: endpoint.toString(),
    getToken,
    options: {
      method: 'DELETE',
    },
  });

  return true;
}

export async function createRecipe({ apiUrl, payload, getToken }) {
  if (!apiUrl) {
    throw new Error('API base URL is not configured.');
  }

  const endpoint = new URL('/api/recipes', apiUrl);
  const responsePayload = await fetchMenuApi({
    url: endpoint.toString(),
    getToken,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  });

  return normalizeRecipe(responsePayload?.data || {});
}

export async function calculateRecipeNutrition({
  apiUrl,
  ingredients,
  getToken,
}) {
  if (!apiUrl) {
    throw new Error('API base URL is not configured.');
  }

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new Error(
      'At least one ingredient is required to calculate nutrition.',
    );
  }

  const endpoint = new URL('/api/nutrition/calculate', apiUrl);
  const responsePayload = await fetchMenuApi({
    url: endpoint.toString(),
    getToken,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ingredients }),
    },
  });

  return responsePayload?.data || null;
}
