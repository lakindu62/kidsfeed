# School Management — Remaining Screens Implementation Prompt

Use this document as a self-contained brief to implement the remaining screens for the School Management feature. Read it fully before writing any code.

---

## Context

### Codebase Location
- Frontend root: `frontend/src/features/school-management/`
- Backend is already fully implemented and running at the API base resolved by `resolveApiBaseUrl()`.

### Already Implemented
- `screens/SchoolOverviewScreen.jsx` — lists all schools in a card grid (`/school-management`)
- `layouts/SchoolManagementLayout.jsx` — wraps all screens with sidebar + topbar
- `components/SchoolCard.jsx` — renders a single school card
- `components/AddSchoolCard.jsx` — placeholder "add" tile
- `api/index.js` — contains `fetchSchools({ getToken })`
- `routes.jsx` — currently renders `SchoolOverviewScreen` only

### Layout Pattern (do not change this)
```jsx
<SchoolManagementLayout activeItemKey="<key>" totalFacilities={count}>
  {/* screen content */}
</SchoolManagementLayout>
```
- `activeItemKey` matches sidebar item keys: `'dashboard'`, `'schools'`, `'reports'`
- `FeatureTopBar` inside the layout accepts `query` and `onQueryChange` props for search — pass these through via layout props if you need a search bar
- Import `fetchApi` from `../../../lib/api-client` and `resolveApiBaseUrl` from `../../../lib/resolve-api-base`
- Auth token: `const { getToken } = useAuth()` from `@clerk/clerk-react`

### Styling Conventions (must follow exactly)
- Primary green: `#006117` (buttons), `#166534` (headings), `#083d11` (active text)
- Background: `#f6f8f6` (layout), `#f5f5f4` (sidebar)
- Cards: `rounded-3xl border border-[#e2e8f0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]`
- Typography classes: `.typography-h2`, `.typography-body`, `.typography-body-sm`, `.typography-body-lg`
- Buttons: rounded-3xl pill style with `px-6 py-3 text-xs font-medium`
- Primary CTA: `bg-[#006117] text-white hover:bg-[#005414] rounded-xl px-4 text-sm font-semibold`
- Skeleton loading: `animate-pulse rounded-3xl bg-white border border-[#e2e8f0] h-[<n>px]`

### Data Fetching Pattern (must follow exactly)
```js
useEffect(() => {
  let cancelled = false;
  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSomething({ getToken });
      if (!cancelled) setState(data);
    } catch (err) {
      if (!cancelled) setError(err.message ?? 'Failed to load');
    } finally {
      if (!cancelled) setLoading(false);
    }
  }
  load();
  return () => { cancelled = true; };
}, [getToken]);
```

### API Client Pattern
```js
export async function fetchSomething({ getToken, ...params } = {}) {
  const url = new URL('/api/path', resolveApiBaseUrl());
  const response = await fetchApi({ url: url.toString(), getToken });
  if (!response.ok) throw new Error(`Failed: ${response.status}`);
  return (await response.json()).data;
}

// For mutations (POST/PUT/DELETE):
export async function mutate({ getToken, body, method = 'POST' } = {}) {
  const url = new URL('/api/path', resolveApiBaseUrl());
  const response = await fetchApi({
    url: url.toString(),
    getToken,
    options: { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  });
  if (!response.ok) throw new Error(`Failed: ${response.status}`);
  return (await response.json()).data;
}
```

---

## Backend API Reference

### Schools
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/schools` | List all schools |
| POST | `/api/schools` | Create school — body: `{ schoolName, managerEmail, districtNumber, region? }` |
| PUT | `/api/schools/:id` | Update school — body: any of the above fields |
| DELETE | `/api/schools/:id` | Delete school |

### Students
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/schools/:schoolId/students` | List students (supports `?q=` search query param) |
| POST | `/api/schools/:schoolId/students` | Create student — body: `{ studentId, firstName, lastName, gradeLevel?, dietaryTags?, mealEligibilityStatus? }` |
| GET | `/api/students/:id` | Get single student |
| PUT | `/api/students/:id` | Update student — body: `{ status: 'active'|'draft', ...other fields }` |
| DELETE | `/api/students/:id` | Delete student |
| PUT | `/api/students/:id/dietary` | Update dietary — body: `{ dietaryTags: string[] }` |

