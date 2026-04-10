import axios from 'axios';

// Infrastructure service: fetches nutritional data from the USDA FoodData Central API
// and aggregates totals across multiple ingredients
class USDANutritionService {
  constructor() {
    this.baseUrl = 'https://api.nal.usda.gov/fdc/v1';
  }

  // Returns an empty nutrition payload so callers can degrade gracefully.
  getZeroNutrition() {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
      sugar: 0,
    };
  }

  // Builds a small list of progressively simpler queries for USDA search.
  buildQueryCandidates(name) {
    const raw = String(name || '').trim();
    if (!raw) {
      return [];
    }

    const withoutParens = raw.replace(/\([^)]*\)/g, ' ').trim();
    const normalizedSpaces = withoutParens.replace(/\s+/g, ' ').trim();
    const alphaNumericOnly = normalizedSpaces
      .replace(/[^a-zA-Z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const firstSegment = alphaNumericOnly.split(',')[0].trim();
    const firstTwoWords = alphaNumericOnly
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .join(' ')
      .trim();

    return [
      ...new Set([
        raw,
        normalizedSpaces,
        alphaNumericOnly,
        firstSegment,
        firstTwoWords,
      ]),
    ].filter(Boolean);
  }

  // Calculates total nutrition for all ingredients; returns rounded aggregated values
  async calculate(ingredients) {
    const apiKey = process.env.USDA_API_KEY;

    if (!apiKey) {
      throw new Error(
        'USDA_API_KEY is not configured in environment variables'
      );
    }

    if (!ingredients || ingredients.length === 0) {
      throw new Error('At least one ingredient is required');
    }

    try {
      const totalNutrition = this.getZeroNutrition();

      for (const ingredient of ingredients) {
        let nutrition = this.getZeroNutrition();
        try {
          nutrition = await this.getIngredientNutrition(
            ingredient.name,
            ingredient.quantity,
            ingredient.unit,
            apiKey
          );
        } catch (ingredientError) {
          // Keep aggregation alive even if one ingredient lookup fails.
          console.warn(
            `Skipping nutrition lookup for ${ingredient.name}: ${ingredientError.message}`
          );
        }

        totalNutrition.calories += nutrition.calories;
        totalNutrition.protein += nutrition.protein;
        totalNutrition.carbs += nutrition.carbs;
        totalNutrition.fats += nutrition.fats;
        totalNutrition.fiber += nutrition.fiber;
        totalNutrition.sugar += nutrition.sugar;
      }

      return {
        calories: Math.round(totalNutrition.calories),
        protein: Math.round(totalNutrition.protein),
        carbs: Math.round(totalNutrition.carbs),
        fats: Math.round(totalNutrition.fats),
        fiber: Math.round(totalNutrition.fiber),
        sugar: Math.round(totalNutrition.sugar),
      };
    } catch (error) {
      if (error.response) {
        console.error('USDA API error: ', error.response.data);
        const upstreamMessage =
          typeof error.response.data === 'object'
            ? error.response.data?.message
            : null;
        throw new Error(
          `Nutrition API error: ${upstreamMessage || `HTTP ${error.response.status}`}`
        );
      } else if (error.request) {
        throw new Error(
          'Failed to reach USDA Nutrition API - check internet connection'
        );
      } else {
        throw new Error(`Nutrition calculation failed: ${error.message}`);
      }
    }
  }

  // Fetches and scales nutrition for a single ingredient; returns zeros if not found (graceful degradation)
  async getIngredientNutrition(name, quantity, unit, apiKey) {
    const queries = this.buildQueryCandidates(name);

    for (const query of queries) {
      try {
        const searchResponse = await axios.get(`${this.baseUrl}/foods/search`, {
          params: { api_key: apiKey, query, pageSize: 1 },
          timeout: 10000,
        });

        if (
          !searchResponse.data.foods ||
          searchResponse.data.foods.length === 0
        ) {
          continue;
        }

        const food = searchResponse.data.foods[0];
        const nutrientsPer100g = this.extractNutrients(food);
        const conversionFactor = this.convertToGrams(quantity, unit) / 100;

        return {
          calories: nutrientsPer100g.calories * conversionFactor,
          protein: nutrientsPer100g.protein * conversionFactor,
          carbs: nutrientsPer100g.carbs * conversionFactor,
          fats: nutrientsPer100g.fats * conversionFactor,
          fiber: nutrientsPer100g.fiber * conversionFactor,
          sugar: nutrientsPer100g.sugar * conversionFactor,
        };
      } catch (error) {
        const status = error?.response?.status;
        if (status && status >= 400 && status < 500) {
          // Try the next simplified query for client-side USDA lookup issues.
          continue;
        }

        console.error(`Error getting nutrition for ${name}: `, error.message);
        throw error;
      }
    }

    console.warn(`Ingredient not found in USDA database: ${name}`);
    return this.getZeroNutrition();
  }

  // Maps USDA nutrient IDs to our standard nutrition fields (values per 100g)
  extractNutrients(food) {
    const nutrients = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
      sugar: 0,
    };

    if (!food.foodNutrients) {
      return nutrients;
    }

    food.foodNutrients.forEach((nutrient) => {
      switch (nutrient.nutrientId) {
        case 1008:
          nutrients.calories = nutrient.value || 0;
          break; // Energy (kcal)
        case 1003:
          nutrients.protein = nutrient.value || 0;
          break; // Protein
        case 1005:
          nutrients.carbs = nutrient.value || 0;
          break; // Carbohydrates
        case 1004:
          nutrients.fats = nutrient.value || 0;
          break; // Total fat
        case 1079:
          nutrients.fiber = nutrient.value || 0;
          break; // Dietary fiber
        case 2000:
          nutrients.sugar = nutrient.value || 0;
          break; // Total sugars
      }
    });

    return nutrients;
  }

  // Converts common culinary units to grams
  convertToGrams(quantity, unit) {
    const conversions = {
      g: 1,
      kg: 1000,
      mg: 0.001,
      oz: 28.35,
      lb: 453.592,
      cup: 240,
      ml: 1,
      l: 1000,
      tbsp: 15,
      tsp: 5,
      piece: 100,
    };
    return quantity * (conversions[unit.toLowerCase()] || 1);
  }
}

export default USDANutritionService;
