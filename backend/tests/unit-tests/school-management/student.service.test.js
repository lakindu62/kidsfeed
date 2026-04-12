import { jest } from '@jest/globals';

// --- Mock dependencies before importing the service ---
jest.unstable_mockModule(
  '../../../src/school-management/infrastructure/repositories/student.repository.js',
  () => ({
    createStudent: jest.fn(),
    findStudentById: jest.fn(),
    findStudentsBySchool: jest.fn(),
    updateStudentById: jest.fn(),
    deleteStudentById: jest.fn(),
    findByStudentId: jest.fn(),
  })
);

jest.unstable_mockModule(
  '../../../src/school-management/infrastructure/repositories/school.repository.js',
  () => ({
    findSchoolById: jest.fn(),
  })
);

const {
  createStudent: mockCreateStudent,
  findStudentById: mockFindStudentById,
  findStudentsBySchool: mockFindStudentsBySchool,
  updateStudentById: mockUpdateStudentById,
  deleteStudentById: mockDeleteStudentById,
  findByStudentId: mockFindByStudentId,
} = await import('../../../src/school-management/infrastructure/repositories/student.repository.js');

const { findSchoolById: mockFindSchoolById } =
  await import('../../../src/school-management/infrastructure/repositories/school.repository.js');

const {
  createStudentForSchool,
  listStudentsForSchool,
  getStudent,
  updateStudent,
  deleteStudent,
} =
  await import('../../../src/school-management/application/services/student.service.js');

const { AppError } =
  await import('../../../src/school-management/application/errors/app-error.js');

// --- Helpers ---
const makeSchool = () => ({
  _id: 'school-1',
  schoolName: 'Lincoln Elementary',
});
const makeStudent = (overrides = {}) => ({
  _id: 'student-1',
  studentId: 'STU-001',
  firstName: 'Alice',
  lastName: 'Smith',
  age: 9,
  gradeLevel: 'Grade 4',
  status: 'active',
  school: makeSchool(),
  dietaryTags: [],
  qrStatus: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

// ─── createStudentForSchool ─────────────────────────────────────────────────

describe('createStudentForSchool', () => {
  it('throws 404 when school does not exist', async () => {
    mockFindSchoolById.mockResolvedValue(null);
    await expect(createStudentForSchool('bad-id', {})).rejects.toMatchObject({
      statusCode: 404,
      message: 'School not found',
    });
  });

  it('throws 409 when studentId already exists', async () => {
    mockFindSchoolById.mockResolvedValue(makeSchool());
    mockFindByStudentId.mockResolvedValue(makeStudent());
    await expect(
      createStudentForSchool('school-1', { studentId: 'STU-001' })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Student ID already exists',
    });
  });

  it('creates and returns the student when valid', async () => {
    const school = makeSchool();
    const student = makeStudent();
    mockFindSchoolById.mockResolvedValue(school);
    mockFindByStudentId.mockResolvedValue(null);
    mockCreateStudent.mockResolvedValue(student);

    const result = await createStudentForSchool('school-1', {
      studentId: 'STU-001',
      firstName: 'Alice',
      lastName: 'Smith',
    });

    expect(mockCreateStudent).toHaveBeenCalledTimes(1);
    expect(result.studentId).toBe('STU-001');
    expect(result.firstName).toBe('Alice');
  });
});

// ─── listStudentsForSchool ──────────────────────────────────────────────────

describe('listStudentsForSchool', () => {
  it('throws 404 when school does not exist', async () => {
    mockFindSchoolById.mockResolvedValue(null);
    await expect(listStudentsForSchool('bad-id', {})).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('returns paginated student list', async () => {
    mockFindSchoolById.mockResolvedValue(makeSchool());
    mockFindStudentsBySchool.mockResolvedValue({
      data: [makeStudent()],
      total: 1,
    });

    const result = await listStudentsForSchool('school-1', {
      page: '1',
      limit: '10',
    });

    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.page).toBe(1);
  });
});

// ─── getStudent ─────────────────────────────────────────────────────────────

describe('getStudent', () => {
  it('throws 404 when student does not exist', async () => {
    mockFindStudentById.mockResolvedValue(null);
    await expect(getStudent('bad-id')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('returns student response when found', async () => {
    mockFindStudentById.mockResolvedValue(makeStudent());
    const result = await getStudent('student-1');
    expect(result.id).toBeDefined();
    expect(result.firstName).toBe('Alice');
  });
});

// ─── updateStudent ──────────────────────────────────────────────────────────

describe('updateStudent', () => {
  it('throws 404 when student not found after update', async () => {
    mockUpdateStudentById.mockResolvedValue(null);
    await expect(
      updateStudent('bad-id', { firstName: 'Bob' })
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('returns updated student when successful', async () => {
    const updated = makeStudent({ firstName: 'Bob' });
    mockUpdateStudentById.mockResolvedValue(updated);

    const result = await updateStudent('student-1', { firstName: 'Bob' });
    expect(result.firstName).toBe('Bob');
  });

  it('only passes allowed fields to repository', async () => {
    mockUpdateStudentById.mockResolvedValue(makeStudent());
    await updateStudent('student-1', { firstName: 'Bob', unknownField: 'x' });

    const callArg = mockUpdateStudentById.mock.calls[0][1];
    expect(callArg).toHaveProperty('firstName');
    expect(callArg).not.toHaveProperty('unknownField');
  });
});

// ─── deleteStudent ──────────────────────────────────────────────────────────

describe('deleteStudent', () => {
  it('throws 404 when student does not exist', async () => {
    mockDeleteStudentById.mockResolvedValue(null);
    await expect(deleteStudent('bad-id')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('resolves without error when deletion succeeds', async () => {
    mockDeleteStudentById.mockResolvedValue(makeStudent());
    await expect(deleteStudent('student-1')).resolves.toBeUndefined();
  });
});
