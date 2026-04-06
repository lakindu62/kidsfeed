import { getAuth, clerkClient } from '@clerk/express';
import { UserModel } from '../../user-management/infrastructure/schemas/user.schema.js';

/**
 * Resolves the Clerk session and attaches it to req.user.
 * First it attempts to read the custom sessionClaims (mongoId, role) directly from the JWT to avoid DB lookups entirely.
 * If they are missing (e.g. brand new user where webhook is lagging), it falls back to DB.
 *
 * @type {import('express').RequestHandler}
 */
export const attachUser = async (req, res, next) => {
  try {
    const authState = getAuth(req);
    const { userId: clerkId, sessionClaims } = authState;

    if (!clerkId) {
      return next(Object.assign(new Error('Unauthorized'), { status: 401 }));
    }

    // 1. FAST PATH (Zero-Latency Auth)
    // Read directly from the encoded Session JWT.
    const mongoId = sessionClaims?.mongoId;
    const role = sessionClaims?.role;

    if (mongoId && role) {
      // Create a lightweight user mock context for subsequent middlewares
      // If a specific controller needs extra DB fields, it should manually `findById`
      req.user = {
        _id: mongoId,
        clerkId,
        role,
      };
      return next();
    }

    // 2. SLOW PATH (Fallback Resilience)
    // Runs only if the Clerk Webhook hasn't arrived/updated metadata yet,
    // or the frontend hasn't refreshed the token.
    let user = await UserModel.findOne({ clerkId });

    if (!user) {
      // Final edge case: If the DB truly doesn't have them yet, fetch directly.
      const clerkUser = await clerkClient.users.getUser(clerkId);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? '';
      const name =
        `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim();

      user = await UserModel.create({ clerkId, email, name });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
