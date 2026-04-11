# User Management Implementation Guide

This document summarizes the user-management backend that currently exists in `backend/src/user-management` and how it is intended to be used by the admin frontend.

## Scope

The module handles three responsibilities:

1. Listing users for admin views.
2. Updating user roles in MongoDB and Clerk.
3. Deleting users from both MongoDB and Clerk.
4. Synchronizing newly created Clerk users into the local database through webhooks.

This module does **not** implement a status filter. Any frontend status badge or active/inactive display must be derived separately by the UI or future schema changes.

---

## Public HTTP Endpoints

### User listing

- `GET /api/users`
  - Returns all users.
  - Supports an optional `role` query parameter.
  - Example: `GET /api/users?role=admin`

- `GET /api/users/by-role/:role`
  - Returns all users matching the role in the path.
  - Example: `GET /api/users/by-role/inventory_manager`

### Role updates

- `PATCH /api/users/by-id/:userId/role`
  - Updates a user role using the MongoDB `_id`.

- `PATCH /api/users/by-clerk/:clerkId/role`
  - Updates a user role using the Clerk user ID.

### Dangerous delete flow

- `DELETE /api/users/by-id/:userId`
  - Permanently deletes the user from Clerk and MongoDB.

- `DELETE /api/users/by-clerk/:clerkId`
  - Permanently deletes the user from Clerk and MongoDB.

**Important:** this is a destructive action. The frontend should show a confirmation popup or a multi-step confirmation flow before calling it.

### Clerk webhook

- `POST /api/webhooks/`
  - Receives Clerk webhook events.
  - Must stay public so Clerk can deliver `user.created` events and keep local user records in sync.

---

## Current Data Flow

### 1. New user creation

When Clerk sends a `user.created` webhook:

1. `clerk.webhook.router.js` accepts the raw payload.
2. `clerk.webhook.controller.js` verifies the webhook signature.
3. `userSyncService.syncOnUserCreated()` upserts the local MongoDB user.
4. The user starts with the `unassigned` role.
5. Clerk public metadata is updated with the MongoDB id and role.

This is what makes the local user profile available to the rest of the app after first login.

### 2. Role update

When an admin changes a role:

1. The controller validates the path param and request body.
2. `userService.updateUserRole()` or `updateUserRoleById()` updates MongoDB.
3. The same method updates Clerk public metadata with:
   - `role`
   - `mongoId`
4. The API response includes `tokenRefreshRequired: true`.

This means the backend updates Clerk metadata, but the frontend should refresh the session/token so the new role is reflected in the client state.

### 3. Delete user

When an admin deletes a user:

1. The controller validates the id.
2. `userService.deleteUserById()` or `deleteUserByClerkId()` looks up the user.
3. Clerk user deletion is performed with the backend SDK.
4. The local MongoDB record is removed.

This is a hard delete, not a soft disable.

---

## Service Layer

The `UserService` currently exposes these methods:

- `listUsers(filters = {})`
  - Returns all users or filters by role.

- `getUserProfile(userId)`
  - Resolves a full MongoDB user profile from a lightweight auth context.

- `updateUserRole(clerkId, newRole)`
  - Updates by Clerk id and propagates role metadata to Clerk.

- `updateUserRoleById(userId, newRole)`
  - Updates by MongoDB id and propagates role metadata to Clerk.

- `deleteUserById(userId)`
  - DANGEROUS: deletes the Clerk user and then deletes the MongoDB record.

- `deleteUserByClerkId(clerkId)`
  - DANGEROUS: deletes the Clerk user and then deletes the MongoDB record.

---

## Repository Layer

The repository methods already used by the service are:

- `findAll(filter = {})`
- `findByRole(role)`
- `findById(id)`
- `findByClerkId(clerkId)`
- `updateRoleById(userId, newRole)`
- `updateRoleByClerkId(clerkId, newRole)`
- `deleteById(userId)`
- `deleteByClerkId(clerkId)`

These methods are thin wrappers around the Mongoose `UserModel` and keep database access out of the controller.

---

