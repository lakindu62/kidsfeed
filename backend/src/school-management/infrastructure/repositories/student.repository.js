import Student from '../schemas/student.schema.js';

const createStudent = async (data) => {
  return await Student.create(data);
};

const findByStudentId = async (studentId) => {
  return await Student.findOne({ studentId }).populate('school');
};

const findStudentById = async (id) => {
  return await Student.findById(id).populate('school');
};

const findStudentsBySchool = async (schoolId, { page = 1, limit = 10, search, grade } = {}) => {
  const query = { school: schoolId };

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ firstName: regex }, { lastName: regex }, { studentId: regex }];
  }
  if (grade) {
    query.gradeLevel = grade;
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Student.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('school'),
    Student.countDocuments(query),
  ]);

  return { data, total };
};

const updateStudentById = async (id, data) => {
  return await Student.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('school');
};

const deleteStudentById = async (id) => {
  return await Student.findByIdAndDelete(id);
};

const findStudentsBySchoolForQr = async (schoolId, { grade, qrStatus } = {}) => {
  const query = { school: schoolId };
  if (grade) query.gradeLevel = grade;
  if (qrStatus) query.qrStatus = qrStatus;
  return await Student.find(query).populate('school');
};

const countStudentsBySchool = async (schoolId) => {
  return await Student.countDocuments({ school: schoolId });
};

const searchStudents = async (searchTerm) => {
  const regex = new RegExp(searchTerm, 'i');
  return await Student.find({
    $or: [{ firstName: regex }, { lastName: regex }, { studentId: regex }],
  })
    .limit(20)
    .populate('school');
};

const bulkCreateStudents = async (students) => {
  return await Student.insertMany(students, { ordered: false });
};

export {
  createStudent,
  findByStudentId,
  findStudentById,
  findStudentsBySchool,
  updateStudentById,
  deleteStudentById,
  findStudentsBySchoolForQr,
  countStudentsBySchool,
  searchStudents,
  bulkCreateStudents,
};
