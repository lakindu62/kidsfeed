import { userRepository } from '../../infrastructure/repositories/user.repository.js';
import { clerkClient } from '@clerk/express';

/**
 * UserService
 *
 * Application layer service for User interactions.
 * This service forms the public Application API of the user-management module.
 * Other boundaries (like Menu or Inventory) should import this service
 * rather than coupling directly to Mongoose Models.
 */
class UserService {
  /**
   * List users for admin flows.
   * Supports an optional role filter and returns all users when no role is provided.
   *
   * @param {{ role?: string }} filters
   * @returns {Promise<Array>}
   */
  async listUsers(filters = {}) {
    const { role } = filters;

    if (role) {
      return userRepository.findByRole(role);
    }

    return userRepository.findAll();
  }

  /**
   * Upgrades a lightweight mock session user object into a full database user profile.
   * Cross-domain modules should use this when they need secondary fields like 'email' or 'schoolId'.
   *
   * @param {string|mongoose.Types.ObjectId} userId - The internal MongoDB _id (from req.user._id)
   * @returns {Promise<Object>} The full User MongoDB document
   */
  async getUserProfile(userId) {
    if (!userId) {
      throw new Error('User ID is required to fetch profile');
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found in local system');
    }
    return user;
  }

  /**
   * Domain logic orchestrating a role change.
   * Safely updates BOTH the local persistence (MongoDB) and the external
   * Identity Provider (Clerk) simultaneously to prevent data drift.
   *
   * @param {string} clerkId - The external Clerk user ID
   * @param {string} newRole - The new role to apply (must use ROLES constant)
   * @returns {Promise<Object>} The updated User MongoDB document
   */
  async updateUserRole(clerkId, newRole) {
    if (!clerkId || !newRole) {
      throw new Error(
        'clerkId and newRole are strictly required to update role'
      );
    }

    // 1. Update the local MongoDB role by Clerk identity.
    const updatedUser = await userRepository.updateRoleByClerkId(
      clerkId,
      newRole
    );

    if (!updatedUser) {
      throw new Error('User not found for provided clerkId');
    }

    // 2. Transmit state change to external provider (Clerk JWT Engine).
    // This immediately forces custom sessionClaims to re-generate with the new Role.
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        role: newRole,
        mongoId: updatedUser._id.toString(),
      },
    });

    return updatedUser;
  }

  /**
   * Domain logic orchestrating a role change by internal MongoDB user ID.
   * Safely updates BOTH local role state and Clerk metadata.
   *
   * @param {string} userId - The internal MongoDB user _id
   * @param {string} newRole - The new role to apply
   * @returns {Promise<Object>} The updated User MongoDB document
   */
  async updateUserRoleById(userId, newRole) {
    if (!userId || !newRole) {
      throw new Error(
        'userId and newRole are strictly required to update role'
      );
    }

    // 1. Update the local MongoDB role by internal user ID.
    const updatedUser = await userRepository.updateRoleById(userId, newRole);

    if (!updatedUser) {
      throw new Error('User not found for provided userId');
    }

    // 2. Propagate role and mongoId into Clerk metadata for token claims.
    await clerkClient.users.updateUserMetadata(updatedUser.clerkId, {
      publicMetadata: {
        role: newRole,
        mongoId: updatedUser._id.toString(),
      },
    });

    return updatedUser;
  }
}

export const userService = new UserService();
