import { UserModel } from '../schemas/user.schema.js';

/**
 * UserRepository
 *
 * Provides a clean abstraction over the Mongoose UserModel.
 * Other services and modules should use this repository to interact with
 * user data instead of coupling directly to the Mongoose schema.
 */
class UserRepository {
  /**
   * Find a user by their internal MongoDB ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return UserModel.findById(id);
  }

  /**
   * Find a user by their external Clerk ID.
   * @param {string} clerkId
   * @returns {Promise<Object|null>}
   */
  async findByClerkId(clerkId) {
    return UserModel.findOne({ clerkId });
  }

  /**
   * Create a new user with standard properties.
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async create(userData) {
    return UserModel.create(userData);
  }

  /**
   * Upsert a user based on their external Clerk ID.
   * Follows our webhook architecture where local data is strictly
   * synchronized against the Clerk source of truth.
   *
   * @param {string} clerkId
   * @param {Object} updateData
   * @param {Object} setOnInsertData
   * @returns {Promise<Object>}
   */
  async upsertByClerkId(clerkId, updateData, setOnInsertData) {
    return UserModel.findOneAndUpdate(
      { clerkId },
      {
        $setOnInsert: setOnInsertData,
        $set: updateData,
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Upsert only profile fields by Clerk ID.
   * This helper exists to make intent explicit for webhook user.updated sync,
   * where role must never be overwritten for existing users.
   *
   * @param {string} clerkId
   * @param {Object} profileData
   * @param {Object} setOnInsertData
   * @returns {Promise<Object>}
   */
  async upsertProfileByClerkId(clerkId, profileData, setOnInsertData = {}) {
    return UserModel.findOneAndUpdate(
      { clerkId },
      {
        $setOnInsert: setOnInsertData,
        $set: profileData,
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Delete a user by their external Clerk ID.
   * @param {string} clerkId
   * @returns {Promise<Object|null>}
   */
  async deleteByClerkId(clerkId) {
    return UserModel.findOneAndDelete({ clerkId });
  }

  /**
   * Find all users with optional filtering.
   * @param {Object} filter
   * @returns {Promise<Array>}
   */
  async findAll(filter = {}) {
    return UserModel.find(filter).sort({ createdAt: -1 });
  }

  /**
   * Find all users matching a specific role.
   * @param {string} role
   * @returns {Promise<Array>}
   */
  async findByRole(role) {
    return UserModel.find({ role }).sort({ name: 1 });
  }
}

export const userRepository = new UserRepository();
