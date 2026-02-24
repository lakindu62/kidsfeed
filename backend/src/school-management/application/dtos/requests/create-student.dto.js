const toCreateStudentData = (body, schoolId) => ({
  studentId: body.studentId,
  firstName: body.firstName,
  lastName: body.lastName,
  age: body.age,
  gradeLevel: body.gradeLevel,
  photoUrl: body.photoUrl,
  status: body.status || 'active',
  school: schoolId,
  guardian: body.guardian,
});

export { toCreateStudentData };
