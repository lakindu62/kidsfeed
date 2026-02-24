const toSchoolResponse = (school) => ({
  id: school._id,
  schoolName: school.schoolName,
  managerEmail: school.managerEmail,
  districtNumber: school.districtNumber,
  region: school.region,
  contactName: school.contactName,
  contactPhone: school.contactPhone,
  totalStudents: school.totalStudents ?? 0,
  createdAt: school.createdAt,
  updatedAt: school.updatedAt,
});

export { toSchoolResponse };
