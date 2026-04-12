# KidsFeed — School Meal Management System

A full-stack platform for managing school meal distribution, student dietary profiles, QR-based attendance scanning, inventory tracking, and meal planning.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Setup Instructions](#setup-instructions)
3. [Environment Variables](#environment-variables)
4. [API Endpoint Documentation](#api-endpoint-documentation)
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
5. [Authentication](#authentication)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Contributing](#contributing)

---

## Project Structure

```
kidsfeed/
├── backend/          # Node.js / Express API server (MongoDB)
│   ├── src/
│   │   ├── school-management/
│   │   ├── meal-distribution/
│   │   ├── meal-planning/
│   │   ├── menu-management/
│   │   ├── inventory/
│   │   ├── user-management/
│   │   └── shared/
│   └── tests/
│       └── unit-tests/
└── frontend/         # React / Vite application (Tailwind CSS)
```

---

## Setup Instructions

### Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Node.js | 18.x |
| npm | 9.x |
| MongoDB Atlas account | — |
| Clerk account | — |

---

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

Open `backend/.env` and fill in all required values (see [Environment Variables](#environment-variables)).

### 5. Run the Application

```sh
# Terminal 1 — Backend (from /backend)
npm run dev        # starts nodemon + ngrok on port 3000

# Terminal 2 — Frontend (from /frontend)
npm run dev        # starts Vite dev server
```

The API is available at `http://localhost:3000`.  
All API routes are prefixed with `/api`.

---

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | HTTP port the server listens on | `3000` |
| `NODE_ENV` | Runtime environment | `development` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_…` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_test_…` |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Svix signing secret for Clerk webhooks (unique per developer) | `whsec_…` |
| `USDA_API_KEY` | USDA FoodData Central API key | `abc123…` |
| `OPEN_FOOD_FACTS_BASE_URL` | Open Food Facts API base URL | `https://world.openfoodfacts.org/api/v2/product` |
| `OPEN_FOOD_FACTS_USER_AGENT` | User-agent sent to Open Food Facts | `KidsfeedApp/1.0 (dev@example.com)` |
| `FRONTEND_ORIGINS` | Comma-separated allowed CORS origins | `http://localhost:5173` |

> **Note:** `CLERK_WEBHOOK_SIGNING_SECRET` must be obtained from your personal Clerk dashboard webhook endpoint — it differs for every developer running locally.

---

## API Endpoint Documentation

All endpoints are prefixed with `/api`. The base URL for local development is `http://localhost:3000`.

### Authentication

Most endpoints currently run **without enforced authentication** (guards are in place in the middleware stack but not wired per-route by default). When auth is enforced, Clerk session tokens must be sent in the `Authorization` header:

```
Authorization: Bearer <clerk_session_token>
```

---

### School Management

#### `GET /api/schools`
Returns a list of all schools.

**Response `200`**
```json
{
  "success": true,
  "message": "Schools retrieved successfully",
  "data": [
    {
      "_id": "664f…",
      "schoolName": "Lincoln Elementary",
      "districtNumber": "D001",
      "address": "123 Main St"
    }
  ]
}
```

---

#### `GET /api/schools/:id`
Returns a single school by MongoDB ID.

**Path params:** `id` — MongoDB ObjectId

**Response `200`**
```json
{
  "success": true,
  "message": "School retrieved successfully",
  "data": { "_id": "664f…", "schoolName": "Lincoln Elementary" }
}
```

**Response `404`** — School not found

---

#### `POST /api/schools`
Creates a new school.

**Request body**
```json
{
  "schoolName": "Lincoln Elementary",
  "districtNumber": "D001",
  "address": "123 Main St"
}
```

**Response `201`**
```json
{
  "success": true,
  "message": "School created successfully",
  "data": { "_id": "664f…", "schoolName": "Lincoln Elementary" }
}
```

---

#### `PUT /api/schools/:id`
Updates an existing school.

**Request body** — any subset of school fields.

**Response `200`** — Updated school object

---

#### `DELETE /api/schools/:id`
Deletes a school.

**Response `200`** — Deletion confirmation

---

### Student Management

#### `GET /api/schools/:schoolId/students`
Lists all students for a school, with optional filters and pagination.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default `1`) |
| `limit` | number | Results per page (default `20`) |
| `status` | string | Filter by student status (`active`, `inactive`) |
| `gradeLevel` | string | Filter by grade |
| `q` | string | Search by name |

**Response `200`**
```json
{
  "success": true,
  "data": [ { "id": "…", "firstName": "Alice", "lastName": "Smith" } ],
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
**Response `404`** — Student not found

---

#### `PUT /api/students/:id`
Fully updates a student record.

**Request body** — Student fields to update.

**Response `200`** — Updated student object  
**Response `404`** — Student not found

---

#### `DELETE /api/students/:id`
Deletes a student.

**Response `200`** — Deletion confirmation  
**Response `404`** — Student not found

---

### Student Dietary & Eligibility

#### `PUT /api/students/:id/dietary`
Updates the dietary profile for a student.

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
Updates the meal eligibility status for a student.

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
Uploads a CSV file and returns a preview of what will be imported (no data is saved).

**Request** — `multipart/form-data`, field name `file`, CSV content.

**Response `200`**
```json
{
  "success": true,
  "message": "Import preview generated",
  "data": {
    "importToken": "tok_…",
    "valid": [ { "studentId": "STU-002", "firstName": "Bob" } ],
    "errors": []
  }
}
```

---

#### `POST /api/schools/:schoolId/import/confirm`
Commits a previously previewed import using the token returned from `/preview`.

**Request body**
```json
{ "importToken": "tok_…" }
```

**Response `201`**
```json
{
  "success": true,
  "message": "Successfully imported 12 students",
  "data": { "imported": 12 }
}
```

---

### QR Codes

#### `GET /api/students/:id/qr`
Generates (or retrieves) the QR code for a student.

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
Updates the QR status for a student.

**Request body**
```json
{ "status": "active" }
```

Accepted values: `active`, `inactive`, `pending`

**Response `200`** — Updated student object

---

#### `POST /api/schools/:schoolId/qr/batch`
Batch-generates QR codes for all students in a school (optionally filtered by grade).

**Query params:** `grade` (optional)

**Response `200`**
```json
{
  "success": true,
  "message": "Batch QR generation complete",
  "data": { "generated": 45, "skipped": 3 }
}
```

---

#### `GET /api/schools/:schoolId/qr/cards`
Lists all QR card data for students in a school.

**Response `200`** — Array of student QR card objects

---

### Statistics & Dashboard

#### `GET /api/dashboard/overview`
Returns system-wide summary statistics.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "totalSchools": 5,
    "totalStudents": 312,
    "activeStudents": 298
  }
}
```

---

#### `GET /api/schools/:schoolId/stats`
Returns statistics for a specific school.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "totalStudents": 80,
    "activeStudents": 76,
    "qrIssued": 70
  }
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
    "schools": [ { "_id": "…", "schoolName": "Lincoln Elementary" } ],
    "students": [ { "id": "…", "firstName": "Alice" } ]
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
Downloads a CSV of all student QR card data for a school.

**Response `200`** — `Content-Type: text/csv`

---

#### `GET /api/schools/:schoolId/qr/export/pdf`
Downloads a printable PDF of QR cards for all students in a school.

**Response `200`** — `Content-Type: application/pdf`

---

### Meal Sessions

Base path: `/api/meal-sessions`

#### `GET /api/meal-sessions`
Lists meal sessions with optional filters.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `schoolId` | string | Filter by school |
| `mealType` | string | `breakfast`, `lunch`, `dinner` |
| `date` | string | Exact date (`YYYY-MM-DD`) |
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
Lists all guardian email notifications sent for a session.

**Response `200`** — Array of notification records

---

#### `POST /api/meal-sessions`
Creates a new meal session.

**Request body**
```json
{
  "schoolId": "664f…",
  "mealType": "lunch",
  "date": "2024-06-01",
  "mealPlanId": "665a…"
}
```

**Response `201`** — Created session object  
**Response `409`** — Duplicate session for that school/date/mealType

---

#### `PUT /api/meal-sessions/:id`
Updates a meal session.

**Request body** — Meal session fields to update.

**Response `200`** — Updated session object  
**Response `404`** — Not found

---

#### `DELETE /api/meal-sessions/:id`
Deletes a meal session.

**Response `204`** — No content  
**Response `404`** — Not found

---

### Meal Attendance

Base path: `/api/meal-attendance`

#### `GET /api/meal-attendance`
Lists attendance records with optional filters.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `studentId` | string | Filter by student |
| `mealSessionId` | string | Filter by session |
| `status` | string | `PRESENT`, `ABSENT` |
| `dateFrom` | string | Start of date range |
| `dateTo` | string | End of date range |

**Response `200`** — Array of attendance records

---

#### `GET /api/meal-attendance/roster?mealSessionId=`
Returns the full attendance roster for a session (both present and absent students).

**Query params:** `mealSessionId` (required)

**Response `200`** — Array of roster entries  
**Response `400`** — `mealSessionId` missing  
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

**Response `201`** — Created attendance record  
**Response `404`** — Session not found  
**Response `409`** — Session completed (locked) or student already present  
**Response `400`** — Student not enrolled in school

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
Scans a student QR token and marks them `PRESENT` in a session automatically.

**Request body**
```json
{
  "qrToken": "{\"studentId\":\"664f…\"}",
  "mealSessionId": "665a…"
}
```

> `qrToken` is a JSON string containing `studentId`.

**Response `201`** — Created attendance record  
**Response `400`** — Invalid QR token or student not in school  
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
| `dateFrom` | string | No | Start date filter |
| `dateTo` | string | No | End date filter |

**Response `200`** — Array of no-show alert objects  
**Response `400`** — `schoolId` missing

---

### Meal Distribution — Student History

#### `GET /api/meal-distribution/student-history`
Returns meal history for a specific student.

**Query params**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `schoolId` | string | Yes | School ID |
| `studentId` | string | Yes | Student MongoDB ID |
| `dateFrom` | string | No | Start date |
| `dateTo` | string | No | End date |
| `mealType` | string | No | `breakfast`, `lunch`, `dinner` |
| `attendanceStatus` | string | No | `PRESENT`, `ABSENT` |

**Response `200`** — Array of history rows

---

### Meal Distribution — Reports

#### `GET /api/meal-distribution/reports/session-summary.pdf`
Downloads a PDF summarising all sessions for a school within a date range.

**Query params:** `schoolId` (required), `dateFrom`, `dateTo`

**Response `200`** — `Content-Type: application/pdf`

---

#### `GET /api/meal-distribution/reports/no-shows.pdf`
Downloads a PDF report of all no-shows for a school.

**Query params:** `schoolId` (required), `dateFrom`, `dateTo`

**Response `200`** — `Content-Type: application/pdf`

---

#### `GET /api/meal-distribution/reports/session-roster.pdf`
Downloads a PDF roster for a specific session.

**Query params:** `schoolId` (required), `mealSessionId` (required)

**Response `200`** — `Content-Type: application/pdf`  
**Response `403`** — Session does not belong to this school

---

### Menu Management — Recipes

Base path: `/api/recipes`

#### `GET /api/recipes`
Returns all recipes.

**Response `200`** — Array of recipe objects

---

#### `POST /api/recipes`
Creates a new recipe.

**Request body**
```json
{
  "name": "Pasta Primavera",
  "ingredients": [
    { "name": "pasta", "quantity": 200, "unit": "g" }
  ],
  "dietaryFlags": ["vegetarian"],
  "servings": 4
}
```

**Response `201`** — Created recipe object

---

#### `GET /api/recipes/search/ingredient?q=`
Searches recipes by ingredient name.

**Query params:** `q` — ingredient search term

**Response `200`** — Matching recipe array

---

#### `GET /api/recipes/search/dietary?flags=`
Searches recipes by dietary flags.

**Query params:** `flags` — comma-separated flags (e.g. `vegetarian,gluten-free`)

**Response `200`** — Matching recipe array

---

#### `GET /api/recipes/:id`
Returns a single recipe.

**Response `200`** — Recipe object  
**Response `404`** — Not found

---

#### `PATCH /api/recipes/:id`
Partially updates a recipe.

**Request body** — Any recipe fields to update.

**Response `200`** — Updated recipe object

---

#### `DELETE /api/recipes/:id`
Deletes a recipe.

**Response `200`** — Deletion confirmation

---

### Menu Management — Nutrition

#### `POST /api/nutrition/calculate`
Calculates the total nutritional values for a list of ingredients.

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
{
  "calories": 210,
  "protein": 32,
  "carbohydrates": 8,
  "fat": 5
}
```

---

### Meal Planning

Base path: `/api/meal-plans`

#### `POST /api/meal-plans`
Creates a new meal plan.

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

**Request body** — Meal plan fields to update.

**Response `200`** — Updated meal plan object

---

#### `DELETE /api/meal-plans/:id`
Deletes a meal plan.

**Response `200`** — Deletion confirmation

---

#### `POST /api/meal-plans/:id/confirm`
Confirms a draft meal plan, locking it for use in sessions.

**Response `200`** — Confirmed meal plan object

---

### Inventory

Base path: `/api/inventory`

#### `GET /api/inventory`
Lists all inventory items with optional filters.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by category |
| `status` | string | Filter by stock status |
| `search` | string | Text search on name |

**Response `200`**
```json
{
  "success": true,
  "count": 12,
  "data": [ { "_id": "…", "name": "Whole Milk", "quantity": 50 } ]
}
```

---

#### `GET /api/inventory/stats`
Returns inventory statistics (total items, low-stock count, etc.).

**Response `200`**
```json
{ "success": true, "data": { "total": 30, "lowStock": 4, "outOfStock": 1 } }
```

---

#### `GET /api/inventory/low-stock`
Returns items that are below their minimum stock threshold.

**Response `200`** — Filtered inventory array

---

#### `GET /api/inventory/lookup/:barcode`
Looks up product information from Open Food Facts by barcode (for form auto-fill).

**Path params:** `barcode` — product barcode string

**Response `200`** — Product metadata from Open Food Facts

---

#### `GET /api/inventory/existing-lookup`
Checks for existing inventory items by name or barcode (duplicate-check UX).

**Query params:** `name` or `barcode` (at least one required)

**Response `200`** — Matched inventory items (or empty array)

---

#### `GET /api/inventory/:id`
Returns a single inventory item.

**Response `200`** — Inventory item object  
**Response `404`** — Not found

---

#### `POST /api/inventory`
Creates a new inventory item with an optional initial batch.

**Request body**
```json
{
  "name": "Whole Milk",
  "category": "dairy",
  "unit": "litres",
  "minimumStock": 10,
  "initialBatch": {
    "quantity": 50,
    "expiryDate": "2024-07-01",
    "supplierId": "SUP-001"
  }
}
```

**Response `201`** — Created item object

---

#### `POST /api/inventory/:id/batches`
Adds a new stock batch to an existing item.

**Request body**
```json
{
  "quantity": 30,
  "expiryDate": "2024-08-01",
  "supplierId": "SUP-002"
}
```

**Response `201`** — Updated item object

---

#### `DELETE /api/inventory/:id/batches/:batchId`
Removes a stock batch from an item.

**Response `200`** — Updated item object

---

#### `PUT /api/inventory/:id`
Fully replaces an inventory item.

**Response `200`** — Updated item object

---

#### `PATCH /api/inventory/:id`
Partially updates an inventory item.

**Response `200`** — Updated item object

---

#### `PATCH /api/inventory/:id/decrement`
Decrements the quantity of an inventory item (e.g. after a meal is served).

**Request body**
```json
{ "quantity": 5 }
```

**Response `200`** — Updated item object

---

#### `DELETE /api/inventory/:id`
Deletes an inventory item.

**Response `200`** — Deleted item object

---

### User Management

#### `PATCH /api/users/by-id/:userId/role`
Updates a user's role, looked up by MongoDB user ID.

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

**Response `400`** — Invalid userId or missing role  
**Response `404`** — User not found

---

#### `PATCH /api/users/by-clerk/:clerkId/role`
Updates a user's role, looked up by Clerk user ID.

**Request body**
```json
{ "role": "meal_planner" }
```

**Response `200`** — Same shape as above

---

### Webhooks

#### `POST /api/webhooks`
Receives Clerk user lifecycle events (user created, updated, deleted) to keep the local MongoDB user store in sync.

**Headers required:** `svix-id`, `svix-timestamp`, `svix-signature` (injected by Clerk)

> This endpoint must receive the **raw** request body. It is mounted before `express.json()` in the app and verified using the `CLERK_WEBHOOK_SIGNING_SECRET`.

**Response `200`** — Event processed  
**Response `400`** — Signature verification failed

---

## Authentication

KidsFeed uses **[Clerk](https://clerk.com/)** for authentication.

- All protected routes require a valid Clerk session token in the `Authorization: Bearer <token>` header.
- The `clerkMiddleware()` is applied globally. Individual routes can be protected with `apiRequireAuth` + `attachUser` middleware.
- Role-based access is enforced via `requireRole([ROLES.ADMIN, ROLES.MEAL_PLANNER, …])`.
- User accounts are synced from Clerk into MongoDB automatically via the `/api/webhooks` Clerk webhook.

---

## Testing

### Unit Tests

Unit tests are located in `backend/tests/unit-tests/` and use **Jest**.

```sh
# From /backend
npm test                # run all unit tests once
npm run test:watch      # run in watch mode (re-runs on file change)
```

**Test coverage includes:**

| Module | Tests |
|--------|-------|
| `AppError` | Error class instantiation and shape |
| `CreateStudentDto` | Field mapping and validation |
| `UpdateStudentDto` | Allowed field filtering |
| `StudentResponseDto` | Response shape |
| `StudentQueryDto` | Query parameter parsing |
| `student.service` | Create, list, get, update, delete — with mocked repository |
| `dietary.service` | Dietary profile updates |
| `create-student.validator` | Express middleware validation |
| `update-student.validator` | Express middleware validation |
| `dietary.validator` | Express middleware validation |

**Example — running a single test file:**
```sh
npm test -- --testPathPattern=student.service
```

**Example — verbose output:**
```sh
npm test -- --verbose
```

---

### Integration Testing

There is no automated integration test suite currently included. Integration testing can be performed manually using **Postman** or **Insomnia**:

1. Import all endpoint URLs from the [API Endpoint Documentation](#api-endpoint-documentation) above.
2. Set a base URL variable: `{{base_url}} = http://localhost:3000`.
3. For auth-protected routes, obtain a Clerk session token from the frontend and add it as a `Bearer` token in the `Authorization` header.
4. Run each request group end-to-end in order (create → read → update → delete).

**Recommended integration test sequence:**
```
POST /api/schools           → save schoolId
POST /api/schools/:schoolId/students  → save studentId
GET  /api/schools/:schoolId/students
PUT  /api/students/:id
GET  /api/students/:id/qr
POST /api/meal-sessions
POST /api/meal-attendance
GET  /api/meal-attendance/roster?mealSessionId=…
DELETE /api/meal-sessions/:id
DELETE /api/students/:id
DELETE /api/schools/:id
```

---

### Performance Testing

Performance testing can be conducted using **[k6](https://k6.io/)** or **Apache JMeter**.

**k6 quick-start example:**

```sh
# Install k6 (macOS)
brew install k6

# Create a simple load test script (load-test.js)
# Then run:
k6 run load-test.js
```

Sample `load-test.js`:
```js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,          // 50 virtual users
  duration: '30s',  // run for 30 seconds
};

export default function () {
  const res = http.get('http://localhost:3000/api/schools');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

**Key endpoints to benchmark:**
- `GET /api/schools` — baseline read performance
- `GET /api/meal-attendance?mealSessionId=…` — paginated query performance
- `POST /api/meal-scan` — high-frequency QR scan throughput

---

### Testing Environment Configuration

| Variable | Recommended value for testing |
|----------|-------------------------------|
| `NODE_ENV` | `test` |
| `MONGODB_URI` | A **separate** test Atlas cluster or local `mongod` instance |
| `PORT` | `3001` (avoid clashing with running dev server) |
| `CLERK_SECRET_KEY` | Use a dedicated Clerk **test** environment key |

> Never run tests against a production database. Provision a dedicated test MongoDB database and set `MONGODB_URI` accordingly before executing any test suite.

---

## Deployment

### Production Build

The backend is a plain Node.js process — no build step is required.

```sh
# Start production server
NODE_ENV=production node src/app.js
```

### Recommended Deployment Platforms

| Layer | Platform |
|-------|----------|
| Backend API | **Railway**, **Render**, **Fly.io**, or any VPS |
| Frontend | **Vercel** (a `vercel.json` is already included) |
| Database | **MongoDB Atlas** |

### Environment Setup on Deployment Platform

1. Add all environment variables from the [Environment Variables](#environment-variables) table to your platform's secret/config store.
2. Set `NODE_ENV=production`.
3. Set `FRONTEND_ORIGINS` to the deployed Vercel frontend URL to allow CORS.
4. Register your deployment URL as a Clerk webhook endpoint and update `CLERK_WEBHOOK_SIGNING_SECRET`.

### Health Check

The server starts on the configured `PORT` and logs:
```
Server running on port 3000
```

Use this log line as a readiness signal in your deployment health checks.

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code quality standards, commit conventions, and git workflow.