### Student Import (CSV)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/schools/:schoolId/import/template` | Download CSV template (returns `text/csv` file) |
| POST | `/api/schools/:schoolId/import/preview` | Upload CSV (multipart `file` field) — returns `{ valid: [], invalid: [], importToken }` |
| POST | `/api/schools/:schoolId/import/confirm` | Confirm import — body: `{ importToken }` — returns `{ imported: number }` |

### QR Codes
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/students/:id/qr` | Get student QR code data |
| PUT | `/api/students/:id/qr/status` | Toggle QR — body: `{ status: 'enabled'|'disabled' }` |
| POST | `/api/schools/:schoolId/qr/batch` | Batch generate — optional `?grade=` query |
| GET | `/api/schools/:schoolId/qr/cards` | List QR meal cards |

### Stats & Search & Export
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/dashboard/overview` | District-wide stats object |
| GET | `/api/schools/:schoolId/stats` | Per-school stats object |
| GET | `/api/search?q=<query>` | Global search — returns `{ schools: [], students: [] }` |
| GET | `/api/schools/:schoolId/export/district-report` | PDF blob |
| GET | `/api/schools/:schoolId/qr/export/csv` | CSV blob |
| GET | `/api/schools/:schoolId/qr/export/pdf` | PDF blob |

### Dietary Tags (valid values)
```js
['Vegetarian', 'Halal', 'Nut Allergy', 'Dairy-Free', 'Gluten-Free']
```

---

## Screens to Build

### Screen 1 — Schools Screen (`/school-management/schools`)

**File**: `screens/SchoolsScreen.jsx`  
**Active key**: `'schools'`

**Layout**: Full `SchoolManagementLayout` with a data table of schools.

**Features**:
1. **Schools table** — columns: School Name, District, Region, Manager Email, Student Count, Last Updated, Actions (Edit | Delete)
2. **Add School button** (top-right) — opens `SchoolFormModal` in create mode
3. **Edit** — opens `SchoolFormModal` in edit mode, pre-filled
4. **Delete** — inline confirmation (e.g. `window.confirm` is acceptable) → DELETE `/api/schools/:id` → refresh list
5. **View Students button** per row — navigates to `/school-management/schools/:schoolId/students`
6. **Search** — pass `query`/`onQueryChange` to layout's topbar; filter school list client-side by name

**Components to create**:
- `components/SchoolFormModal.jsx` — modal with fields:
  - School Name (required)
  - Manager Email (required, email format)
  - District Number (required)
  - Region (optional)
  - Submit calls POST or PUT based on mode
  - Show field-level error messages from API response `errors[]` array

---

### Screen 2 — Students Screen (`/school-management/schools/:schoolId/students`)

**File**: `screens/StudentsScreen.jsx`  
**Active key**: `'schools'`

**Layout**: `SchoolManagementLayout` with breadcrumb `[Dashboard → Schools → {schoolName} Students]`

**Features**:
1. **Students table** — columns: Student ID, Name, Grade, Dietary Tags (badges), Meal Eligibility, QR Status, Actions (Edit | Dietary | Delete)
2. **Add Student button** — opens `StudentFormModal` in create mode
3. **Edit** — opens `StudentFormModal` in edit mode
4. **Delete** — confirm → DELETE `/api/students/:id` → refresh
5. **Dietary quick-edit** — button opens `DietaryModal` (checkboxes for each tag) → PUT `/api/students/:id/dietary`
6. **CSV Import button** — opens `CsvImportWizard`
7. **Search** — pass query to `?q=` param on the GET students call

