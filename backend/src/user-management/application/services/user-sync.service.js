import { clerkClient } from '@clerk/express';
import { userRepository } from '../../infrastructure/repositories/user.repository.js';
import { ROLES } from '../../../shared/constants/roles.js';

/**
 * UserSyncService
 *
 * Application layer service coordinating identity synchronization between
 * the external Clerk identity provider and the local MongoDB database.
 * Follows DDD principles by isolating domain logic from webhook transport logic.
 */
class UserSyncService {
  /**
   * Extract normalized identity fields from Clerk payload.
   * @param {Object} clerkUserData
   * @returns {{ clerkId: string, email: string, name: string }}
   */
  extractIdentity(clerkUserData) {
    const {
      id: clerkId,
      email_addresses,
      first_name,
      last_name,
    } = clerkUserData;

    const email = email_addresses?.[0]?.email_address ?? '';
    const name = `${first_name ?? ''} ${last_name ?? ''}`.trim();

    return { clerkId, email, name };
  }

  /**
   * Handles user.created webhook events.
   * Ensures first-time users get default role assignment via $setOnInsert,
   * then syncs token-critical metadata back to Clerk.
   *
   * @param {Object} clerkUserData - The user data payload received from a Clerk webhook event.
   * @returns {Promise<Object>} The synchronized MongoDB user document.
   */
  async syncOnUserCreated(clerkUserData) {
    const { clerkId, email, name } = this.extractIdentity(clerkUserData);

    const syncedUser = await userRepository.upsertByClerkId(
      clerkId,
      { email, name },
      { role: ROLES.STAFF, schoolId: null }
    );

    const desiredMongoId = syncedUser._id.toString();
    const desiredRole = syncedUser.role;
    const existingMongoId = clerkUserData?.public_metadata?.mongoId;
    const existingRole = clerkUserData?.public_metadata?.role;

    if (existingMongoId !== desiredMongoId || existingRole !== desiredRole) {
      await clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: {
          mongoId: desiredMongoId,
          role: desiredRole,
        },
      });
    }

    return syncedUser;
  }

  /**
   * Handles user.updated webhook events.
   * Syncs profile fields locally and updates linkage metadata only.
   * Role is intentionally NOT written here to avoid accidental role resets.
   *
   * @param {Object} clerkUserData - The user data payload received from a Clerk webhook event.
   * @returns {Promise<Object>} The synchronized MongoDB user document.
   */
  async syncOnUserUpdated(clerkUserData) {
    const { clerkId, email, name } = this.extractIdentity(clerkUserData);

    const syncedUser = await userRepository.upsertProfileByClerkId(
      clerkId,
      { email, name },
      { role: ROLES.STAFF, schoolId: null }
    );

    const desiredMongoId = syncedUser._id.toString();
    const existingMongoId = clerkUserData?.public_metadata?.mongoId;

    if (existingMongoId !== desiredMongoId) {
      await clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: {
          mongoId: desiredMongoId,
        },
      });
    }

    return syncedUser;
  }

  /**
   * Backward-compatible bridge for older call sites.
   * This default behavior follows the safe user.updated path.
   *
   * @param {Object} clerkUserData
   * @returns {Promise<Object>}
   */
  async syncClerkUserToMongo(clerkUserData) {
    return this.syncOnUserUpdated(clerkUserData);
  }
}

// Exporting a singleton instance for clean DI/usage across controllers
export const userSyncService = new UserSyncService();
