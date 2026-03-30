import { getAuth, clerkClient } from '@clerk/express';
import { UserModel } from '../../user-management/infrastructure/schemas/user.schema.js';

export const attachUser = async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);

    let user = await UserModel.findOne({ clerkId });

    if (!user) {
      // First login — fetch full profile from Clerk to get reliable email
      const clerkUser = await clerkClient.users.getUser(clerkId);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? '';

      user = await UserModel.create({
        clerkId,
        email,
        // role defaults to 'staff', schoolId defaults to null
      });
    }

    req.user = user; // Mongo _id and all app fields available downstream
    next();
  } catch (err) {
    next(err);
  }
};
