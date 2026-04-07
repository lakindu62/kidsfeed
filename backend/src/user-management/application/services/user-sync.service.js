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
   * Safely upserts a user into the local database and subsequently pushes
   * critical domain data (mongoId, role) back to Clerk's public metadata.
   *
   * @param {Object} clerkUserData - The user data payload received from a Clerk webhook event.
   * @returns {Promise<Object>} The synchronized MongoDB user document.
   */
  async syncClerkUserToMongo(clerkUserData) {
    const {
      id: clerkId,
      email_addresses,
      first_name,
      last_name,
    } = clerkUserData;

    // Safely extract email and construct full name
    const email = email_addresses?.[0]?.email_address ?? '';
    const name = `${first_name ?? ''} ${last_name ?? ''}`.trim();

    // 1. Local Database Upsert via Repository
    // The repository handles the Mongoose-specific $set and $setOnInsert internals
    const syncedUser = await userRepository.upsertByClerkId(
      clerkId,
      { email, name }, // Fields to update if user exists
      { role: ROLES.STAFF, schoolId: null } // Fields to set only on creation
    );

    // 2. Push state back to External Identity Provider (Clerk)
    // We bind the user's localized role and Mongo ID to their session token
    // allowing subsequent requests to be verified statelessy without DB lookups.
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        mongoId: syncedUser._id.toString(),
        role: syncedUser.role,
      },
    });

    return syncedUser;
  }
}

// Exporting a singleton instance for clean DI/usage across controllers
export const userSyncService = new UserSyncService();
