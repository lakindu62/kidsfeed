const toMealCardResponse = (student) => ({
  id: student._id,
  studentId: student.studentId,
  firstName: student.firstName,
  lastName: student.lastName,
  gradeLevel: student.gradeLevel,
  school: student.school
    ? { id: student.school._id, schoolName: student.school.schoolName }
    : student.school,
  qrCode: student.qrCode,
  qrStatus: student.qrStatus,
  qrGeneratedAt: student.qrGeneratedAt,
  dietaryTags: student.dietaryTags,
});

export { toMealCardResponse };
