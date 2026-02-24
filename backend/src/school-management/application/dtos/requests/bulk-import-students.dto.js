const toBulkStudentData = (row, schoolId) => ({
  studentId: row.studentId,
  firstName: row.firstName,
  lastName: row.lastName,
  gradeLevel: row.gradeLevel,
  age: row.age ? parseInt(row.age, 10) : undefined,
  status: row.status || 'active',
  school: schoolId,
  guardian: {
    name: row.guardianName,
    phone: row.guardianPhone,
    email: row.guardianEmail,
    emergencyContactName: row.emergencyContactName,
    emergencyContactPhone: row.emergencyContactPhone,
  },
});

export { toBulkStudentData };
