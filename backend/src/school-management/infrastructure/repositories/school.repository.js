import School from '../schemas/school.schema.js';

const createSchool = async (data) => {
  return await School.create(data);
};

const findAllSchools = async () => {
  return await School.find().populate('totalStudents');
};

const findSchoolById = async (id) => {
  return await School.findById(id).populate('totalStudents');
};

const updateSchoolById = async (id, data) => {
  return await School.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteSchoolById = async (id) => {
  return await School.findByIdAndDelete(id);
};

export { createSchool, findAllSchools, findSchoolById, updateSchoolById, deleteSchoolById };
