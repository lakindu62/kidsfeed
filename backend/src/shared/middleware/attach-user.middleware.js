import { getAuth, clerkClient } from '@clerk/express';
import { UserModel } from '../../user-management/infrastructure/schemas/user.schema.js';

/**
 * Resolves the Clerk session to a local MongoDB user and attaches it to req.user.
 * Creates a new user document on first login using profile data fetched from Clerk.
 * Must be used after apiRequireAuth in the middleware chain.
 *
 * @type {import('express').RequestHandler}
 */
export const attachUser = async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return next(Object.assign(new Error('Unauthorized'), { status: 401 }));
    }

    let user = await UserModel.findOne({ clerkId });

    if (!user) {
      // First login — fetch full profile from Clerk to get email and display name
      const clerkUser = await clerkClient.users.getUser(clerkId);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? '';
      const name =
        `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim();

      // role defaults to ROLES.STAFF; schoolId defaults to null
      user = await UserModel.create({ clerkId, email, name });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
