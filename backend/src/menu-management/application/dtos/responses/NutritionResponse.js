// DTO: transforms a NutritionalInfo value object into a plain, serializable response
// Includes pre-calculated derived values (calorie breakdown, total macros, high-protein flag)
class NutritionResponse {
  /**
   * @param {NutritionalInfo} nutritionalInfo
   */
  constructor(nutritionalInfo) {
    this.calories = nutritionalInfo.calories;
    this.protein = nutritionalInfo.protein;
    this.carbs = nutritionalInfo.carbs;
    this.fats = nutritionalInfo.fats;
    this.fiber = nutritionalInfo.fiber;
    this.sugar = nutritionalInfo.sugar;

    // Pre-calculated derived metrics
    this.totalMacros = nutritionalInfo.getTotalMacros();
    this.caloriesFromProtein = nutritionalInfo.getCaloriesFromProtein();
    this.caloriesFromCarbs = nutritionalInfo.getCaloriesFromCarbs();
    this.caloriesFromFats = nutritionalInfo.getCaloriesFromFats();
    this.isHighProtein = nutritionalInfo.isHighProtein();
  }
}

export default NutritionResponse;