**Components to create**:
- `components/StudentFormModal.jsx` — fields:
  - Student ID (required on create, read-only on edit)
  - First Name (required)
  - Last Name (required)
  - Grade Level (text input, optional)
  - Meal Eligibility Status (select: `eligible` | `not-eligible` | `pending`)
- `components/DietaryModal.jsx` — checkbox list of `DIETARY_TAGS`, PUT on save
- `components/CsvImportWizard.jsx` — 3-step wizard:
  - **Step 1**: Show template column info + "Download Template" link (trigger GET `/api/schools/:schoolId/import/template` as file download)
  - **Step 2**: File picker (accept `.csv`) → POST multipart to `/api/schools/:schoolId/import/preview` → show results table with valid/invalid rows
  - **Step 3**: "Confirm Import" → POST `/api/schools/:schoolId/import/confirm` with `importToken` → show success count

---

### Screen 3 — QR Codes Screen (`/school-management/schools/:schoolId/qr`)

**File**: `screens/QrCodeScreen.jsx`  
**Active key**: `'schools'`

**Layout**: `SchoolManagementLayout` with breadcrumb `[Schools → {schoolName} → QR Codes]`

**Features**:
1. **QR Cards list** — GET `/api/schools/:schoolId/qr/cards` → table/grid showing student name, QR status badge, actions
2. **Toggle QR Status** per student — PUT `/api/students/:id/qr/status` with `{ status: 'enabled'|'disabled' }` → optimistic update
3. **View QR Code** — GET `/api/students/:id/qr` → display QR image in a modal (the response will contain a `qrCode` field which is a data URL or base64 string — render as `<img src={qrCode} />`)
4. **Batch Generate** — button "Generate All QR Codes" → POST `/api/schools/:schoolId/qr/batch` → show success toast/alert with count
5. **Export CSV** — button → GET `/api/schools/:schoolId/qr/export/csv` → trigger file download
6. **Export PDF** — button → GET `/api/schools/:schoolId/qr/export/pdf` → trigger file download

**File download helper** (create once, reuse):
```js
async function downloadFile({ getToken, url, filename }) {
  const response = await fetchApi({ url, getToken });
  const blob = await response.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}
```

**Components to create**:
- `components/QrCodeModal.jsx` — modal showing `<img src={qrCode} />` and student name, with a "Close" button

---

### Screen 4 — Reports Screen (`/school-management/reports`)

**File**: `screens/ReportsScreen.jsx`  
**Active key**: `'reports'`

**Layout**: `SchoolManagementLayout`

**Features**:
1. **District overview stats** — GET `/api/dashboard/overview` → render stat cards (e.g. Total Schools, Total Students, Eligible Students). Use a `StatCard` component: value + label + optional icon.
2. **School selector** — dropdown of schools (reuse `fetchSchools`) → on select, fetch `/api/schools/:schoolId/stats` and display breakdown.
3. **School stats view** — show what the API returns (likely: `{ totalStudents, eligibleStudents, qrEnabled, qrDisabled, ... }`) as stat cards or a small table.
4. **Export District Report** — for the selected school: button → download PDF from `/api/schools/:schoolId/export/district-report`
5. **Global Search** — search bar via `onQueryChange` topbar → GET `/api/search?q=<query>` → show results as two groups (Schools, Students) in a dropdown or results panel below the topbar.

---

## Routing Changes Required

Update `routes.jsx`:
```jsx
import { Routes, Route } from 'react-router-dom';
import SchoolOverviewScreen from './screens/SchoolOverviewScreen';
import SchoolsScreen from './screens/SchoolsScreen';
import StudentsScreen from './screens/StudentsScreen';
import QrCodeScreen from './screens/QrCodeScreen';
import ReportsScreen from './screens/ReportsScreen';

export const schoolManagementPath = '/school-management';

export function SchoolManagementRoute() {
  return (
    <Routes>
      <Route index element={<SchoolOverviewScreen />} />
      <Route path="schools" element={<SchoolsScreen />} />
      <Route path="schools/:schoolId/students" element={<StudentsScreen />} />
      <Route path="schools/:schoolId/qr" element={<QrCodeScreen />} />
      <Route path="reports" element={<ReportsScreen />} />
    </Routes>
  );
}
```

