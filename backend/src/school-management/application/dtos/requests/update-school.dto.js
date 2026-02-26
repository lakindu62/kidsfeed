const toUpdateSchoolData = (body) => {
  const data = {};
  if (body.schoolName !== undefined) data.schoolName = body.schoolName;
  if (body.managerEmail !== undefined) data.managerEmail = body.managerEmail;
  if (body.districtNumber !== undefined) data.districtNumber = body.districtNumber;
  if (body.region !== undefined) data.region = body.region;
  if (body.contactName !== undefined) data.contactName = body.contactName;
  if (body.contactPhone !== undefined) data.contactPhone = body.contactPhone;
  return data;
};

export { toUpdateSchoolData };
