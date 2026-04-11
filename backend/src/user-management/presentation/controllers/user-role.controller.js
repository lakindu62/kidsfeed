import express from 'express';
import mongoose from 'mongoose';
import { userService } from '../../application/services/user.service.js';
import { ROLES } from '../../../shared/constants/roles.js';

export const userManagementRouter = express.Router();

/**
 * GET /api/users
 * GET /api/users/by-role/:role
 * Lists users for the admin flow, optionally filtered by role.
 * No status filter is applied.
 *
 * PATCH /api/users/by-id/:userId/role
 * PATCH /api/users/by-clerk/:clerkId/role
 * Updates a user's role in MongoDB and Clerk metadata.
 * Guard middleware is intentionally omitted for now.
 */
const sendUsersList = (res, users, role = null) => {
  return res.status(200).json({
    success: true,
    count: users.length,
    role: role ?? 'all',
    data: users,
  });
};

const listUsersAndRespond = async (req, res, role = null) => {
  try {
    const users = await userService.listUsers(role ? { role } : {});
    return sendUsersList(res, users, role);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message,
    });
  }
};

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

    return sendRoleUpdateSuccess(res, updatedUser);
  } catch (error) {
    const statusCode = error.message?.toLowerCase().includes('not found')
      ? 404
      : 500;

    return res.status(statusCode).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message,
    });
  }
};

userManagementRouter.get('/', async (req, res) => {
  const { role } = req.query;

  if (!role || role === 'all' || role === 'ALL') {
    return listUsersAndRespond(req, res);
  }

  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role filter',
    });
  }

  return listUsersAndRespond(req, res, role);
});

userManagementRouter.get('/by-role/:role', async (req, res) => {
  const { role } = req.params;

  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role filter',
    });
  }

  return listUsersAndRespond(req, res, role);
});

userManagementRouter.patch('/by-id/:userId/role', async (req, res) => {
  return updateRoleAndRespond(req, res, 'by-id');
});

userManagementRouter.patch('/by-clerk/:clerkId/role', async (req, res) => {
  return updateRoleAndRespond(req, res, 'by-clerk');
});
