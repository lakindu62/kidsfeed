export function toMealSessionResponse(mealSessionDoc) {
  if (!mealSessionDoc) return null;

  return {
    id: mealSessionDoc._id?.toString?.() ?? null,
    date: mealSessionDoc.date,
    mealType: mealSessionDoc.mealType,
    schoolId: mealSessionDoc.schoolId,
    grade: mealSessionDoc.grade,
    className: mealSessionDoc.className,
    plannedHeadcount: mealSessionDoc.plannedHeadcount,
    actualServedCount: mealSessionDoc.actualServedCount,
    wastageCount: mealSessionDoc.wastageCount,
    status: mealSessionDoc.status,
  };
}

