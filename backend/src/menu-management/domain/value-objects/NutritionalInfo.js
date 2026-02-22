/**
 * NutritionalInfo Value Object
 *
 * Represents the nutritional information for a food item or recipe.
 * This is an immutable value object that encapsulates macronutrients and
 * micronutrients, providing methods for nutritional calculations and analysis.
 *
 * All nutritional values are measured in grams (g) except calories which are
 * measured in kilocalories (kcal).
 *
 * The object is frozen after construction to ensure immutability, following
 * the value object pattern in domain-driven design.
 *
 * @class NutritionalInfo
 */
class NutritionalInfo {
  /**
   * Creates a new immutable NutritionalInfo instance
   *
   * @constructor
   * @param {Object} params - Nutritional information configuration object
   * @param {number} [params.calories=0] - Total calories in kilocalories (kcal)
   * @param {number} [params.protein=0] - Protein content in grams (g)
   * @param {number} [params.carbs=0] - Carbohydrate content in grams (g)
   * @param {number} [params.fats=0] - Fat content in grams (g)
   * @param {number} [params.fiber=0] - Dietary fiber content in grams (g)
   * @param {number} [params.sugar=0] - Sugar content in grams (g)
   * @throws {Error} If any of the primary nutritional values (calories, protein, carbs, fats) are negative
   */
  constructor({
    calories = 0,
    protein = 0,
    carbs = 0,
    fats = 0,
    fiber = 0,
    sugar = 0,
  }) {
    // Validate that core nutritional values are non-negative
    if (calories < 0 || protein < 0 || carbs < 0 || fats < 0) {
      throw new Error('Nutritional values cannot be negative');
    }

    this.calories = calories;
    this.protein = protein;
    this.carbs = carbs;
    this.fats = fats;
    this.fiber = fiber;
    this.sugar = sugar;

    // Freeze the object to make it immutable (value object pattern)
    Object.freeze(this);
  }

  /**
   * Calculates the total macronutrients (protein + carbs + fats)
   *
   * @returns {number} Total macronutrients in grams
   *
   * @example
   * const nutrition = new NutritionalInfo({ protein: 10, carbs: 30, fats: 5 });
   * nutrition.getTotalMacros(); // returns 45
   */
  getTotalMacros() {
    return this.protein + this.carbs + this.fats;
  }

  /**
   * Calculates calories derived from protein
   * Uses the standard conversion: 1g protein = 4 kcal
   *
   * @returns {number} Calories from protein in kilocalories (kcal)
   *
   * @example
   * const nutrition = new NutritionalInfo({ protein: 10 });
   * nutrition.getCaloriesFromProtein(); // returns 40
   */
  getCaloriesFromProtein() {
    return this.protein * 4;
  }

  /**
   * Calculates calories derived from carbohydrates
   * Uses the standard conversion: 1g carbs = 4 kcal
   *
   * @returns {number} Calories from carbohydrates in kilocalories (kcal)
   *
   * @example
   * const nutrition = new NutritionalInfo({ carbs: 25 });
   * nutrition.getCaloriesFromCarbs(); // returns 100
   */
  getCaloriesFromCarbs() {
    return this.carbs * 4;
  }

  /**
   * Calculates calories derived from fats
   * Uses the standard conversion: 1g fat = 9 kcal
   *
   * @returns {number} Calories from fats in kilocalories (kcal)
   *
   * @example
   * const nutrition = new NutritionalInfo({ fats: 10 });
   * nutrition.getCaloriesFromFats(); // returns 90
   */
  getCaloriesFromFats() {
    return this.fats * 9;
  }

  /**
   * Determines if the food item is considered high in protein
   * A food is classified as high protein if it contains more than 20g of protein
   *
   * @returns {boolean} True if protein content exceeds 20g, false otherwise
   *
   * @example
   * const nutrition = new NutritionalInfo({ protein: 25 });
   * nutrition.isHighProtein(); // returns true
   */
  isHighProtein() {
    return this.protein > 20;
  }

  /**
   * Checks equality with another NutritionalInfo instance
   * Two NutritionalInfo objects are considered equal if all their nutritional
   * values match exactly
   *
   * @param {NutritionalInfo|null} other - The NutritionalInfo object to compare with
   * @returns {boolean} True if all nutritional values are equal, false otherwise
   *
   * @example
   * const info1 = new NutritionalInfo({ calories: 100, protein: 10 });
   * const info2 = new NutritionalInfo({ calories: 100, protein: 10 });
   * info1.equals(info2); // returns true
   */
  equals(other) {
    // Return false if other is null, undefined, or not provided
    if (!other) {
      return false;
    }

    // Compare all nutritional values for exact equality
    return (
      this.calories === other.calories &&
      this.protein === other.protein &&
      this.carbs === other.carbs &&
      this.fats === other.fats &&
      this.fiber === other.fiber &&
      this.sugar === other.sugar
    );
  }

  /**
   * Converts the NutritionalInfo object to a plain JSON object
   *
   * Useful for serialization, API responses, and database storage.
   *
   * @returns {Object} Plain object representation of nutritional information
   * @property {number} callories - Total calories (NOTE: typo in property name)
   * @property {number} protein - Protein in grams
   * @property {number} carbs - Carbohydrates in grams
   * @property {number} fats - Fats in grams
   * @property {number} fiber - Fiber in grams
   * @property {number} sugar - Sugar in grams
   *
   * @todo Fix typo: 'callories' should be 'calories'
   *
   * @example
   * const nutrition = new NutritionalInfo({ calories: 200, protein: 15 });
   * const json = nutrition.toJSON();
   * // { callories: 200, protein: 15, carbs: 0, ... }
   */
  toJSON() {
    return {
      callories: this.calories, // TODO: Fix typo - should be 'calories'
      protein: this.protein,
      carbs: this.carbs,
      fats: this.fats,
      fiber: this.fiber,
      sugar: this.sugar,
    };
  }
}

export default NutritionalInfo;
