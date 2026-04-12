import { toStudentResponse } from '../../../src/school-management/application/dtos/responses/student-response.dto.js';
import { toStudentListResponse } from '../../../src/school-management/application/dtos/responses/student-list-response.dto.js';

const makeStudent = (overrides = {}) => ({
  _id: 'student-id-1',
  studentId: 'STU-001',
  firstName: 'Alice',
  lastName: 'Smith',
  age: 9,
  gradeLevel: 'Grade 4',
  photoUrl: null,
  status: 'active',
  school: { _id: 'school-1', schoolName: 'Lincoln Elementary' },
  guardian: { name: 'Bob Smith', phone: '+1234567890' },
  dietaryTags: ['Halal'],
  kitchenNotes: 'No nuts',
  qrCode: 'data:image/png;base64,...',
  qrStatus: 'active',
  qrGeneratedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  ...overrides,
});

describe('toStudentResponse', () => {
  it('maps all fields correctly', () => {
    const student = makeStudent();
    const result = toStudentResponse(student);

    expect(result.id).toBe('student-id-1');
    expect(result.studentId).toBe('STU-001');
    expect(result.firstName).toBe('Alice');
    expect(result.lastName).toBe('Smith');
    expect(result.gradeLevel).toBe('Grade 4');
    expect(result.status).toBe('active');
    expect(result.dietaryTags).toEqual(['Halal']);
    expect(result.kitchenNotes).toBe('No nuts');
    expect(result.qrStatus).toBe('active');
  });

  it('formats school as { id, schoolName } when school is populated', () => {
    const result = toStudentResponse(makeStudent());
    expect(result.school).toEqual({
      id: 'school-1',
      schoolName: 'Lincoln Elementary',
    });
  });

  it('passes through school as-is when it is a raw ID (not populated)', () => {
    const student = makeStudent({ school: 'school-id-raw' });
    const result = toStudentResponse(student);
    expect(result.school).toBe('school-id-raw');
  });

  it('does not expose internal _id field', () => {
    const result = toStudentResponse(makeStudent());
    expect(result).not.toHaveProperty('_id');
  });
});

describe('toStudentListResponse', () => {
  it('wraps student array and computes pagination', () => {
    const students = [
      makeStudent(),
      makeStudent({ _id: 'student-id-2', studentId: 'STU-002' }),
    ];
    const result = toStudentListResponse(students, 20, 2, 10);

    expect(result.data).toHaveLength(2);
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.total).toBe(20);
    expect(result.pagination.totalPages).toBe(2);
  });

  it('maps each student through toStudentResponse', () => {
    const students = [makeStudent()];
    const result = toStudentListResponse(students, 1, 1, 10);
    expect(result.data[0]).toHaveProperty('id');
    expect(result.data[0]).not.toHaveProperty('_id');
  });

  it('calculates totalPages correctly with partial last page', () => {
    const result = toStudentListResponse([], 25, 1, 10);
    expect(result.pagination.totalPages).toBe(3);
  });
});
