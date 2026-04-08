import express from 'express';
import { userService } from '../../application/services/user.service.js';

export const userManagementRouter = express.Router();

/**
 * PATCH /api/users/:clerkId/role
 * Updates a user's role in MongoDB and Clerk metadata.
 * Guard middleware is intentionally omitted for now.
 */
userManagementRouter.patch('/:clerkId/role', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const { role: newRole } = req.body;

    if (!clerkId || !newRole) {
      return res.status(400).json({
        success: false,
        message: 'clerkId path param and role in body are required',
      });
    }

    const updatedUser = await userService.updateUserRole(clerkId, newRole);

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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message,
    });
  }
});
