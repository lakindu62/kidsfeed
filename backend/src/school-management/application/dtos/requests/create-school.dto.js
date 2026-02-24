const toCreateSchoolData = (body) => ({
  schoolName: body.schoolName,
  managerEmail: body.managerEmail,
  districtNumber: body.districtNumber,
  region: body.region,
  contactName: body.contactName,
  contactPhone: body.contactPhone,
});

export { toCreateSchoolData };
