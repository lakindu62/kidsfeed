# Sidebar Configuration Maintenance Playbook

## Purpose
This document explains, in simple steps, how developers should maintain the sidebar system.

It covers:
1. Changing buttons/content for each sidebar type
2. Adding/removing roles
3. Adding/removing feature types
4. Changing feature-to-config loading behavior
5. Changing what each role can see
6. How permissions and passed props work together

## Current Architecture (Quick View)

### Shared constants
- frontend/src/lib/user-roles.js
- frontend/src/lib/app-features.js

### Sidebar config data
- frontend/src/lib/sidebar/configs/defaults.js
- frontend/src/lib/sidebar/configs/*.config.js
- frontend/src/lib/sidebar/configs/index.js
- frontend/src/lib/sidebar/configs/role-sidebar-permissions.js

### Sidebar builder/orchestrator
- frontend/src/lib/sidebar/configs.js
- frontend/src/lib/sidebar/index.js

### Sidebar UI component
- frontend/src/components/common/FeatureSidebar.jsx

## Data Flow: What Actually Happens at Runtime
1. A page chooses a feature key and has a user role.
2. The page calls buildSidebarConfig({ feature, role, ...optionalOverrides }).
3. The builder loads the feature's base config from SIDEBAR_CONFIG_BY_FEATURE.
4. The builder clones the object to avoid mutating source config files.
5. The builder applies role filtering from ROLE_SIDEBAR_PERMISSIONS.
6. The builder returns final props (brandTitle, featureLabel, sections, footerActions, primaryCta).
7. The page passes those props to FeatureSidebar.
8. FeatureSidebar renders the final buttons and actions.

## One Real Example: Page Usage
This is the minimal pattern developers should follow inside a page/screen.

```jsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FeatureSidebar from '../../components/common/FeatureSidebar';
import {
  APP_FEATURES,
  USER_ROLES,
  buildSidebarConfig,
} from '../../lib/sidebar';

export default function InventoryPageLayout() {
  const navigate = useNavigate();

  // In real app code, this should come from auth/session state.
  const userRole = USER_ROLES.INVENTORY_MANAGER;

  // Feature type tells the system which sidebar config to load.
  const featureType = APP_FEATURES.INVENTORY_MANAGEMENT;

  const sidebarConfig = useMemo(
    () =>
      buildSidebarConfig({
        feature: featureType,
        role: userRole,
      }),
    [featureType, userRole],
  );

  return (
    <div className="flex min-h-screen">
      <FeatureSidebar
        {...sidebarConfig}
        activeItemKey="inventory"
        onItemSelect={(item) => {
          if (item.to) {
            navigate(item.to);
          }
        }}
        onFooterAction={(action) => {
          if (action.to) {
            navigate(action.to);
          }
        }}
      />

      <main className="flex-1">{/* page content */}</main>
    </div>
  );
}
```

What this example shows:
- userRole controls permission filtering
- featureType controls which base config is loaded
- buildSidebarConfig combines both and returns final props
- FeatureSidebar just renders those props

## Important Rule About Keys
Filtering is key-based. These keys must match exactly:
- item.key in feature config files
- allowedItemKeys in role-sidebar-permissions.js
- action.key in feature/default action arrays
- allowedFooterActionKeys in role-sidebar-permissions.js

If keys do not match, items/actions will be filtered out.

## 1) Change Buttons or Other Content for a Sidebar Type
Use this when you want to change labels, icons, routes, sections, CTA, footer actions, etc. for one feature.

### Files to edit
- The target feature config file in frontend/src/lib/sidebar/configs/
  - Example: inventory-management.config.js
  - Example: meal-distribution.config.js

### Optional files to edit
- frontend/src/lib/sidebar/configs/defaults.js
  - Only if you want to change shared default footer actions globally.
- frontend/src/lib/sidebar/configs/role-sidebar-permissions.js
  - If role filtering should change along with new/removed buttons.

### Typical changes
- Change label text
- Change icon import
- Change route path in to
- Add/remove section blocks
- Add/remove items in section.items
- Add/remove primaryCta
- Add/remove footerActions

### If you remove buttons
Also clean permission lists so old keys are not left behind.

## 2) Add or Remove Roles
Use this when a new user role is introduced or an old role is retired.

### Add a role
1. Edit frontend/src/lib/user-roles.js and add the role constant.
2. Edit frontend/src/lib/sidebar/configs/role-sidebar-permissions.js and add permissions for that role.
3. If needed, update page-level logic (redirect hook or layout selection) to use the new role.
4. Test buildSidebarConfig for each feature this role should access.

### Remove a role
1. Remove role constant from frontend/src/lib/user-roles.js.
2. Remove its block in frontend/src/lib/sidebar/configs/role-sidebar-permissions.js.
3. Remove references in redirect/layout logic.
4. Search for old role string usages and clean up.

### Backend note
Backend roles are maintained separately and should not be changed in this frontend workflow.

## 3) Add or Remove Feature Types
Use this when a whole new portal/module needs its own sidebar type.

### Add a feature type
1. Edit frontend/src/lib/app-features.js and add the new feature key.
2. Create a new config file in frontend/src/lib/sidebar/configs/
   - Example: nutrition-management.config.js
3. In frontend/src/lib/sidebar/configs/index.js:
   - import the new feature config
   - export it
   - register it in SIDEBAR_CONFIG_BY_FEATURE
4. Add role access rules in frontend/src/lib/sidebar/configs/role-sidebar-permissions.js.
5. Update any page/layout usage to call buildSidebarConfig with the new APP_FEATURES key.

### Remove a feature type
1. Remove feature key from frontend/src/lib/app-features.js.
2. Remove mapping and imports in frontend/src/lib/sidebar/configs/index.js.
3. Delete the feature config file from frontend/src/lib/sidebar/configs/.
4. Remove related permission entries from frontend/src/lib/sidebar/configs/role-sidebar-permissions.js.
5. Remove page/layout references to that feature key.

## 4) Change What Config a Feature Type Loads
Use this when feature A should load a different config object, or mapping should change.

### Primary file to edit
- frontend/src/lib/sidebar/configs/index.js

### Why
SIDEBAR_CONFIG_BY_FEATURE in this file decides:
- which APP_FEATURES key maps to which feature config object

### Common operations
- Swap mapping target
- Register new mapping
- Remove mapping

### Also verify
- frontend/src/lib/app-features.js contains the feature key
- the mapped config file exists and is exported

## 5) Change What Each Role Type Sees
Use this when access rules must change without changing base feature config.

### Primary file to edit
- frontend/src/lib/sidebar/configs/role-sidebar-permissions.js

### How it works
For each role and feature, set:
- allowedItemKeys
- allowedFooterActionKeys

### Wildcard behavior
You can define '*' under a role as fallback rules.
Current code checks:
- exact role + feature
- then role + '*'

### Typical examples
- Give staff one more menu item in mealDistribution
- Hide reports for a role
- Allow only logout footer action

## Permissions vs Passing Props (Very Important)

### Base config defines what exists
Feature config files define the full potential menu for a feature.

### Role permissions filter what is visible
buildSidebarConfig applies role filtering and removes disallowed keys.

### Props can still override at call-site
When calling buildSidebarConfig, page code can pass:
- allowedItemKeys
- allowedFooterActionKeys
- includePrimaryCta

These explicit params override role-derived values.

### Component-level visibility
FeatureSidebar also filters any item/action where visible === false.
So there are two levels:
1. Builder-level key filtering (permissions/overrides)
2. Component-level visible flag filtering

## Why Keep Both Allowed-Key Filtering and Props?
This is a valid question. A page can pass sections directly, so why keep role filtering too?

### The core decision
The key decision is where permission knowledge should live.

If every page manually builds sidebar items, then role rules get repeated everywhere.
That creates duplicated logic and maintenance risk.

With the current setup:
1. Feature config files define what can exist.
2. Role permissions define what each role can see.
3. Pages only provide context (feature + role) and interaction handlers.

This centralizes permission logic in one place.

### What happens if we skip the permission layer?
Each page would have custom role checks and custom arrays.
When business rules change, developers must update many pages.

With the permission file approach, one update in role-sidebar-permissions.js updates all pages using the builder.

### Why do allowedItemKeys and allowedFooterActionKeys exist in function params?
They are deliberate override hooks for exceptions, not for normal day-to-day usage.

Example exception:
- onboarding flow
- temporary beta flow
- maintenance mode view

In those cases, page code can override visibility for one screen without rewriting base role rules.

## Which Files Developers Edit in Normal Work

### Scenario A: Change what buttons/content a feature has
Edit the feature config file:
- frontend/src/lib/sidebar/configs/<feature>.config.js

Typical edits in that file:
- add/remove item in sections
- change labels/icons/routes
- add/remove primaryCta
- add/remove footerActions

### Scenario B: Change what each role can see
Edit role permission mapping:
- frontend/src/lib/sidebar/configs/role-sidebar-permissions.js

Typical edits in that file:
- add/remove keys in allowedItemKeys
- add/remove keys in allowedFooterActionKeys

### Scenario C: Change shared default footer actions globally
Edit:
- frontend/src/lib/sidebar/configs/defaults.js

## What Developers Actually Pass to FeatureSidebar in Page Code
In normal usage, developers should pass very little manually.

Page-level code usually provides:
1. role (from auth/session)
2. feature (from page/module context)
3. activeItemKey (for selected state)
4. onItemSelect and onFooterAction (navigation behavior)

Everything else is generated by buildSidebarConfig.

### Practical usage example

```jsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FeatureSidebar from '../../components/common/FeatureSidebar';
import {
  APP_FEATURES,
  USER_ROLES,
  buildSidebarConfig,
} from '../../lib/sidebar';

