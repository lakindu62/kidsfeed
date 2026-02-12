import Student from '../schemas/student.schema.js';

const findByStudentId = async (studentId) => {
  return await Student.findOne({ studentId });
};

export { findByStudentId };
