import Student from '../../infrastructure/schemas/student.schema.js';
import School from '../../infrastructure/schemas/school.schema.js';
import { findSchoolById } from '../../infrastructure/repositories/school.repository.js';
import { AppError } from '../errors/app-error.js';

const getDashboardOverview = async () => {
  const schools = await School.find().lean();

  const schoolsWithCounts = await Promise.all(
    schools.map(async (school) => {
      const totalStudents = await Student.countDocuments({ school: school._id });
      return {
        id: school._id,
        schoolName: school.schoolName,
        districtNumber: school.districtNumber,
        region: school.region,
        totalStudents,
      };
    })
  );

  return schoolsWithCounts;
};

const getSchoolStats = async (schoolId) => {
  const school = await findSchoolById(schoolId);
  if (!school) throw new AppError(404, 'School not found');

  const [totalEnrollment, studentsWithDietary, pendingQr] = await Promise.all([
    Student.countDocuments({ school: schoolId }),
    Student.countDocuments({ school: schoolId, dietaryTags: { $exists: true, $not: { $size: 0 } } }),
    Student.countDocuments({ school: schoolId, qrStatus: 'pending' }),
  ]);

  const systemAlerts = [];
  if (pendingQr > 0) {
    systemAlerts.push({
      message: `${pendingQr} student${pendingQr > 1 ? 's have' : ' has'} pending QR codes not yet printed`,
      type: 'info',
    });
  }

  return {
    totalEnrollment: {
      count: totalEnrollment,
      change: null,
    },
    freeSubsidizedEligibility: null,
    dietaryRestrictions: {
      count: studentsWithDietary,
    },
    subsidyApplications: {
      pending: null,
    },
    systemAlerts,
  };
};

export { getDashboardOverview, getSchoolStats };
