import { toCreateStudentData } from '../../../src/school-management/application/dtos/requests/create-student.dto.js';

describe('toCreateStudentData', () => {
  const schoolId = 'school-123';

  it('maps all body fields and attaches schoolId', () => {
    const body = {
      studentId: 'STU-001',
      firstName: 'Alice',
      lastName: 'Smith',
      age: 8,
      gradeLevel: 'Grade 3',
      photoUrl: 'https://example.com/photo.jpg',
      status: 'active',
      guardian: { name: 'Bob Smith', phone: '+1234567890' },
    };

    const result = toCreateStudentData(body, schoolId);

    expect(result.studentId).toBe('STU-001');
    expect(result.firstName).toBe('Alice');
    expect(result.lastName).toBe('Smith');
    expect(result.age).toBe(8);
    expect(result.gradeLevel).toBe('Grade 3');
    expect(result.photoUrl).toBe('https://example.com/photo.jpg');
    expect(result.status).toBe('active');
    expect(result.school).toBe(schoolId);
    expect(result.guardian).toEqual(body.guardian);
  });

  it('defaults status to "active" when not provided', () => {
    const body = { studentId: 'STU-002', firstName: 'Jane', lastName: 'Doe' };
    const result = toCreateStudentData(body, schoolId);
    expect(result.status).toBe('active');
  });

  it('attaches the provided schoolId as school field', () => {
    const result = toCreateStudentData(
      { studentId: 'S1', firstName: 'A', lastName: 'B' },
      'xyz'
    );
    expect(result.school).toBe('xyz');
  });
});
