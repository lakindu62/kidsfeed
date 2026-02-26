// Immutable value object for nutritional information (macros in grams, calories in kcal)
class NutritionalInfo {
  /**
   * @param {Object} params
   * @param {number} [params.calories=0]
   * @param {number} [params.protein=0]
   * @param {number} [params.carbs=0]
   * @param {number} [params.fats=0]
   * @param {number} [params.fiber=0]
   * @param {number} [params.sugar=0]
   * @throws {Error} If calories, protein, carbs, or fats are negative
   */
  constructor({
    calories = 0,
    protein = 0,
    carbs = 0,
    fats = 0,
    fiber = 0,
    sugar = 0,
  }) {
    if (calories < 0 || protein < 0 || carbs < 0 || fats < 0) {
      throw new Error('Nutritional values cannot be negative');
    }

    this.calories = calories;
    this.protein = protein;
    this.carbs = carbs;
    this.fats = fats;
    this.fiber = fiber;
    this.sugar = sugar;

    Object.freeze(this);
  }

  // Returns sum of protein, carbs, and fats in grams
  /** @returns {number} */
  getTotalMacros() {
    return this.protein + this.carbs + this.fats;
  }

  // Calculates kcal from protein (1g = 4 kcal)
  /** @returns {number} */
  getCaloriesFromProtein() {
    return this.protein * 4;
  }

  // Calculates kcal from carbs (1g = 4 kcal)
  /** @returns {number} */
  getCaloriesFromCarbs() {
    return this.carbs * 4;
  }

  // Calculates kcal from fats (1g = 9 kcal)
  /** @returns {number} */
  getCaloriesFromFats() {
    return this.fats * 9;
  }

  // Returns true if protein exceeds 20g
  /** @returns {boolean} */
  isHighProtein() {
    return this.protein > 20;
  }

  // Checks value equality across all nutritional fields
  /**
   * @param {NutritionalInfo|null} other
   * @returns {boolean}
   */
  equals(other) {
    if (!other) {
      return false;
    }

    return (
      this.calories === other.calories &&
      this.protein === other.protein &&
      this.carbs === other.carbs &&
      this.fats === other.fats &&
      this.fiber === other.fiber &&
      this.sugar === other.sugar
    );
  }

  /** @returns {Object} */
  toJSON() {
    return {
      calories: this.calories,
      protein: this.protein,
      carbs: this.carbs,
      fats: this.fats,
      fiber: this.fiber,
      sugar: this.sugar,
    };
  }
}

export default NutritionalInfo;
