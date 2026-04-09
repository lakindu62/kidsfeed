const DEFAULT_SCHOOL_ID = 'demo-school-001';
const DEFAULT_SCHOOL_NAME = 'Assigned School';

export function getDefaultMealDistributionSchoolScope() {
  return {
    schoolId:
      import.meta.env.VITE_MEAL_DISTRIBUTION_SCHOOL_ID || DEFAULT_SCHOOL_ID,
    schoolName:
      import.meta.env.VITE_MEAL_DISTRIBUTION_SCHOOL_NAME || DEFAULT_SCHOOL_NAME,
  };
}

export { DEFAULT_SCHOOL_ID, DEFAULT_SCHOOL_NAME };
