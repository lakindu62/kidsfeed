import { jest } from '@jest/globals';

jest.unstable_mockModule(
  '../../../src/school-management/infrastructure/repositories/student.repository.js',
  () => ({
    findStudentById: jest.fn(),
    updateStudentById: jest.fn(),
  })
);

jest.unstable_mockModule(
  '../../../src/school-management/infrastructure/services/twilio.service.js',
  () => ({
    sendGuardianSms: jest.fn().mockResolvedValue(undefined),
  })
);

const {
  findStudentById: mockFindStudentById,
  updateStudentById: mockUpdateStudentById,
} =
  await import('../../../src/school-management/infrastructure/repositories/student.repository.js');

const { sendGuardianSms: mockSendGuardianSms } =
  await import('../../../src/school-management/infrastructure/services/twilio.service.js');

const { updateDietaryProfile, updateMealEligibility } =
  await import('../../../src/school-management/application/services/dietary.service.js');

const makeStudent = (overrides = {}) => ({
  _id: 'student-1',
  studentId: 'STU-001',
  firstName: 'Alice',
  lastName: 'Smith',
  dietaryTags: [],
  mealEligibilityStatus: 'pending',
  guardian: { name: 'Bob', phone: '+1234567890', smsOptOut: false },
  school: { _id: 'school-1', schoolName: 'Lincoln Elementary' },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

// ─── updateDietaryProfile ───────────────────────────────────────────────────

describe('updateDietaryProfile', () => {
  it('throws 404 when student not found', async () => {
    mockFindStudentById.mockResolvedValue(null);
    await expect(updateDietaryProfile('bad-id', {})).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('updates dietaryTags', async () => {
    const student = makeStudent();
    const updated = makeStudent({ dietaryTags: ['Halal'] });
    mockFindStudentById.mockResolvedValue(student);
    mockUpdateStudentById.mockResolvedValue(updated);

    const result = await updateDietaryProfile('student-1', {
      dietaryTags: ['Halal'],
    });
    expect(result.dietaryTags).toEqual(['Halal']);
    expect(mockUpdateStudentById).toHaveBeenCalledWith('student-1', {
      dietaryTags: ['Halal'],
    });
  });

  it('sends SMS to guardian when dietaryTags updated and guardian has phone', async () => {
    const student = makeStudent({
      guardian: { phone: '+1234567890', smsOptOut: false },
    });
    mockFindStudentById.mockResolvedValue(student);
    mockUpdateStudentById.mockResolvedValue(
      makeStudent({ dietaryTags: ['Halal'] })
    );

    await updateDietaryProfile('student-1', { dietaryTags: ['Halal'] });

    expect(mockSendGuardianSms).toHaveBeenCalledWith(
      '+1234567890',
      expect.stringContaining('Halal')
    );
  });

  it('does not send SMS when guardian has smsOptOut=true', async () => {
    const student = makeStudent({
      guardian: { phone: '+1234567890', smsOptOut: true },
    });
    mockFindStudentById.mockResolvedValue(student);
    mockUpdateStudentById.mockResolvedValue(makeStudent());

    await updateDietaryProfile('student-1', { dietaryTags: ['Halal'] });
    expect(mockSendGuardianSms).not.toHaveBeenCalled();
  });

  it('does not send SMS when guardian has no phone', async () => {
    const student = makeStudent({ guardian: { smsOptOut: false } });
    mockFindStudentById.mockResolvedValue(student);
    mockUpdateStudentById.mockResolvedValue(makeStudent());

    await updateDietaryProfile('student-1', { dietaryTags: ['Halal'] });
    expect(mockSendGuardianSms).not.toHaveBeenCalled();
  });

  it('does not send SMS when dietaryTags not in body', async () => {
    const student = makeStudent();
    mockFindStudentById.mockResolvedValue(student);
    mockUpdateStudentById.mockResolvedValue(student);

    await updateDietaryProfile('student-1', { kitchenNotes: 'No nuts' });
    expect(mockSendGuardianSms).not.toHaveBeenCalled();
  });

  it('updates kitchenNotes when provided', async () => {
    const student = makeStudent();
    mockFindStudentById.mockResolvedValue(student);
    mockUpdateStudentById.mockResolvedValue(
      makeStudent({ kitchenNotes: 'No nuts' })
    );

    await updateDietaryProfile('student-1', { kitchenNotes: 'No nuts' });
    expect(mockUpdateStudentById).toHaveBeenCalledWith('student-1', {
      kitchenNotes: 'No nuts',
    });
  });
});

// ─── updateMealEligibility ──────────────────────────────────────────────────

describe('updateMealEligibility', () => {
  it('throws 400 for invalid status', async () => {
    await expect(
      updateMealEligibility('student-1', 'unknown')
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws 404 when student not found', async () => {
    mockFindStudentById.mockResolvedValue(null);
    await expect(
      updateMealEligibility('bad-id', 'eligible')
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('updates status to eligible', async () => {
    const student = makeStudent({ mealEligibilityStatus: 'pending' });
    const updated = makeStudent({ mealEligibilityStatus: 'eligible' });
    mockFindStudentById.mockResolvedValue(student);
    mockUpdateStudentById.mockResolvedValue(updated);

    const result = await updateMealEligibility('student-1', 'eligible');
    expect(result.mealEligibilityStatus).toBeUndefined(); // not-in-response-dto, but let's check the update call
    expect(mockUpdateStudentById).toHaveBeenCalledWith('student-1', {
      mealEligibilityStatus: 'eligible',
    });
  });

  it('sends SMS when status changes and guardian has phone', async () => {
    const student = makeStudent({
      mealEligibilityStatus: 'pending',
      guardian: { phone: '+1234567890', smsOptOut: false },
    });
    mockFindStudentById.mockResolvedValue(student);
    mockUpdateStudentById.mockResolvedValue(
      makeStudent({ mealEligibilityStatus: 'eligible' })
    );

    await updateMealEligibility('student-1', 'eligible');
    expect(mockSendGuardianSms).toHaveBeenCalledWith(
      '+1234567890',
      expect.stringContaining('eligible')
    );
  });

  it('does not send SMS when status is unchanged', async () => {
    const student = makeStudent({ mealEligibilityStatus: 'eligible' });
    mockFindStudentById.mockResolvedValue(student);
    mockUpdateStudentById.mockResolvedValue(student);

    await updateMealEligibility('student-1', 'eligible');
    expect(mockSendGuardianSms).not.toHaveBeenCalled();
  });

  it('accepts all three valid statuses', async () => {
    for (const status of ['eligible', 'not-eligible', 'pending']) {
      mockFindStudentById.mockResolvedValue(
        makeStudent({ mealEligibilityStatus: 'pending' })
      );
      mockUpdateStudentById.mockResolvedValue(makeStudent());
      await expect(
        updateMealEligibility('student-1', status)
      ).resolves.toBeDefined();
    }
  });
});
