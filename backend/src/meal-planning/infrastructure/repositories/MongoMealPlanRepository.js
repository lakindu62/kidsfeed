import IMealPlanRepository from '../../domain/repositories/IMealPlanRepository.js';
import MealPlanSchema from '../schemas/MealPlanSchema.js';
import MealPlanMapper from './mappers/MealPlanMapper.js';

// MongoDB implementation of IMealPlanRepository
class MongoMealPlanRepository extends IMealPlanRepository {
  async save(mealPlan) {
    try {
      const persistenceData = MealPlanMapper.toPersistence(mealPlan);
      const savedDoc = await MealPlanSchema.create(persistenceData);
      return MealPlanMapper.toDomain(savedDoc);
    } catch (error) {
      throw new Error(`Failed to save meal plan: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const doc = await MealPlanSchema.findById(id);
      return MealPlanMapper.toDomain(doc);
    } catch (error) {
      if (error.name === 'CastError') {
        return null;
      }
      throw new Error(`Failed to find meal plan: ${error.message}`);
    }
  }

  async findBySchoolId(schoolId, filters = {}) {
    try {
      const query = { schoolId };

      if (filters.status) {
        query.status = filters.status;
      }

      const docs = await MealPlanSchema.find(query).sort({ weekStartDate: -1 });

      return MealPlanMapper.toDomainList(docs);
    } catch (error) {
      throw new Error(`Failed to find meal plans: ${error.message}`);
    }
  }

  async findByDateRange(schoolId, startDate, endDate) {
    try {
      const docs = await MealPlanSchema.find({
        schoolId,
        weekStartDate: { $gte: startDate },
        weekEndDate: { $lte: endDate },
      });

      return MealPlanMapper.toDomainList(docs);
    } catch (error) {
      throw new Error(
        `Failed to find meal plans in date range: ${error.message}`
      );
    }
  }

  async update(id, mealPlan) {
    try {
      const persistenceData = MealPlanMapper.toPersistence(mealPlan);

      const updatedDoc = await MealPlanSchema.findByIdAndUpdate(
        id,
        persistenceData,
        { new: true, runValidators: true }
      );

      if (!updatedDoc) {
        return null;
      }
      return MealPlanMapper.toDomain(updatedDoc);
    } catch (error) {
      if (error.name === 'CastError') {
        return null;
      }
      throw new Error(`Failed to update meal plan: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const deletedDoc = await MealPlanSchema.findByIdAndDelete(id);
      if (!deletedDoc) {
        return null;
      }
      return MealPlanMapper.toDomain(deletedDoc);
    } catch (error) {
      if (error.name === 'CastError') {
        return null;
      }
      throw new Error(`Failed to delete meal plan: ${error.message}`);
    }
  }

  // Returns the active meal plan overlapping today's date
  async findCurrentWeek(schoolId) {
    try {
      const now = new Date();

      const doc = await MealPlanSchema.findOne({
        schoolId,
        weekStartDate: { $lte: now },
        weekEndDate: { $gte: now },
      });

      return MealPlanMapper.toDomain(doc);
    } catch (error) {
      throw new Error(`Failed to find current week: ${error.message}`);
    }
  }
}

export default MongoMealPlanRepository;
