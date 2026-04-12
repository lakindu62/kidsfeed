import { createContext, useContext } from 'react';

export const MealDistributionSchoolContext = createContext(null);

export function useMealDistributionSchool() {
  const scope = useContext(MealDistributionSchoolContext);

  if (!scope) {
    throw new Error(
      'useMealDistributionSchool must be used within MealDistributionSchoolProvider',
    );
  }

  return scope;
}
