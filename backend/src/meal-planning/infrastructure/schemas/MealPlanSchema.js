// meal-planning/infrastructure/schemas/MealPlanSchema.js

import mongoose from 'mongoose';

// MongoDB schema for meal plans
const mealPlanSchema = new mongoose.Schema(
  {
    schoolId: {
      type: String,
      required: [true, 'School ID is required'],
      index: true,
    },

    schoolName: {
      type: String,
      trim: true,
    },

    weekStartDate: {
      type: Date,
      required: [true, 'Week start date is required'],
    },

    weekEndDate: {
      type: Date,
      required: [true, 'Week end date is required'],
      validate: {
        validator: function (value) {
          return value > this.weekStartDate;
        },
        message: 'Week end date must be after start date',
      },
    },

    meals: [
      {
        day: {
          type: String,
          required: [true, 'Day is required'],
          enum: {
            values: [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday',
            ],
            message: '{VALUE} is not a valid day',
          },
        },
        mealType: {
          type: String,
          required: [true, 'Meal type is required'],
          enum: {
            values: ['breakfast', 'lunch', 'dinner', 'snack'],
            message: '{VALUE} is not a valid meal type',
          },
        },
        recipeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Recipe',
          required: [true, 'Recipe ID is required'],
        },
        recipeName: {
          type: String,
          trim: true,
        },
        plannedServings: {
          type: Number,
          required: [true, 'Planned servings is required'],
          min: [1, 'Planned servings must be at least 1'],
        },
        notes: {
          type: String,
          maxlength: [200, 'Notes cannot exceed 200 characters'],
        },
      },
    ],

    status: {
      type: String,
      enum: {
        values: ['draft', 'planned', 'confirmed', 'served'],
        message: '{VALUE} is not a valid status',
      },
      default: 'planned',
      index: true,
    },

    inventoryChecked: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: String,
      required: [true, 'Created by is required'],
      trim: true,
      set: (value) => (value === null ? value : String(value).trim()),
    },
  },
  {
    timestamps: true,
    collection: 'mealplans',
  }
);

mealPlanSchema.index({ schoolId: 1, weekStartDate: 1 });
mealPlanSchema.index({ schoolId: 1, status: 1 });
mealPlanSchema.index({ weekStartDate: 1, weekEndDate: 1 });

// Returns string representation of document ID
mealPlanSchema.virtual('id').get(function () {
  return this._id.toString();
});

// Sums planned servings across all meals
mealPlanSchema.virtual('totalPlannedServings').get(function () {
  return this.meals.reduce((total, meal) => total + meal.plannedServings, 0);
});

mealPlanSchema.set('toJSON', { virtuals: true });

// Rejects save if no meals are present
mealPlanSchema.pre('save', function (next) {
  if (this.meals.length === 0) {
    next(new Error('Meal plan must have at least one meal'));
  } else {
    next();
  }
});

export default mongoose.model('MealPlan', mealPlanSchema);
