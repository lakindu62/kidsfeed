const toUpdateStudentData = (body) => {
  const data = {};
  const fields = ['firstName', 'lastName', 'age', 'gradeLevel', 'photoUrl', 'status', 'guardian'];
  for (const field of fields) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
};

export { toUpdateStudentData };
