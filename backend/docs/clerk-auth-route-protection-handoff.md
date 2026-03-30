# Clerk Route Protection Handoff

This branch provides shared Clerk auth foundations only. Route protection decisions belong to each feature owner.

## Foundation files already available

- `src/shared/middleware/require-auth.middleware.js`
- `src/shared/middleware/attach-user.middleware.js`
- `src/user-management/infrastructure/schemas/user.schema.js`

## Opt-in patterns for feature owners

### Plain routers mounted in app.js

Use this when your module exports a plain router.

```js
app.use('/api/your-path', requireAuth, attachUser, yourRouter);
```

### Composed/bootstrap routers

Use this when your module has a router factory/bootstrap.

```js
router.use(requireAuth);
router.use(attachUser);
```

Add these before route registrations that must be protected.

## Route ownership policy

- Do not protect another team's routes in this branch.
- Protect only routes owned by your feature branch.
- Keep public routes mounted before protected routes.

## Smoke test checklist

1. No token -> route returns 401.
2. Valid token first call -> local user is created.
3. Valid token second call -> same local user is reused.
4. Public routes remain accessible without auth.