export default function InventoryPage() {
  const navigate = useNavigate();

  // Replace this with your real auth state value.
  const role = USER_ROLES.INVENTORY_MANAGER;

  const sidebarConfig = useMemo(
    () =>
      buildSidebarConfig({
        feature: APP_FEATURES.INVENTORY_MANAGEMENT,
        role,
      }),
    [role],
  );

  return (
    <div className="flex min-h-screen">
      <FeatureSidebar
        {...sidebarConfig}
        activeItemKey="inventory"
        onItemSelect={(item) => {
          if (item.to) navigate(item.to);
        }}
        onFooterAction={(action) => {
          if (action.to) navigate(action.to);
        }}
      />

      <main className="flex-1">{/* page content */}</main>
    </div>
  );
}
```

## Recommended Mental Model for the Team
Use this rule:

1. Edit feature config files to define available UI items.
2. Edit permission file to define role access to those items.
3. Keep page code thin: pass feature, role, active key, and handlers.

This keeps behavior consistent and reduces repeated logic across pages.

## What to Create, Edit, Delete (Cheat Sheet)

### Change one feature sidebar menu
- Edit: frontend/src/lib/sidebar/configs/<feature>.config.js
- Maybe edit: frontend/src/lib/sidebar/configs/role-sidebar-permissions.js

### Add role
- Edit: frontend/src/lib/user-roles.js
- Edit: frontend/src/lib/sidebar/configs/role-sidebar-permissions.js

### Remove role
- Edit: frontend/src/lib/user-roles.js
- Edit: frontend/src/lib/sidebar/configs/role-sidebar-permissions.js
- Cleanup references in page logic

### Add feature type
- Edit: frontend/src/lib/app-features.js
- Create: frontend/src/lib/sidebar/configs/<new-feature>.config.js
- Edit: frontend/src/lib/sidebar/configs/index.js
- Edit: frontend/src/lib/sidebar/configs/role-sidebar-permissions.js

### Remove feature type
- Edit: frontend/src/lib/app-features.js
- Edit: frontend/src/lib/sidebar/configs/index.js
- Delete: frontend/src/lib/sidebar/configs/<feature>.config.js
- Edit: frontend/src/lib/sidebar/configs/role-sidebar-permissions.js

### Change feature-to-config mapping
- Edit: frontend/src/lib/sidebar/configs/index.js

### Change role visibility
- Edit: frontend/src/lib/sidebar/configs/role-sidebar-permissions.js

## Developer Validation Checklist (After Any Change)
1. Import/export still resolves with no lint/compile errors.
2. New or removed keys are consistent across config and permissions.
3. Sidebar renders expected items for each changed role.
4. Footer actions and primary CTA behave as expected.
5. activeItemKey used by page still points to a key that exists.
6. Redirect/layout logic (if relevant) supports new role/feature.

## Recommended Team Workflow
1. Start with feature config file changes.
2. Then adjust role permissions.
3. Then update feature/role constants only if needed.
4. Finally validate a real page render for affected role+feature pairs.

This order reduces accidental breakage and makes PR review easier.
