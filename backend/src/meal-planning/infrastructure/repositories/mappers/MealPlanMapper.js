import MealPlan from '../../../domain/entities/MealPlan.js';
import MealEntry from '../../../domain/value-objects/MealEntry.js';

// Maps between MongoDB documents and MealPlan domain entities
class MealPlanMapper {
  // Converts a MongoDB document to a MealPlan domain entity
  static toDomain(mongoDoc) {
    if (!mongoDoc) {
      return null;
    }

    return new MealPlan({
      id: mongoDoc._id.toString(),
      schoolId: mongoDoc.schoolId,
      schoolName: mongoDoc.schoolName,
      weekStartDate: mongoDoc.weekStartDate,
      weekEndDate: mongoDoc.weekEndDate,
      meals: mongoDoc.meals
        ? mongoDoc.meals.map(
            (m) =>
              new MealEntry({
                day: m.day,
                mealType: m.mealType,
                recipeId: m.recipeId.toString(),
                recipeName: m.recipeName,
                plannedServings: m.plannedServings,
                notes: m.notes,
              })
          )
        : [],
      status: mongoDoc.status,
      createdBy: mongoDoc.createdBy,
      inventoryChecked: mongoDoc.inventoryChecked,
      createdAt: mongoDoc.createdAt,
      updatedAt: mongoDoc.updatedAt,
    });
  }

  // Converts a MealPlan domain entity to a MongoDB document
  static toPersistence(mealPlan) {
    const mongoDoc = {
      schoolId: mealPlan.schoolId,
      schoolName: mealPlan.schoolName,
      weekStartDate: mealPlan.weekStartDate,
      weekEndDate: mealPlan.weekEndDate,
      meals: mealPlan.meals.map((m) => ({
        day: m.day,
        mealType: m.mealType,
        recipeId: m.recipeId,
        recipeName: m.recipeName,
        plannedServings: m.plannedServings,
        notes: m.notes,
      })),
      status: mealPlan.status,
      inventoryChecked: mealPlan.inventoryChecked,
      createdBy: mealPlan.createdBy,
    };

    if (mealPlan.id) {
      mongoDoc._id = mealPlan.id;
    }

    return mongoDoc;
  }

  // Maps an array of MongoDB documents to domain entities
  static toDomainList(mongoDocs) {
    return mongoDocs.map((doc) => this.toDomain(doc));
  }
}

export default MealPlanMapper;
