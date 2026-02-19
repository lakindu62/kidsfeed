/**
 * RecipeSchema
 *
 * Mongoose schema definition for the Recipe model used in the meal planning
 * and menu management module. This schema defines the structure, validation
 * rules, and database behavior for recipe documents stored in MongoDB.
 *
 * Implements:
 * - Field-level validation with custom error messages
 * - Compound and single-field indexes for query optimization
 * - A virtual 'id' field for cleaner API responses
 * - JSON serialization transformation to remove internal MongoDB fields
 * - A pre-save hook to enforce domain-level business rules
 *
 * @module meal-planning/infrastructure/schemas/RecipeSchema
 * @requires mongoose
 */
const mongoose = require('mongoose');

/**
 * Mongoose schema for the Recipe document
 *
 * Defines the structure and constraints for recipe data persisted in MongoDB.
 * Each field includes type enforcement, validation rules, and custom error messages
 * to ensure data integrity at the database layer.
 *
 * @type {mongoose.Schema}
 */
const recipeSchema = new mongoose.Schema(
  {
    /**
     * The display name of the recipe
     * Must be unique and between 3–100 characters
     */
    name: {
      type: String,
      required: [true, 'Recipe name is required'],
      trim: true, // Removes leading and trailing whitespace
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    /**
     * A short summary or overview of the recipe
     * Optional, capped at 500 characters
     */
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    /**
     * Step-by-step cooking instructions for the recipe
     * Must be at least 10 characters to ensure meaningful content
     */
    instructions: {
      type: String,
      required: [true, 'Instructions are required'],
      minlength: [10, 'Instructions must be at least 10 characters'],
    },

    /**
     * List of ingredients required for the recipe
     * At least one ingredient is required (enforced in pre-save hook)
     * Each ingredient contains name, quantity, unit, and an essentiality flag
     */
    ingredients: [
      {
        /** Display name of the ingredient (e.g., 'Chicken Breast') */
        name: {
          type: String,
          required: [true, 'Ingredient name is required'],
          trim: true,
        },

        /** Amount of the ingredient needed (must be a non-negative number) */
        quantity: {
          type: Number,
          required: [true, 'Ingredient quantity is required'],
          min: [0, 'Quantity cannot be negative'],
        },

        /**
         * Unit of measurement for the ingredient quantity
         * Restricted to a predefined set of accepted culinary units
         */
        unit: {
          type: String,
          required: [true, 'Ingredient unit is required'],
          enum: {
            values: [
              'g', // grams
              'kg', // kilograms
              'ml', // millilitres
              'l', // litres
              'cup', // cup measurement
              'tbsp', // tablespoon
              'tsp', // teaspoon
              'piece', // individual unit
              'oz', // ounce
              'lb', // pound
            ],
            message: '{VALUE} is not a valid unit',
          },
        },

        /**
         * Indicates whether the ingredient is essential to the recipe
         * Non-essential ingredients can be omitted without affecting the core dish
         * Defaults to true (essential)
         */
        isEssential: {
          type: Boolean,
          default: true,
        },
      },
    ],

    /**
     * Nutritional breakdown of the recipe per serving
     * All values are in grams (g) except calories which are in kilocalories (kcal)
     * All fields default to 0 and cannot be negative
     */
    nutritionalInfo: {
      calories: { type: Number, min: 0, default: 0 }, // Total energy in kcal
      protein: { type: Number, min: 0, default: 0 }, // Protein content in grams
      carbs: { type: Number, min: 0, default: 0 }, // Carbohydrate content in grams
      fats: { type: Number, min: 0, default: 0 }, // Fat content in grams
      fiber: { type: Number, min: 0, default: 0 }, // Dietary fiber in grams
      sugar: { type: Number, min: 0, default: 0 }, // Sugar content in grams
    },

    /**
     * List of allergens present in the recipe
     * Restricted to recognized allergens for child safety compliance
     * Used to filter out unsafe recipes for children with known allergies
     */
    allergens: [
      {
        type: String,
        enum: {
          values: [
            'nuts', // Tree nuts (e.g., almonds, walnuts)
            'peanuts', // Peanuts (a legume, not a tree nut)
            'dairy', // Milk and dairy products
            'eggs', // Eggs and egg-derived products
            'soy', // Soybeans and soy-derived products
            'wheat', // Wheat and wheat flour
            'gluten', // Gluten (found in wheat, barley, rye)
            'shellfish', // Crustaceans and mollusks
            'fish', // Fish and fish products
            'sesame', // Sesame seeds and sesame oil
          ],
          message: '{VALUE} is not a valid allergen',
        },
      },
    ],

    /**
     * Number of servings this recipe yields
     * Must be at least 1 to ensure a valid yield
     */
    servingSize: {
      type: Number,
      required: [true, 'Serving size is required'],
      min: [1, 'Serving size must be at least 1'],
    },

    /**
     * Estimated preparation and cooking time in minutes
     * Defaults to 30 minutes if not specified
     */
    prepTime: {
      type: Number,
      default: 30,
      min: [1, 'Prep time must be at least 1 minute'],
    },

    /**
     * The season during which the recipe is most appropriate or available
     * 'all-year' indicates the recipe is suitable for any time of the year
     */
    seasonal: {
      type: String,
      enum: {
        values: ['spring', 'summer', 'fall', 'winter', 'all-year'],
        message: '{VALUE} is not a valid season',
      },
    },

    /**
     * Flag indicating whether the recipe is currently active
     * Inactive recipes are excluded from meal planning and menu listings
     * Defaults to true (active)
     */
    isActive: {
      type: Boolean,
      default: true,
    },

    /**
     * Reference to the User who created the recipe
     * Links to the 'User' collection via ObjectId for audit trail purposes
     */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
  },

  {
    /**
     * Schema options:
     * - timestamps: Automatically adds and manages 'createdAt' and 'updatedAt' fields
     * - collection: Explicitly sets the MongoDB collection name to 'recipes'
     */
    timestamps: true,
    collection: 'recipes',
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

/** Single-field index on 'name' to speed up name-based lookups and sorting */
recipeSchema.index({ name: 1 });

/** Compound index on 'isActive' and 'createdAt' for efficient active recipe queries sorted by newest first */
recipeSchema.index({ isActive: 1, createdAt: -1 });

/** Index on vegetarian dietary flag to optimize vegetarian recipe filtering */
recipeSchema.index({ 'dietaryFlags.vegetarian': 1 });

/** Index on halal dietary flag to optimize halal recipe filtering */
recipeSchema.index({ 'dietaryFlags.halal': 1 });

/** Index on vegan dietary flag to optimize vegan recipe filtering */
recipeSchema.index({ 'dietaryFlags.vegan': 1 });

/**
 * Full-text search index on ingredient names and recipe names
 * Enables efficient free-text search across recipes and ingredients
 * using MongoDB's $text search operator
 */
recipeSchema.index({ 'ingredients.name': 'text', name: 'text' });

// ---------------------------------------------------------------------------
// Virtuals
// ---------------------------------------------------------------------------

/**
 * Virtual 'id' field
 *
 * Exposes the MongoDB '_id' ObjectId as a plain string 'id' property.
 * This provides a cleaner, framework-agnostic identifier for API responses
 * without exposing MongoDB's internal '_id' format directly.
 *
 * @returns {string} String representation of the document's MongoDB ObjectId
 */
recipeSchema.virtual('id').get(function () {
  return this._id.toString();
});

// ---------------------------------------------------------------------------
// JSON Serialization
// ---------------------------------------------------------------------------

/**
 * JSON transformation configuration
 *
 * Customizes the output when the document is serialized to JSON (e.g., in API responses).
 * - virtuals: true  → Includes virtual fields (e.g., 'id') in JSON output
 * - transform       → Removes internal MongoDB fields ('_id' and '__v') for cleaner responses
 *
 * @param {Object} doc - The original Mongoose document
 * @param {Object} ret - The plain object representation to be returned
 * @returns {Object} The cleaned JSON object without '_id' and '__v' fields
 */
recipeSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id; // Remove MongoDB internal ObjectId (replaced by virtual 'id')
    delete ret.__v; // Remove Mongoose version key used for optimistic concurrency
    return ret;
  },
});

// ---------------------------------------------------------------------------
// Middleware (Hooks)
// ---------------------------------------------------------------------------

/**
 * Pre-save middleware hook
 *
 * Runs automatically before every document save operation.
 * Enforces the business rule that every recipe must have at least one ingredient.
 * This acts as a secondary validation layer in addition to schema-level validation,
 * ensuring domain integrity at the persistence layer.
 *
 * @param {Function} next - Mongoose middleware callback to proceed to the next hook or save operation
 * @returns {void}
 */
recipeSchema.pre('save', function (next) {
  // Reject the save operation if no ingredients have been provided
  if (!this.ingredients || this.ingredients.length === 0) {
    return next(new Error('Recipe must have at least 1 ingredient'));
  }

  // All checks passed - proceed with the save operation
  next();
});

/**
 * Recipe Mongoose Model
 *
 * Compiled model from the recipeSchema, bound to the 'recipes' collection.
 * Used throughout the application to perform CRUD operations on recipe documents.
 *
 * @type {mongoose.Model}
 */
module.exports = mongoose.model('Recipe', recipeSchema);
