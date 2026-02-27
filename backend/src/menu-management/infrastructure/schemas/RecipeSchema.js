import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema(
  {
    // Unique recipe name, 3–100 characters
    name: {
      type: String,
      required: [true, 'Recipe name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    instructions: {
      type: String,
      required: [true, 'Instructions are required'],
      minlength: [10, 'Instructions must be at least 10 characters'],
    },

    ingredients: [
      {
        name: {
          type: String,
          required: [true, 'Ingredient name is required'],
          trim: true,
        },
        quantity: {
          type: Number,
          required: [true, 'Ingredient quantity is required'],
          min: [0, 'Quantity cannot be negative'],
        },
        unit: {
          type: String,
          required: [true, 'Ingredient unit is required'],
          enum: {
            values: [
              'g',
              'kg',
              'ml',
              'l',
              'cup',
              'tbsp',
              'tsp',
              'piece',
              'oz',
              'lb',
            ],
            message: '{VALUE} is not a valid unit',
          },
        },
        // Defaults to true; non-essential ingredients may be omitted
        isEssential: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Per-serving macros in grams, calories in kcal
    nutritionalInfo: {
      calories: { type: Number, min: 0, default: 0 },
      protein: { type: Number, min: 0, default: 0 },
      carbs: { type: Number, min: 0, default: 0 },
      fats: { type: Number, min: 0, default: 0 },
      fiber: { type: Number, min: 0, default: 0 },
      sugar: { type: Number, min: 0, default: 0 },
    },

    allergens: [
      {
        type: String,
        enum: {
          values: [
            'nuts',
            'peanuts',
            'dairy',
            'eggs',
            'soy',
            'wheat',
            'gluten',
            'shellfish',
            'fish',
            'sesame',
          ],
          message: '{VALUE} is not a valid allergen',
        },
      },
    ],

    servingSize: {
      type: Number,
      required: [true, 'Serving size is required'],
      min: [1, 'Serving size must be at least 1'],
    },

    prepTime: {
      type: Number,
      default: 30,
      min: [1, 'Prep time must be at least 1 minute'],
    },

    seasonal: [
      {
        type: String,
        enum: {
          values: ['spring', 'summer', 'fall', 'winter', 'all-year'],
          message: '{VALUE} is not a valid season',
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
  },
  {
    timestamps: true,
    collection: 'recipes',
  }
);

// Indexes
recipeSchema.index({ name: 1 });
recipeSchema.index({ isActive: 1, createdAt: -1 });
recipeSchema.index({ 'dietaryFlags.vegetarian': 1 });
recipeSchema.index({ 'dietaryFlags.halal': 1 });
recipeSchema.index({ 'dietaryFlags.vegan': 1 });
// Full-text search across recipe and ingredient names
recipeSchema.index({ 'ingredients.name': 'text', name: 'text' });

// Exposes _id as a plain string 'id' for cleaner API responses
recipeSchema.virtual('id').get(function () {
  return this._id.toString();
});

// Includes virtuals and strips _id and __v from JSON output
recipeSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Enforces minimum one ingredient before saving
recipeSchema.pre('save', function (next) {
  if (!this.ingredients || this.ingredients.length === 0) {
    return next(new Error('Recipe must have at least 1 ingredient'));
  }
  next();
});

export default mongoose.model('Recipe', recipeSchema);
