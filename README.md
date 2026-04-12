# KidsFeed — School Meal Management System

A full-stack platform for managing school meal distribution, student dietary profiles, QR-based attendance scanning, inventory tracking, and meal planning.

**Team**

| Name | Student ID |
|------|-----------|
| Amzal M F M | IT23621688 |
| Lakindu | IT23778894 |
| Rimasha M.R.F. | IT23602496 |
| M H Ally | IT23625952 |

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Tech Stack](#tech-stack)
3. [Live Environments](#live-environments)
4. [Setup Instructions](#setup-instructions)
5. [Environment Variables](#environment-variables)
6. [Authentication & Roles](#authentication--roles)
7. [API Endpoint Documentation](#api-endpoint-documentation)
   - [School Management](#school-management)
   - [Student Management](#student-management)
   - [Student Dietary & Eligibility](#student-dietary--eligibility)
   - [Student CSV Import](#student-csv-import)
   - [QR Codes](#qr-codes)
   - [Statistics & Dashboard](#statistics--dashboard)
   - [Search](#search)
   - [Export](#export)
   - [Meal Sessions](#meal-sessions)
   - [Meal Attendance](#meal-attendance)
   - [QR Meal Scan](#qr-meal-scan)
   - [Meal Distribution — No-Show Alerts](#meal-distribution--no-show-alerts)
   - [Meal Distribution — Student History](#meal-distribution--student-history)
   - [Meal Distribution — Reports](#meal-distribution--reports)
   - [Menu Management — Recipes](#menu-management--recipes)
   - [Menu Management — Nutrition](#menu-management--nutrition)
   - [Meal Planning](#meal-planning)
   - [Inventory](#inventory)
   - [User Management](#user-management)
   - [Webhooks](#webhooks)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Contributing](#contributing)

---

## Project Structure

```
kidsfeed/
├── backend/                   # Node.js / Express API (MongoDB)
│   ├── src/
│   │   ├── school-management/ # Schools, students, QR, import, export
│   │   ├── meal-distribution/ # Sessions, attendance, scan, reports
│   │   ├── meal-planning/     # Weekly meal plans
│   │   ├── menu-management/   # Recipes and nutrition calculation
│   │   ├── inventory/         # Stock items and batches
│   │   ├── user-management/   # Roles and Clerk webhook sync
│   │   └── shared/            # Auth middleware, constants
│   └── tests/
│       └── unit-tests/        # Jest unit tests
└── frontend/                  # React / Vite / Tailwind / shadcn/ui
```

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ (ES Modules) |
| Framework | Express 4 |
| Database | MongoDB via Mongoose |
| Authentication | Clerk (`@clerk/express`) |
| PDF generation | PDFKit |
| QR generation | qrcode |
| CSV processing | csv-parse, csv-stringify |
| File uploads | Multer |
| SMS notifications | Twilio |
| External nutrition | Open Food Facts API |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React + Vite |
| Styling | Tailwind CSS |
| Component library | shadcn/ui |
| Auth | Clerk (React SDK) |

---

## Live Environments

| Environment | URL |
|-------------|-----|
| Backend API (production) | https://kidsfeed-api.vebula.space |
| Frontend — Production | https://kidsfeed.vercel.app |
| Frontend — Staging | https://kidsfeed-git-dev-lakindus-projects.vercel.app |

**Infrastructure**
- **Backend:** Deployed via [Coolify](https://coolify.io/) on a Hostinger KVM 2 VPS running Ubuntu 24.04, with a custom domain served over HTTPS.
- **Frontend:** Deployed on Vercel. The `main` branch maps to production; the `dev` branch maps to the staging environment.
- **Database:** MongoDB Atlas — cluster `sliit-kidsfeed`.

---

## Setup Instructions

### Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Node.js | 18.x |
| npm | 9.x |
| MongoDB Atlas account | — |
| Clerk account | — |

### 1. Clone the Repository

```sh
git clone <repo-url>
cd kidsfeed
```

### 2. Install Root Dependencies & Activate Git Hooks

```sh
npm install
npm run prepare
```

### 3. Install Sub-module Dependencies

```sh
cd backend && npm install
cd ../frontend && npm install
```

### 4. Configure Environment Variables

```sh
cd backend
cp .env.example .env
```

Fill in all values in `backend/.env` — refer to [Environment Variables](#environment-variables) below.

### 5. Run the Application

```sh
# Terminal 1 — Backend (from /backend)
npm run dev        # nodemon + ngrok on port 3000

# Terminal 2 — Frontend (from /frontend)
npm run dev        # Vite dev server
```

The API is available at `http://localhost:3000`. All routes are prefixed `/api`.

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port the server listens on | `3000` |
| `NODE_ENV` | Runtime environment | `development` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/sliit-kidsfeed` |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_…` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_test_…` |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Svix signing secret — unique per developer from Clerk dashboard | `whsec_…` |
| `USDA_API_KEY` | USDA FoodData Central API key | `abc123…` |
| `OPEN_FOOD_FACTS_BASE_URL` | Open Food Facts base URL | `https://world.openfoodfacts.org/api/v2/product` |
| `OPEN_FOOD_FACTS_USER_AGENT` | User-agent header for Open Food Facts | `KidsfeedApp/1.0 (dev@example.com)` |
| `FRONTEND_ORIGINS` | Comma-separated CORS-allowed origins | `http://localhost:5173,https://kidsfeed.vercel.app` |

---

## Authentication & Roles

KidsFeed uses **[Clerk](https://clerk.com/)** for authentication. Clerk session tokens are passed in the `Authorization` header:

```
Authorization: Bearer <clerk_session_token>
```

`clerkMiddleware()` is applied globally. Individual routes can be protected by adding `apiRequireAuth` → `attachUser` → `requireRole([...])` to the middleware chain.

User accounts are created and kept in sync with MongoDB automatically via the `/api/webhooks` Clerk webhook on user lifecycle events.

### Roles

| Role | Description |
|------|-------------|
| `admin` | Full system access |
| `school-management` | School and student management |

---

## API Endpoint Documentation

**Base URL (production):** `https://kidsfeed-api.vebula.space`  
**Base URL (local):** `http://localhost:3000`  
All endpoints are prefixed with `/api`.

---

### School Management

#### `GET /api/schools`
Returns all schools.

**Response `200`**
```json
{
  "success": true,
  "message": "Schools retrieved successfully",
  "data": [
    { "_id": "664f…", "schoolName": "Lincoln Elementary", "districtNumber": "D001", "address": "123 Main St" }
  ]
}
```

---

#### `GET /api/schools/:id`
Returns a single school by MongoDB ID.

**Response `200`** — School object  
**Response `404`** — School not found

---

#### `POST /api/schools`
Creates a new school.

**Request body**
```json
{ "schoolName": "Lincoln Elementary", "districtNumber": "D001", "address": "123 Main St" }
```

**Response `201`** — Created school object

---

#### `PUT /api/schools/:id`
Updates a school.

**Request body** — Any subset of school fields.

**Response `200`** — Updated school object

---

#### `DELETE /api/schools/:id`
Deletes a school.

**Response `200`** — Deletion confirmation

---

### Student Management

#### `GET /api/schools/:schoolId/students`
Lists students for a school with optional filtering and pagination.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default `1`) |
| `limit` | number | Results per page (default `20`) |
| `status` | string | `active` or `inactive` |
| `gradeLevel` | string | Filter by grade |
| `q` | string | Name search |

**Response `200`**
```json
{
  "success": true,
  "data": [{ "id": "…", "firstName": "Alice", "lastName": "Smith" }],
  "pagination": { "total": 42, "page": 1, "limit": 20, "pages": 3 }
}
```

---

#### `POST /api/schools/:schoolId/students`
Creates a new student under a school.

**Request body**
```json
{
  "studentId": "STU-001",
  "firstName": "Alice",
  "lastName": "Smith",
  "age": 9,
  "gradeLevel": "Grade 4",
  "status": "active"
}
```

**Response `201`** — Created student object  
**Response `404`** — School not found  
**Response `409`** — Student ID already exists

---

#### `GET /api/students/:id`
Returns a single student by MongoDB ID.

**Response `200`** — Student object  
**Response `404`** — Not found

---

#### `PUT /api/students/:id`
Updates a student record.

**Response `200`** — Updated student object  
**Response `404`** — Not found

---

#### `DELETE /api/students/:id`
Deletes a student.

**Response `200`** — Deletion confirmation  
**Response `404`** — Not found

---

### Student Dietary & Eligibility

#### `PUT /api/students/:id/dietary`
Updates a student's dietary profile.

**Request body**
```json
{
  "dietaryTags": ["gluten-free", "vegetarian"],
  "allergens": ["nuts"],
  "notes": "Carries an EpiPen"
}
```

**Response `200`**
```json
{
  "success": true,
  "message": "Dietary profile updated successfully",
  "data": { "id": "…", "dietaryTags": ["gluten-free", "vegetarian"] }
}
```

---

#### `PUT /api/students/:id/eligibility`
Updates a student's meal eligibility status.

**Request body**
```json
{ "status": "eligible" }
```

**Response `200`** — Updated student object

---

### Student CSV Import

#### `GET /api/schools/:schoolId/import/template`
Downloads a CSV template for bulk student import.

**Response `200`** — `Content-Type: text/csv`  
`Content-Disposition: attachment; filename="student-import-template.csv"`

---

#### `POST /api/schools/:schoolId/import/preview`
Uploads a CSV and returns a preview — no data is saved at this stage.

**Request** — `multipart/form-data`, field name `file`.

**Response `200`**
```json
{
  "success": true,
  "message": "Import preview generated",
  "data": {
    "importToken": "tok_…",
    "valid": [{ "studentId": "STU-002", "firstName": "Bob" }],
    "errors": []
  }
}
```

---

#### `POST /api/schools/:schoolId/import/confirm`
Commits the import using the token from `/preview`.

**Request body**
```json
{ "importToken": "tok_…" }
```

**Response `201`**
```json
{ "success": true, "message": "Successfully imported 12 students", "data": { "imported": 12 } }
```

---

### QR Codes

#### `GET /api/students/:id/qr`
Generates or retrieves the QR code for a student.

**Response `200`**
```json
{
  "success": true,
  "message": "QR code generated successfully",
  "data": { "qrDataUrl": "data:image/png;base64,…", "qrStatus": "active" }
}
```

---

#### `PUT /api/students/:id/qr/status`
Updates a student's QR status.

**Request body**
```json
{ "status": "active" }
```

Accepted values: `active`, `inactive`, `pending`

**Response `200`** — Updated student object

---

#### `POST /api/schools/:schoolId/qr/batch`
Batch-generates QR codes for all students in a school.

**Query params:** `grade` (optional — filter to one grade level)

**Response `200`**
```json
{ "success": true, "message": "Batch QR generation complete", "data": { "generated": 45, "skipped": 3 } }
```

---

#### `GET /api/schools/:schoolId/qr/cards`
Returns QR card data for all students in a school.

**Response `200`** — Array of student QR card objects

---

### Statistics & Dashboard

#### `GET /api/dashboard/overview`
System-wide summary statistics.

**Response `200`**
```json
{
  "success": true,
  "data": { "totalSchools": 5, "totalStudents": 312, "activeStudents": 298 }
}
```

---

#### `GET /api/schools/:schoolId/stats`
Statistics for a specific school.

**Response `200`**
```json
{
  "success": true,
  "data": { "totalStudents": 80, "activeStudents": 76, "qrIssued": 70 }
}
```

---

### Search

#### `GET /api/search?q=`
Global search across schools and students.

**Query params:** `q` — search term

**Response `200`**
```json
{
  "success": true,
  "message": "Search completed",
  "data": {
    "schools": [{ "_id": "…", "schoolName": "Lincoln Elementary" }],
    "students": [{ "id": "…", "firstName": "Alice" }]
  }
}
```

---

### Export

#### `GET /api/schools/:schoolId/export/district-report`
Downloads a PDF district report for a school.

**Response `200`** — `Content-Type: application/pdf`  
`Content-Disposition: attachment; filename="district-report-D001.pdf"`

---

#### `GET /api/schools/:schoolId/qr/export/csv`
Downloads a CSV of all student QR card data.

**Response `200`** — `Content-Type: text/csv`

---

#### `GET /api/schools/:schoolId/qr/export/pdf`
Downloads a printable PDF of QR cards for all students in a school.

**Response `200`** — `Content-Type: application/pdf`

---

### Meal Sessions

#### `GET /api/meal-sessions`
Lists meal sessions with optional filters.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `schoolId` | string | Filter by school |
| `mealType` | string | `breakfast`, `lunch`, `dinner` |
| `date` | string | Exact date `YYYY-MM-DD` |
| `dateFrom` | string | Start of date range |
| `dateTo` | string | End of date range |

**Response `200`** — Array of meal session objects

---

#### `GET /api/meal-sessions/:id`
Returns a single meal session.

**Response `200`** — Meal session object  
**Response `404`** — Not found

---

#### `GET /api/meal-sessions/:id/guardian-notifications`
Lists guardian notifications sent for a session.

**Response `200`** — Array of notification records

---

#### `POST /api/meal-sessions`
Creates a meal session.

**Request body**
```json
{
  "schoolId": "664f…",
  "mealType": "lunch",
  "date": "2024-06-01",
  "mealPlanId": "665a…"
}
```

**Response `201`** — Created session  
**Response `409`** — Duplicate session for school/date/mealType

---

#### `PUT /api/meal-sessions/:id`
Updates a meal session.

**Response `200`** — Updated session  
**Response `404`** — Not found

---

#### `DELETE /api/meal-sessions/:id`
Deletes a meal session.

**Response `204`** — No content  
**Response `404`** — Not found

---

### Meal Attendance

#### `GET /api/meal-attendance`
Lists attendance records.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `studentId` | string | Filter by student |
| `mealSessionId` | string | Filter by session |
| `status` | string | `PRESENT` or `ABSENT` |
| `dateFrom` | string | Start date |
| `dateTo` | string | End date |

**Response `200`** — Array of attendance records

---

#### `GET /api/meal-attendance/roster?mealSessionId=`
Full roster for a session — includes both present and absent students.

**Query params:** `mealSessionId` (required)

**Response `200`** — Array of roster entries  
**Response `400`** — Missing `mealSessionId`  
**Response `404`** — Session not found

---

#### `GET /api/meal-attendance/:id`
Returns a single attendance record.

**Response `200`** — Attendance record  
**Response `404`** — Not found

---

#### `POST /api/meal-attendance`
Marks attendance for a student.

**Request body**
```json
{
  "studentId": "664f…",
  "mealSessionId": "665a…",
  "status": "PRESENT",
  "servedAt": "2024-06-01T12:05:00Z",
  "notes": "Took extra portion"
}
```

**Response `201`** — Attendance record  
**Response `400`** — Student not enrolled at the session's school  
**Response `404`** — Session not found  
**Response `409`** — Session locked or student already marked present

---

#### `PUT /api/meal-attendance/:id`
Updates an attendance record.

**Response `200`** — Updated record  
**Response `404`** — Not found  
**Response `409`** — Session locked

---

#### `DELETE /api/meal-attendance/:id`
Deletes an attendance record.

**Response `204`** — No content  
**Response `404`** — Not found  
**Response `409`** — Session locked

---

### QR Meal Scan

#### `POST /api/meal-scan`
Decodes a scanned QR token and marks the student `PRESENT` in a session.

**Request body**
```json
{
  "qrToken": "{\"studentId\":\"664f…\"}",
  "mealSessionId": "665a…"
}
```

> `qrToken` is a JSON string payload containing `studentId`, as encoded in the student's QR code.

**Response `201`** — Created attendance record  
**Response `400`** — Invalid token or student not enrolled  
**Response `404`** — Session not found  
**Response `409`** — Session locked or student already scanned

---

### Meal Distribution — No-Show Alerts

#### `GET /api/meal-distribution/no-show-alerts`
Lists no-show alerts for a school.

**Query params**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `schoolId` | string | Yes | School ID |
| `dateFrom` | string | No | Start date |
| `dateTo` | string | No | End date |

**Response `200`** — Array of no-show alert objects  
**Response `400`** — Missing `schoolId`

---

### Meal Distribution — Student History

#### `GET /api/meal-distribution/student-history`
Full meal attendance history for a student.

**Query params**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `schoolId` | string | Yes | School ID |
| `studentId` | string | Yes | Student MongoDB ID |
| `dateFrom` | string | No | Start date |
| `dateTo` | string | No | End date |
| `mealType` | string | No | `breakfast`, `lunch`, `dinner` |
| `attendanceStatus` | string | No | `PRESENT` or `ABSENT` |

**Response `200`** — Array of history rows

---

### Meal Distribution — Reports

#### `GET /api/meal-distribution/reports/session-summary.pdf`
Downloads a PDF summary of all sessions for a school.

**Query params:** `schoolId` (required), `dateFrom`, `dateTo`

**Response `200`** — `Content-Type: application/pdf`

---

#### `GET /api/meal-distribution/reports/no-shows.pdf`
Downloads a PDF no-show report for a school.

**Query params:** `schoolId` (required), `dateFrom`, `dateTo`

**Response `200`** — `Content-Type: application/pdf`

---

#### `GET /api/meal-distribution/reports/session-roster.pdf`
Downloads a PDF attendance roster for a specific session.

**Query params:** `schoolId` (required), `mealSessionId` (required)

**Response `200`** — `Content-Type: application/pdf`  
**Response `403`** — Session does not belong to this school

---

### Menu Management — Recipes

#### `GET /api/recipes`
Returns all recipes.

**Response `200`** — Array of recipe objects

---

#### `POST /api/recipes`
Creates a recipe.

**Request body**
```json
{
  "name": "Pasta Primavera",
  "ingredients": [{ "name": "pasta", "quantity": 200, "unit": "g" }],
  "dietaryFlags": ["vegetarian"],
  "servings": 4
}
```

**Response `201`** — Created recipe object

---

#### `GET /api/recipes/search/ingredient?q=`
Searches recipes by ingredient name.

**Query params:** `q` — ingredient term

**Response `200`** — Matching recipe array

---

#### `GET /api/recipes/search/dietary?flags=`
Searches recipes by dietary flags.

**Query params:** `flags` — comma-separated (e.g. `vegetarian,gluten-free`)

**Response `200`** — Matching recipe array

---

#### `GET /api/recipes/:id`
Returns a single recipe.

**Response `200`** — Recipe object  
**Response `404`** — Not found

---

#### `PATCH /api/recipes/:id`
Partially updates a recipe.

**Response `200`** — Updated recipe object

---

#### `DELETE /api/recipes/:id`
Deletes a recipe.

**Response `200`** — Deletion confirmation

---

### Menu Management — Nutrition

#### `POST /api/nutrition/calculate`
Calculates total nutritional values for a list of ingredients.

**Request body**
```json
{
  "ingredients": [
    { "name": "chicken breast", "quantity": 150, "unit": "g" },
    { "name": "broccoli", "quantity": 80, "unit": "g" }
  ]
}
```

**Response `200`**
```json
{ "calories": 210, "protein": 32, "carbohydrates": 8, "fat": 5 }
```

---

### Meal Planning

#### `POST /api/meal-plans`
Creates a weekly meal plan for a school.

**Request body**
```json
{
  "schoolId": "664f…",
  "weekStartDate": "2024-06-03",
  "entries": [
    { "day": "Monday", "mealType": "lunch", "recipeId": "665b…" }
  ]
}
```

**Response `201`** — Created meal plan object

---

#### `GET /api/meal-plans/:id`
Returns a meal plan by ID.

**Response `200`** — Meal plan object  
**Response `404`** — Not found

---

#### `GET /api/meal-plans/school/:schoolId`
Returns all meal plans for a school.

**Response `200`** — Array of meal plan objects

---

#### `PUT /api/meal-plans/:id`
Updates a meal plan.

**Response `200`** — Updated meal plan object

---

#### `DELETE /api/meal-plans/:id`
Deletes a meal plan.

**Response `200`** — Deletion confirmation

---

#### `POST /api/meal-plans/:id/confirm`
Confirms a draft meal plan, locking it for use in meal sessions.

**Response `200`** — Confirmed meal plan object

---

### Inventory

#### `GET /api/inventory`
Lists inventory items with optional filters.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by category |
| `status` | string | Filter by stock status |
| `search` | string | Name text search |

**Response `200`**
```json
{ "success": true, "count": 12, "data": [{ "_id": "…", "name": "Whole Milk", "quantity": 50 }] }
```

---

#### `GET /api/inventory/stats`
Returns inventory statistics.

**Response `200`**
```json
{ "success": true, "data": { "total": 30, "lowStock": 4, "outOfStock": 1 } }
```

---

#### `GET /api/inventory/low-stock`
Returns items below their minimum stock threshold.

**Response `200`** — Filtered inventory array

---

#### `GET /api/inventory/lookup/:barcode`
Looks up product data from Open Food Facts by barcode (used for form auto-fill on the frontend).

**Response `200`** — Product metadata

---

#### `GET /api/inventory/existing-lookup?name=&barcode=`
Checks for existing items by name or barcode (duplicate-check before creating).

At least one of `name` or `barcode` is required.

**Response `200`** — Matched items or empty array

---

#### `GET /api/inventory/:id`
Returns a single inventory item.

**Response `200`** — Item object  
**Response `404`** — Not found

---

#### `POST /api/inventory`
Creates an inventory item with an optional initial batch.

**Request body**
```json
{
  "name": "Whole Milk",
  "category": "dairy",
  "unit": "litres",
  "minimumStock": 10,
  "initialBatch": { "quantity": 50, "expiryDate": "2024-07-01", "supplierId": "SUP-001" }
}
```

**Response `201`** — Created item

---

#### `POST /api/inventory/:id/batches`
Adds a stock batch to an existing item.

**Request body**
```json
{ "quantity": 30, "expiryDate": "2024-08-01", "supplierId": "SUP-002" }
```

**Response `201`** — Updated item

---

#### `DELETE /api/inventory/:id/batches/:batchId`
Removes a stock batch.

**Response `200`** — Updated item

---

#### `PUT /api/inventory/:id`
Fully replaces an inventory item.

**Response `200`** — Updated item

---

#### `PATCH /api/inventory/:id`
Partially updates an inventory item.

**Response `200`** — Updated item

---

#### `PATCH /api/inventory/:id/decrement`
Decrements an item's quantity (e.g. consumed during a meal service).

**Request body**
```json
{ "quantity": 5 }
```

**Response `200`** — Updated item

---

#### `DELETE /api/inventory/:id`
Deletes an inventory item.

**Response `200`** — Deleted item

---

### User Management

#### `PATCH /api/users/by-id/:userId/role`
Updates a user's role by MongoDB ID.

**Request body**
```json
{ "role": "admin" }
```

**Response `200`**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "tokenRefreshRequired": true,
  "data": { "_id": "…", "clerkId": "user_…", "role": "admin" }
}
```

**Response `400`** — Invalid ID or missing role  
**Response `404`** — User not found

---

#### `PATCH /api/users/by-clerk/:clerkId/role`
Updates a user's role by Clerk user ID.

**Request body**
```json
{ "role": "school-management" }
```

**Response `200`** — Same shape as above

---

### Webhooks

#### `POST /api/webhooks`
Receives Clerk user lifecycle events (`user.created`, `user.updated`, `user.deleted`) and syncs them into MongoDB.

**Headers** — `svix-id`, `svix-timestamp`, `svix-signature` (injected automatically by Clerk)

This endpoint receives the raw request body (mounted before `express.json()`) and verifies the Svix signature using `CLERK_WEBHOOK_SIGNING_SECRET`.

**Response `200`** — Event processed  
**Response `400`** — Signature verification failed

---

## Testing

### Unit Tests

Located in `backend/tests/unit-tests/`. Runner: **Jest**.

```sh
# From /backend
npm test                  # run all unit tests
npm run test:watch        # watch mode
npm test -- --verbose     # verbose output
npm test -- --testPathPattern=student.service   # single file
```

**Coverage**

| File | What is tested |
|------|---------------|
| `app-error.test.js` | `AppError` class shape and fields |
| `create-student.dto.test.js` | Field mapping and defaults |
| `update-student.dto.test.js` | Allowed-field filtering (unknown fields stripped) |
| `student-response.dto.test.js` | Response DTO shape |
| `student-query.dto.test.js` | Query param parsing and defaults |
| `student.service.test.js` | `createStudentForSchool`, `listStudentsForSchool`, `getStudent`, `updateStudent`, `deleteStudent` — repository mocked |
| `dietary.service.test.js` | Dietary profile update logic |
| `create-student.validator.test.js` | Express middleware — required fields, type checks |
| `update-student.validator.test.js` | Express middleware — partial update rules |
| `dietary.validator.test.js` | Express middleware — tag and allergen validation |

---

### Integration Tests

Integration tests are written with **Playwright** and cover end-to-end user flows through the frontend.

```sh
# From /frontend
npx playwright test              # run all integration tests
npx playwright test --ui         # run with interactive UI
npx playwright show-report       # view the HTML report
```

Flows covered include school and student management, QR code generation, meal session lifecycle, and attendance scanning.

---

### API Tests

API-level tests are maintained as a **Postman** collection covering all major endpoint groups:

- School CRUD
- Student CRUD and CSV import
- QR code generation and status updates
- Meal session lifecycle
- Meal attendance marking and roster
- Inventory management
- Meal plans

Import the collection into Postman and set the `base_url` environment variable to either `http://localhost:3000` (local) or `https://kidsfeed-api.vebula.space` (production).

---

### Testing Environment Configuration

| Variable | Recommended value |
|----------|------------------|
| `NODE_ENV` | `test` |
| `MONGODB_URI` | A dedicated test Atlas database — never the production `sliit-kidsfeed` cluster |
| `PORT` | `3001` |
| `CLERK_SECRET_KEY` | A Clerk test-environment key |

---

## Deployment

### Architecture

```
 Browser / Mobile
       │
       ▼
  Vercel (Frontend)          ←→  Clerk (Auth)
  kidsfeed.vercel.app
       │
       ▼
  Coolify on Hostinger KVM 2 (Ubuntu 24.04)
  kidsfeed-api.vebula.space
       │
       ▼
  MongoDB Atlas
  Cluster: sliit-kidsfeed
```

### Backend Deployment (Coolify + Hostinger)

The backend runs as a Node.js container managed by Coolify on a Hostinger KVM 2 VPS running Ubuntu 24.04. A custom domain (`kidsfeed-api.vebula.space`) is pointed to the VPS with HTTPS handled by Coolify's built-in Traefik proxy.

**Production start command**
```sh
NODE_ENV=production node src/app.js
```

No build step is required — the backend runs directly from source using ES modules.

**Deployment checklist**
1. All environment variables from the [Environment Variables](#environment-variables) table are set in Coolify's environment configuration.
2. `FRONTEND_ORIGINS` is set to `https://kidsfeed.vercel.app` to allow CORS from production.
3. The Clerk webhook endpoint is registered as `https://kidsfeed-api.vebula.space/api/webhooks` in the Clerk dashboard, and `CLERK_WEBHOOK_SIGNING_SECRET` is updated accordingly.

### Frontend Deployment (Vercel)

The frontend is deployed on Vercel with two environments:

| Branch | Environment | URL |
|--------|-------------|-----|
| `main` | Production | https://kidsfeed.vercel.app |
| `dev` | Staging | https://kidsfeed-git-dev-lakindus-projects.vercel.app |

Vercel automatically deploys on push to the respective branches. A `vercel.json` in the frontend root handles client-side routing rewrites.

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code quality standards, commit conventions, and git workflow.
