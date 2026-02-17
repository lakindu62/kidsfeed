# Contributing to Kidsfeed

This document outlines the automated quality control system and git workflow for the kidsfeed repository. These tools ensure that all code follows a consistent style and that commit messages remain meaningful and standardized.

> **Note:** For initial setup instructions, see [README.md](README.md).

## 1. The Architecture

The project uses a Monorepo approach where a single "Root" package manages the global Git processes, while individual sub-folders (Backend/Frontend) manage their own specific rules.

### Component Roles

- **Husky (Root):** The gatekeeper that triggers scripts during Git events (commits).
- **Commitlint (Root):** The inspector that enforces the "Conventional Commits" standard for messages.
- **Lint-staged (Root):** An optimization tool that ensures we only lint/format files that have actually changed.
- **ESLint (Backend/Frontend):** The logical inspector checking for bugs and "code smells."
- **Prettier (Backend/Frontend):** The visual architect ensuring consistent indentation and styling.

## 3. Directory Structure

```text
kidsfeed/
├── .husky/                # Git hook scripts (pre-commit, commit-msg)
├── backend/
│   ├── eslint.config.js   # Node.js/ESM Flat Config (v10)
│   ├── .prettierrc        # Styling rules for Backend
│   └── package.json       # ESLint/Prettier dependencies
├── frontend/
│   ├── eslint.config.js   # React/Vite/V10 Config
│   ├── .prettierrc        # Styling rules for Frontend
│   └── package.json       # React dependencies
├── .commitlintrc.json     # Global commit message rules
├── package.json           # Orchestrator (Husky, Lint-staged config)
└── CONTRIBUTING.md        # This file
```

### Lint-Staged Configuration

The root `package.json` contains the lint-staged configuration that defines which commands run on staged files:

```json
"lint-staged": {
  "backend/**/*.js": [
    "npm --prefix backend run lint:fix",
    "npm --prefix backend run format"
  ],
  "frontend/src/**/*.{js,jsx}": [
    "npm --prefix frontend run lint:fix",
    "npm --prefix frontend run format"
  ]
}
```

## 2. The Commit Process (The "Hard Gates")

When you run `git commit -m "..."`, the following chain reaction occurs:

### Gate A: The Pre-Commit Hook (`.husky/pre-commit`)

- **Trigger:** lint-staged is called.
- **Filtering:** It identifies which files are "staged" (added).
- **Execution:**
  - Backend files (`.js`): Runs `npm run lint:fix` (auto-fixes logic issues) and `npm run format` (fixes style).
  - Frontend files (`.jsx`): Runs the frontend equivalents.
- **Validation:** If any ESLint Error is found that cannot be auto-fixed, the commit is blocked.

### Gate B: The Commit-Msg Hook (`.husky/commit-msg`)

- **Trigger:** commitlint reads your message.
- **Rules:** It checks for the `type: subject` format.
- **Allowed Types:** feat, fix, chore, docs, style, refactor, perf, test.
- **Validation:** If you use a non-standard message (e.g., "fixed stuff"), the commit is blocked.

## 3. Bypassing the Gates (Emergency Only)

If you need to skip the checks for a specific, emergency reason, use the following flag:

```sh
git commit -m "chore: emergency bypass" --no-verify
```

To temporarily disable the pre-commit hook entirely, remove or comment out the line in `.husky/pre-commit`:

```bash
npx lint-staged
```

## 4. Maintenance Commands

**Root Commands**

- `npm run prepare`: Re-installs Husky hooks (run after npm install on a new machine).

**Backend/Frontend Commands**

- `npm run lint`: Manually check for logical errors.
- `npm run lint:fix`: Manually fix logical errors where possible.
- `npm run format`: Manually re-format all code in the directory.

## 5. Pro-Tips for Developers

- **VS Code Extensions:** Install the ESLint, Prettier, and Tailwind CSS IntelliSense extensions for real-time feedback.
- **ESM Requirement:** Since the project uses ESM (`"type": "module"`), remember to include `.js` extensions in your backend import statements (e.g., `import service from './service.js'`).