Also update `SchoolCard.jsx` so the "View Details" button navigates to `/school-management/schools/:id/students` using `useNavigate`.

---

## Sidebar Update Required

Update `src/lib/sidebar/configs/school-management.config.js` to add a QR Codes entry if you want it in the nav (optional — it can also only be accessible from the Schools screen):

```js
{
  key: 'qr',
  label: 'QR Codes',
  to: '/school-management/qr',  // or omit if QR is per-school only
  icon: QrCode,  // from lucide-react
}
```

---

## API Functions to Add in `api/index.js`

Add these alongside the existing `fetchSchools`:

```js
// Schools
createSchool({ getToken, body })        // POST /api/schools
updateSchool({ getToken, id, body })    // PUT /api/schools/:id
deleteSchool({ getToken, id })          // DELETE /api/schools/:id

// Students
fetchStudents({ getToken, schoolId, q })      // GET /api/schools/:schoolId/students?q=
fetchStudent({ getToken, id })                 // GET /api/students/:id
createStudent({ getToken, schoolId, body })    // POST /api/schools/:schoolId/students
updateStudent({ getToken, id, body })          // PUT /api/students/:id
deleteStudent({ getToken, id })               // DELETE /api/students/:id
updateDietary({ getToken, id, dietaryTags })  // PUT /api/students/:id/dietary

// Import
downloadImportTemplate({ getToken, schoolId }) // GET (returns response for download)
previewImport({ getToken, schoolId, file })    // POST multipart
confirmImport({ getToken, schoolId, importToken }) // POST

// QR
fetchStudentQr({ getToken, id })              // GET /api/students/:id/qr
updateQrStatus({ getToken, id, status })      // PUT /api/students/:id/qr/status
batchGenerateQr({ getToken, schoolId, grade? }) // POST
fetchQrCards({ getToken, schoolId })          // GET /api/schools/:schoolId/qr/cards

// Stats & search
fetchDashboardOverview({ getToken })          // GET /api/dashboard/overview
fetchSchoolStats({ getToken, schoolId })      // GET /api/schools/:schoolId/stats
globalSearch({ getToken, q })                 // GET /api/search?q=

// Exports (return raw Response for blob handling)
exportDistrictReport({ getToken, schoolId })  // GET — PDF
exportQrCsv({ getToken, schoolId })           // GET — CSV
exportQrPdf({ getToken, schoolId })           // GET — PDF
```

---

## Implementation Order (recommended)

1. Add all API functions to `api/index.js`
2. Update `routes.jsx`
3. Build `SchoolsScreen` + `SchoolFormModal`
4. Build `StudentsScreen` + `StudentFormModal` + `DietaryModal`
5. Build `CsvImportWizard`
6. Build `QrCodeScreen` + `QrCodeModal`
7. Build `ReportsScreen`
8. Fix `SchoolCard` navigation
9. Update sidebar config if adding QR nav item

---

## Error Display Pattern

Parse backend errors from the response body:
```js
const payload = await response.json();
// payload.errors is an array of { field, message } objects
// payload.message is the top-level message string
setError(payload.message ?? 'Something went wrong');
setFieldErrors(Object.fromEntries((payload.errors ?? []).map(e => [e.field, e.message])));
```

Show field errors inline below each input. Show top-level error as a red alert banner.

---

## Dietary Tags Constant (copy into frontend)

```js
export const DIETARY_TAGS = ['Vegetarian', 'Halal', 'Nut Allergy', 'Dairy-Free', 'Gluten-Free'];
```

Put this in `src/features/school-management/constants.js`.
