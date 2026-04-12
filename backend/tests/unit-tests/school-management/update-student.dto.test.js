import { toUpdateStudentData } from '../../../src/school-management/application/dtos/requests/update-student.dto.js';

describe('toUpdateStudentData', () => {
  it('includes only the provided fields', () => {
    const body = { firstName: 'Charlie', gradeLevel: 'Grade 4' };
    const result = toUpdateStudentData(body);
    expect(result).toEqual({ firstName: 'Charlie', gradeLevel: 'Grade 4' });
    expect(result).not.toHaveProperty('lastName');
    expect(result).not.toHaveProperty('age');
  });

  it('returns empty object when no recognised fields are provided', () => {
    const result = toUpdateStudentData({ unknownField: 'value' });
    expect(result).toEqual({});
  });

  it('maps all allowed fields when all are present', () => {
    const body = {
      firstName: 'A',
      lastName: 'B',
      age: 10,
      gradeLevel: 'Grade 5',
      photoUrl: 'url',
      status: 'draft',
      guardian: { name: 'Parent' },
    };
    const result = toUpdateStudentData(body);
    expect(Object.keys(result)).toHaveLength(7);
    expect(result.status).toBe('draft');
  });

  it('does not include fields set to undefined', () => {
    const body = { firstName: 'Test', lastName: undefined };
    const result = toUpdateStudentData(body);
    expect(result).toHaveProperty('firstName');
    expect(result).not.toHaveProperty('lastName');
  });
});
