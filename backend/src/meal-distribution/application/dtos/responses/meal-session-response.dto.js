export function toMealSessionResponse(mealSessionDoc, mealDescription) {
  if (!mealSessionDoc) {
    return null;
  }

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
    menuId: mealSessionDoc.menuId ?? null,
    recipeName: mealDescription?.recipeName ?? null,
    recipeDescription: mealDescription?.recipeDescription ?? null,
    mealNotes: mealDescription?.mealNotes ?? null,
    guardianNotificationsCompletedAt:
      mealSessionDoc.guardianNotificationsCompletedAt ?? null,
  };
}

export function toGuardianNotificationResponse(doc) {
  if (!doc) {
    return null;
  }
  return {
    id: doc._id?.toString?.() ?? null,
    mealSessionId:
      doc.mealSessionId?.toString?.() ?? String(doc.mealSessionId ?? ''),
    studentId: doc.studentId,
    guardianEmail: doc.guardianEmail ?? null,
    status: doc.status,
    skipReason: doc.skipReason ?? null,
    providerMessageId: doc.providerMessageId ?? null,
    errorMessage: doc.errorMessage ?? null,
    sentAt: doc.sentAt ?? null,
    createdAt: doc.createdAt ?? null,
  };
}
