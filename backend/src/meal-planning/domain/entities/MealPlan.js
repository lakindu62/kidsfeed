// meal-planning/domain/entities/MealPlan.js

import MealEntry from '../value-objects/MealEntry.js';

// Represents a weekly meal plan for a specific school
class MealPlan {
  constructor({
    id,
    schoolId,
    schoolName,
    weekStartDate,
    weekEndDate,
    meals,
    status,
    createdBy,
    inventoryChecked,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.schoolId = schoolId;
    this.schoolName = schoolName || '';
    this.weekStartDate = new Date(weekStartDate);
    this.weekEndDate = new Date(weekEndDate);
    this.meals = meals
      ? meals.map((m) => (m instanceof MealEntry ? m : new MealEntry(m)))
      : [];
    this.status = status || 'planned';
    this.createdBy = createdBy;
    this.inventoryChecked = inventoryChecked || false;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  // Validates required fields and business rules
  validate() {
    if (!this.schoolId) {
      throw new Error('School ID is required');
    }
    if (!this.weekStartDate || !this.weekEndDate) {
      throw new Error('Week start and end dates are required');
    }
    if (this.weekEndDate <= this.weekStartDate) {
      throw new Error('Week end date must be after start date');
    }
    if (!this.meals || this.meals.length === 0) {
      throw new Error('Meal plan must have at least one meal');
    }
    return true;
  }

  // Adds a MealEntry, rejecting duplicates for the same day and type
  addMeal(mealEntry) {
    if (!(mealEntry instanceof MealEntry)) {
      throw new Error('Must provide a valid MealEntry');
    }
    const duplicate = this.meals.find(
      (m) => m.day === mealEntry.day && m.mealType === mealEntry.mealType
    );
    if (duplicate) {
      throw new Error(
        `Meal already exists for ${mealEntry.getMealIdentifier()}`
      );
    }
    this.meals.push(mealEntry);
    this.updatedAt = new Date();
  }

  // Removes a meal matching the given day and type
  removeMeal(day, mealType) {
    const index = this.meals.findIndex(
      (m) => m.day === day && m.mealType === mealType
    );
    if (index === -1) {
      throw new Error(`Meal not found for ${day} ${mealType}`);
    }
    this.meals.splice(index, 1);
    this.updatedAt = new Date();
  }

  // Returns all meals scheduled for a given day
  getMealsForDay(day) {
    return this.meals.filter((m) => m.isForDay(day));
  }

  // Sums planned servings across all meals for the week
  getTotalPlannedServings() {
    return this.meals.reduce((total, meal) => total + meal.plannedServings, 0);
  }

  // Checks whether today falls within the plan's week range
  isCurrentWeek() {
    const now = new Date();
    return now >= this.weekStartDate && now <= this.weekEndDate;
  }

  // Transitions status from 'planned' to 'confirmed'
  confirm() {
    if (this.status !== 'planned') {
      throw new Error('Can only confirm meal plans with status "planned"');
    }
    this.status = 'confirmed';
    this.updatedAt = new Date();
  }

  // Transitions status from 'confirmed' to 'served'
  markAsServed() {
    if (this.status !== 'confirmed') {
      throw new Error('Can only mark confirmed meal plans as served');
    }
    this.status = 'served';
    this.updatedAt = new Date();
  }

  // Flags the plan's inventory as checked
  markInventoryChecked() {
    this.inventoryChecked = true;
    this.updatedAt = new Date();
  }
}

export default MealPlan;