## Frontend Admin Flow Expectations

For the admin users table, the frontend can call:

- `GET /api/users` to load all users
- `GET /api/users?role=...` to filter the table by role
- `PATCH /api/users/by-id/:userId/role` or `PATCH /api/users/by-clerk/:clerkId/role` to change a role
- `DELETE /api/users/by-id/:userId` or `DELETE /api/users/by-clerk/:clerkId` to remove a user

Suggested frontend behavior:

- Show a confirmation modal before delete.
- Reload or refresh auth state after a role change.
- Keep delete hidden behind an admin-only action menu.

---

## Suggested Frontend Structure

The admin UI should be built as a dedicated user-management feature screen, not as a generic shared table. The screenshot implies a single-purpose admin page with a sidebar, top section, filters, a user table, and row actions.

### Recommended page layout

- Left sidebar
  - Keep the existing app navigation pattern.
  - The user-management page should appear as an admin-only route entry, similar to the other feature areas.

- Main content area
  - Page title: `User Access Control`
  - Short supporting subtitle/description.
  - Filter and search bar row.
  - User list table.
  - Row actions menu.

### Recommended component breakdown

- `UserManagementPage`
  - Owns the page shell, breadcrumb/title area, and top-level layout.

- `UserFiltersBar`
  - Contains search input and role filter dropdown.
  - No status filter is required for the current implementation.

- `UsersTable`
  - Renders columns for user details, role, and actions.
  - Can derive a visible status badge in the UI if needed, but status is not part of the backend API.

- `UserRowActions`
  - Dropdown or action menu for each user.
  - Should include edit role and delete user.

- `UserRoleDialog` or `UserRolePopover`
  - Used to change a user role.
  - Should call the role update endpoint and then refresh the list and auth state.

- `ConfirmDeleteUserDialog`
  - Mandatory confirmation step before calling any delete endpoint.
  - Should clearly warn that the delete is permanent.

### Recommended data flow

1. Page loads.
2. Frontend fetches `GET /api/users`.
3. Role filter changes call `GET /api/users?role=...` or `GET /api/users/by-role/:role`.
4. Role update action calls the relevant `PATCH` endpoint.
5. Delete action calls the relevant `DELETE` endpoint only after confirmation.
6. The table refreshes after every mutation.

### Recommended state to keep in the page

- `searchTerm`
- `selectedRole`
- `users`
- `loading`
- `error`
- `activeUserAction`
- `deleteConfirmationTarget`

### UI behavior rules

- Search should filter the visible user list on name or email.
- Role dropdown should map to the backend role constants.
- No status dropdown is needed.
- Delete should be a destructive action with a clear confirmation flow.
- If role changes, the frontend should refresh the current session or auth context so the new role is reflected immediately.

### Suggested file organization

If the frontend feature does not exist yet, a clean structure would be:

- `frontend/src/features/user-management/`
  - `pages/UserManagementPage.jsx`
  - `components/UserFiltersBar.jsx`
  - `components/UsersTable.jsx`
  - `components/UserRowActions.jsx`
  - `components/UserRoleDialog.jsx`
  - `components/ConfirmDeleteUserDialog.jsx`
  - `api/user-management.api.js`
  - `hooks/use-users-query.js`

If you keep the page inside the current page/router pattern, the same component split still applies.

---

## Security Notes

- The user-management router should remain admin-only at the app mount level.
- Clerk webhook routes must remain public.
- Route guards are enforced in backend `app.js`; frontend route hiding is only a UX layer.
- The delete flow uses Clerk backend admin operations, so it must stay server-side.

---

## What Is Not Implemented Yet

- No status filter in the list API.
- No soft-delete / disable-user flow.
- No audit log endpoint for role or delete actions.
- No frontend confirmation UI yet.

---

## Summary

The current user-management backend already supports:

- Admin user listing
- Role filtering
- Role updates that sync MongoDB and Clerk metadata
- Hard user deletion in Clerk and MongoDB
- Clerk webhook sync for first-time user creation

This is enough to build the admin user-management table and basic role management UI.
