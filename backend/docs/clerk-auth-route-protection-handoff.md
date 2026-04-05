# Clerk Auth & Role Protection Handoff

This document outlines how developers should secure their respective feature components in the backend using Clerk authentication and the new role-based access control (RBAC) system.

## Available Middleware & Constants

The core authentication logic has been established in the `src/shared` directory:

1. **`apiRequireAuth`** (`src/shared/middleware/require-auth.middleware.js`)
   - Verifies the user has a valid Clerk session. Returns 401 if not.
2. **`attachUser`** (`src/shared/middleware/attach-user.middleware.js`)
   - Resolves the Clerk session to our local MongoDB `User` model, attaching it to `req.user`. Also handles first-time user creation (extracting name and email).
   - **MUST** be used immediately after `apiRequireAuth`.
3. **`requireRole`** (`src/shared/middleware/require-role.middleware.js`)
   - A factory function that limits access based on user roles. Returns 403 if unauthorized.
   - **MUST** be used after `attachUser`.
4. **`ROLES`** (`src/shared/constants/roles.js`)
   - The single source of truth for all role strings (e.g., `ROLES.ADMIN`, `ROLES.STAFF`). Do not use raw strings in your components!

---

## How to Protect Your Routes

To lock down endpoints, you can apply these middlewares either:
1. **At the app level (`app.js`)** - Best for protecting an entire feature router.
2. **Inside your router/bootstrap (`bootstrap.js`/`index.js` or controllers)** - Best for fine-grained control (e.g. `GET` is public, `POST` is restricted).

### Example 1: Full Router Protection (in `app.js`)
```javascript
import { apiRequireAuth, attachUser, requireRole } from './shared/middleware/...';
import { ROLES } from './shared/constants/roles.js';

app.use(
  '/api/my-feature',
  apiRequireAuth,
  attachUser,
  requireRole([ROLES.ADMIN, ROLES.MEAL_PLANNER]),
  myFeatureRouter
);
```

### Example 2: Controller/Route-Level Protection
```javascript
import { apiRequireAuth } from '../../shared/middleware/require-auth.middleware.js';
import { attachUser } from '../../shared/middleware/attach-user.middleware.js';
import { requireRole } from '../../shared/middleware/require-role.middleware.js';
import { ROLES } from '../../shared/constants/roles.js';

// Open route
router.get('/', getItems);

// Restrict to specific roles
router.post(
  '/',
  apiRequireAuth,
  attachUser,
  requireRole([ROLES.ADMIN, ROLES.INVENTORY_MANAGER]),
  createItem
);
```

---

## Specific Requirements per Module

Based on the product specs, here is what each dev team needs to implement in their modules:

### 1. School Management (`src/school-management/bootstrap.js`)
- **Write Operations (POST, PUT, PATCH, DELETE)**: Protect with `requireRole([ROLES.ADMIN])`.
- **Read Operations (GET)**: Accessible to all authenticated users (just use `apiRequireAuth + attachUser`). No role restriction since any logged-in staff should be able to view school data.

### 2. Inventory Management (`src/inventory/presentation/controllers/inventory-item.controller.js`)
- **Write Operations (Create, Update, Delete)**: Protect with `requireRole([ROLES.ADMIN, ROLES.INVENTORY_MANAGER])`.
- **Read Operations (GET)**: Remain open to all authenticated users.

### 3. Meal Distribution (`src/meal-distribution/presentation/controllers/`)
- **Meal Session Management (Create/Update/Delete)**: Protect with `requireRole([ROLES.ADMIN, ROLES.MEAL_PLANNER])`.
- **QR Scan & Attendance (`meal-scan.controller.js`, `meal-attendance.controller.js`)**: Accessible to all authenticated staff (just `apiRequireAuth + attachUser`). Any staff member should be able to scan a meal card.

### 4. Menu Management (`src/menu-management/presentation/routes/recipeRoutes.js`)
- **Write Operations (Create, Update, Delete)**: Protect with `requireRole([ROLES.ADMIN, ROLES.MEAL_PLANNER])`.
- **Action Required**: Inside `RecipeController.js`, under the create recipe handler (`createRecipe`), **remove the mapping of `createdBy` from `req.body`**. Replace it with `req.user._id` directly (since `attachUser` makes the MongoDB object available). You will also need to update `CreateRecipeRequest` DTO and validator to stop requiring `createdBy` from the client request.

---

## Smoke Testing Checklist
1. Calling a protected route with no token returns `401 Unauthorized`.
2. First-time valid Clerk token registers a complete Mongo `User` (email + name from Clerk user).
3. Accessing a route without sufficient role returns `403 Forbidden`.
4. Route allows processing normally when the correct `role` is provided.
