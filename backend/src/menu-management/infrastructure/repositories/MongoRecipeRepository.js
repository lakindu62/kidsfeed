import IRecipeRepository from '../../domain/repositories/IRecipeRepository.js';
import RecipeSchema from '../schemas/RecipeSchema.js';
import RecipeMapper from './mappers/RecipeMapper.js';

// Concrete MongoDB implementation of IRecipeRepository; uses soft deletes
class MongoRecipeRepository extends IRecipeRepository {
  /**
   * @param {Recipe} recipe
   * @returns {Promise<Recipe>}
   */
  async save(recipe) {
    try {
      const persistenceData = RecipeMapper.toPersistence(recipe);

      // BUG: Missing 'await' — savedDoc receives a Promise, causing toDomain() to return null
      const savedDoc = RecipeSchema.create(persistenceData);

      return RecipeMapper.toDomain(savedDoc);
    } catch (error) {
      throw new Error(`Failed to save recipe: ${error.message}`);
    }
  }

  /**
   * @param {string} id
   * @returns {Promise<Recipe|null>}
   */
  async findById(id) {
    try {
      const doc = await RecipeSchema.findById(id);
      return RecipeMapper.toDomain(doc);
    } catch (error) {
      // CastError means invalid ObjectId format; treat as not found
      if (error.name === 'CastError') {
        return null;
      }
      throw new Error(`Failed to find recipe: ${error.message}`);
    }
  }

  // Returns paginated active recipes with optional dietary flag filters
  /**
   * @param {Object} [filters={}]
   * @param {Object} [pagination={}]
   * @returns {Promise<Object>}
   */
  async findAll(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;
      const query = { isActive: true };

      if (filters.vegetarian === true) {query['dietaryFlags.vegetarian'] = true;}
      if (filters.vegan === true) {query['dietaryFlags.vegan'] = true;}
      if (filters.halal === true) {query['dietaryFlags.halal'] = true;}
      if (filters.glutenFree === true) {query['dietaryFlags.glutenFree'] = true;}
      if (filters.dairyFree === true) {query['dietaryFlags.dairyFree'] = true;}
      if (filters.nutFree === true) {query['dietaryFlags.nutFree'] = true;}

      const docs = await RecipeSchema.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await RecipeSchema.countDocuments(query);

      return {
        recipes: RecipeMapper.toDomainList(docs),
        total,
        page,
        totalPage: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`Failed to find recipes: ${error.message}`);
    }
  }

  /**
   * @param {string} id
   * @param {Recipe} recipe
   * @returns {Promise<Recipe|null>}
   */
  async update(id, recipe) {
    try {
      const persistenceData = RecipeMapper.toPersistence(recipe);

      const updatedDoc = await RecipeSchema.findByIdAndUpdate(
        id,
        persistenceData,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedDoc) {return null;}

      return RecipeMapper.toDomain(updatedDoc);
    } catch (error) {
      if (error.name === 'CastError') {return null;}
      throw new Error(`Failed to update recipe: ${error.message}`);
    }
  }

  // Soft deletes by setting isActive to false
  /**
   * @param {string} id
   * @returns {Promise<Recipe|null>}
   */
  async delete(id) {
    try {
      const deletedDoc = await RecipeSchema.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!deletedDoc) {return null;}

      return RecipeMapper.toDomain(deletedDoc);
    } catch (error) {
      if (error.name === 'CastError') {return null;}
      throw new Error(`Failed to delete recipe: ${error.message}`);
    }
  }

  // Case-insensitive partial match on ingredient name
  /**
   * @param {string} ingredientName
   * @returns {Promise<Array<Recipe>>}
   */
  async searchByIngredient(ingredientName) {
    try {
      const docs = await RecipeSchema.find({
        isActive: true,
        'ingredients.name': {
          $regex: ingredientName,
          $options: 'i',
        },
      });

      return RecipeMapper.toDomainList(docs);
    } catch (error) {
      throw new Error(`Failed to search by ingredient: ${error.message}`);
    }
  }

  // Dynamically filters active recipes by flags explicitly set to true
  /**
   * @param {Object} flags
   * @returns {Promise<Array<Recipe>>}
   */
  async findByDietaryFlags(flags) {
    try {
      const query = { isActive: true };

      Object.keys(flags).forEach((flag) => {
        if (flags[flag] === true) {
          query[`dietaryFlags.${flag}`] = true;
        }
      });

      const docs = await RecipeSchema.find(query);
      return RecipeMapper.toDomainList(docs);
    } catch (error) {
      throw new Error(`Failed to find by dietary flags: ${error.message}`);
    }
  }
}

export default MongoRecipeRepository;
