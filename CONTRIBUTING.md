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
      "prettier --write",
      "eslint --fix"
    ],
    "frontend/src/**/*.{js,jsx}": [
      "prettier --write",
      "eslint --fix"
    ]
  }
```

## 2. The Commit Process (The "Hard Gates")

When you run `git commit -m "..."`, the following chain reaction occurs in the codebase:

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

## 6. Local Development & Webhooks (Clerk + Ngrok)

Because our backend relies on external Clerk Webhooks to synchronize user identities, Clerk needs a public URL to reach your local machine during development. We use **Ngrok** to create a secure tunnel.

### Setup Instructions

1. **Install Ngrok:** If you haven't already, download and [install Ngrok](https://ngrok.com/download) globally on your machine and set it up according to the instructions provided by ngrok.
2. **Start the Dev Environment:** Inside the `backend` directory, simply run `npm run dev`. Due to our setup, this will launch **both** your Express server AND your Ngrok tunnel concurrently.
3. **Get Your Tunnel URL:** Look at your terminal output for the Ngrok forwarding address. Copy the secure URL (it usually looks like `https://1234-abcd.ngrok-free.app`).
4. **Register with Clerk:**
   - Go to the Clerk Developer Dashboard.
   - Navigate to **Webhooks** and click **Add Endpoint**.
   - Paste your Ngrok URL and append exactly `/api/webhooks` to the end (e.g., `https://1234-abcd.ngrok-free.app/api/webhooks`).
   - Subscribe the endpoint to the `user.created`, `user.updated`, and `user.deleted` events.
5. **Update your `.env`:**
   - Once created, Clerk will issue a unique **Signing Secret** starting with `whsec_`.
   - Copy this secret, open your local `backend/.env` file, and assign it to `CLERK_WEBHOOK_SIGNING_SECRET`.

> **⚠️ Team Coordination:** Every developer must run their own Ngrok tunnel and register their own unique endpoint in the shared Clerk Dashboard. **Do not copy another developer's `whsec_` secret into your `.env`**, as it will fail signature validation for your specific tunnel.

## 7. Third-Party Integrations (Open Food Facts API)

The Kidsfeed API integrates with the crowdsourced Open Food Facts database to prepopulate nutrition sheets based on standard barcodes. To prevent backend requests from being blocked by their anti-bot automated filters, they mandate a specific `User-Agent` string for all connections.

### Local Setup Requirements

1. **Configure Your Identity:**
   - Open your local `backend/.env` file.
   - Assign your personal email to the `OPEN_FOOD_FACTS_USER_AGENT` variable using the exact format: `AppName/Version (YourContactEmail)`.
   - **Example:** `OPEN_FOOD_FACTS_USER_AGENT=KidsfeedApp/1.0 (developer.name@gmail.com)`
2. **Environment URLs:**
   - Our `open-food-facts.service.js` dynamically connects to either the Production `.org` domain or the Sandbox `.net` domain based on your `NODE_ENV`.
   - Ensure both `OPEN_FOOD_FACTS_BASEURL_PROD` and `OPEN_FOOD_FACTS_BASEURL_DEV` are populated in your secrets exactly as they appear inside `.env.example`.

> **⚠️ API Etiquette:** Open Food Facts is a free, crowdsourced Wikipedia-style database. Do not use generic fake emails or spoof traffic. Use a valid contact method so their admins can notify us instead of abruptly permanently banning our server IP if our lookup loop bugs out during load testing.
