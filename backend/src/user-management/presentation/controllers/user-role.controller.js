import express from 'express';
import mongoose from 'mongoose';
import { userService } from '../../application/services/user.service.js';

export const userManagementRouter = express.Router();

/**
 * PATCH /api/users/by-id/:userId/role
 * PATCH /api/users/by-clerk/:clerkId/role
 * Updates a user's role in MongoDB and Clerk metadata.
 * Guard middleware is intentionally omitted for now.
 */
const sendRoleUpdateSuccess = (res, updatedUser) => {
  return res.status(200).json({
    success: true,
    message: 'User role updated successfully',
    tokenRefreshRequired: true,
    data: {
      _id: updatedUser._id,
      clerkId: updatedUser.clerkId,
      role: updatedUser.role,
    },
  });
};

const updateRoleAndRespond = async (req, res, mode) => {
  try {
    const { role: newRole } = req.body;
    const targetRef = mode === 'by-id' ? req.params.userId : req.params.clerkId;

    console.log(
      `[User Role API] Role update requested (mode=${mode}, target=${targetRef ?? 'missing'}, role=${newRole ?? 'missing'})`
    );

    if (!newRole) {
      return res.status(400).json({
        success: false,
        message: 'role in body is required',
      });
    }

    let updatedUser;

    if (mode === 'by-id') {
      const { userId } = req.params;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: 'A valid MongoDB userId path param is required',
        });
      }

      updatedUser = await userService.updateUserRoleById(userId, newRole);
    } else {
      const { clerkId } = req.params;

      if (!clerkId) {
        return res.status(400).json({
          success: false,
          message: 'clerkId path param is required',
        });
      }

      updatedUser = await userService.updateUserRole(clerkId, newRole);
    }

    console.log(
      `[User Role API] Role update successful (mode=${mode}, userId=${updatedUser._id}, clerkId=${updatedUser.clerkId}, role=${updatedUser.role})`
    );

    return sendRoleUpdateSuccess(res, updatedUser);
  } catch (error) {
    const statusCode = error.message?.toLowerCase().includes('not found')
      ? 404
      : 500;

    console.error(
      `[User Role API] Role update failed (mode=${mode}): ${error.message}`
    );

    return res.status(statusCode).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message,
    });
  }
};

userManagementRouter.patch('/by-id/:userId/role', async (req, res) => {
  return updateRoleAndRespond(req, res, 'by-id');
});

userManagementRouter.patch('/by-clerk/:clerkId/role', async (req, res) => {
  return updateRoleAndRespond(req, res, 'by-clerk');
});
