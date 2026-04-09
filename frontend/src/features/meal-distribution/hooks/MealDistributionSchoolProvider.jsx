import { useMemo } from 'react';
import { MealDistributionSchoolContext } from './mealDistributionSchoolContext';
import {
  DEFAULT_SCHOOL_ID,
  DEFAULT_SCHOOL_NAME,
} from './mealDistributionSchoolScope';

export function MealDistributionSchoolProvider({
  children,
  schoolId,
  schoolName = DEFAULT_SCHOOL_NAME,
}) {
  const value = useMemo(
    () => ({
      schoolId: schoolId || DEFAULT_SCHOOL_ID,
      schoolName,
    }),
    [schoolId, schoolName],
  );

  return (
    <MealDistributionSchoolContext.Provider value={value}>
      {children}
    </MealDistributionSchoolContext.Provider>
  );
}
