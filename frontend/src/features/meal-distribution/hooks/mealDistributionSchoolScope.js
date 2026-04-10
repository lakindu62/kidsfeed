const DEFAULT_SCHOOL_ID = 'demo-school-001';
const DEFAULT_SCHOOL_NAME = 'Assigned School';

const MONGO_OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

/** True when the id looks like a MongoDB ObjectId (24 hex chars). */
export function isLikelyMongoSchoolId(id) {
  return typeof id === 'string' && MONGO_OBJECT_ID_RE.test(id.trim());
}

/** Display label for headers (name only; school id stays in env for API calls). */
export function formatMealDistributionSchoolSubtitle(schoolName) {
  return (schoolName && String(schoolName).trim()) || DEFAULT_SCHOOL_NAME;
}

function envString(key) {
  const v = import.meta.env[key];
  if (typeof v !== 'string') return '';
  const t = v.trim();
  return t;
}

export function getDefaultMealDistributionSchoolScope() {
  const schoolId =
    envString('VITE_MEAL_DISTRIBUTION_SCHOOL_ID') || DEFAULT_SCHOOL_ID;
  const schoolName =
    envString('VITE_MEAL_DISTRIBUTION_SCHOOL_NAME') || DEFAULT_SCHOOL_NAME;
  return { schoolId, schoolName };
}

export { DEFAULT_SCHOOL_ID, DEFAULT_SCHOOL_NAME };
