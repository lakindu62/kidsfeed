# kidsfeed

A school meal management system for tracking student meal distribution and attendance.

## Project Structure

This is a monorepo containing:

- `backend/` - Node.js/Express server with MongoDB
- `frontend/` - React/Vite application with Tailwind CSS

## Getting Started

If you have just cloned the repository, follow these steps:

**1. Install Root Dependencies:**

```sh
npm install
```

**2. Activate Husky (Git Hooks):**

```sh
npm run prepare
```

**3. Install Sub-module Dependencies:**

```sh
cd backend && npm install
cd ../frontend && npm install
```

**4. Run the Application:**

```sh
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm run dev
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code quality standards, commit conventions, and git workflow.
