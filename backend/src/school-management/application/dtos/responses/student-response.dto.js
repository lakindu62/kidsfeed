const toStudentResponse = (student) => ({
  id: student._id,
  studentId: student.studentId,
  firstName: student.firstName,
  lastName: student.lastName,
  age: student.age,
  gradeLevel: student.gradeLevel,
  photoUrl: student.photoUrl,
  status: student.status,
  school: student.school
    ? { id: student.school._id, schoolName: student.school.schoolName }
    : student.school,
  guardian: student.guardian,
  dietaryTags: student.dietaryTags,
  kitchenNotes: student.kitchenNotes,
  qrCode: student.qrCode,
  qrStatus: student.qrStatus,
  qrGeneratedAt: student.qrGeneratedAt,
  createdAt: student.createdAt,
  updatedAt: student.updatedAt,
});

export { toStudentResponse };
