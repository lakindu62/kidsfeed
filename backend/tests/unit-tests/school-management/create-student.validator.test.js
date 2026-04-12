import { jest } from '@jest/globals';
import { validateCreateStudent } from '../../../src/school-management/presentation/validators/create-student.validator.js';
import { AppError } from '../../../src/school-management/application/errors/app-error.js';

function makeReq(body) {
  return { body };
}

function makeRes() {
  return {};
}

describe('validateCreateStudent', () => {
  it('calls next() with no error when all required fields are provided', () => {
    const next = jest.fn();
    validateCreateStudent(
      makeReq({ studentId: 'STU-001', firstName: 'Alice', lastName: 'Smith' }),
      makeRes(),
      next
    );
    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('calls next(AppError) when studentId is missing', () => {
    const next = jest.fn();
    validateCreateStudent(
      makeReq({ firstName: 'Alice', lastName: 'Smith' }),
      makeRes(),
      next
    );
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.errors.some((e) => e.field === 'studentId')).toBe(true);
  });

  it('calls next(AppError) when firstName is missing', () => {
    const next = jest.fn();
    validateCreateStudent(
      makeReq({ studentId: 'STU-001', lastName: 'Smith' }),
      makeRes(),
      next
    );
    const err = next.mock.calls[0][0];
    expect(err.errors.some((e) => e.field === 'firstName')).toBe(true);
  });

  it('calls next(AppError) when lastName is missing', () => {
    const next = jest.fn();
    validateCreateStudent(
      makeReq({ studentId: 'STU-001', firstName: 'Alice' }),
      makeRes(),
      next
    );
    const err = next.mock.calls[0][0];
    expect(err.errors.some((e) => e.field === 'lastName')).toBe(true);
  });

  it('collects multiple field errors at once', () => {
    const next = jest.fn();
    validateCreateStudent(makeReq({}), makeRes(), next);
    const err = next.mock.calls[0][0];
    expect(err.errors).toHaveLength(3);
  });

  it('treats whitespace-only strings as missing', () => {
    const next = jest.fn();
    validateCreateStudent(
      makeReq({ studentId: '   ', firstName: '  ', lastName: '  ' }),
      makeRes(),
      next
    );
    const err = next.mock.calls[0][0];
    expect(err.errors).toHaveLength(3);
  });

  it('handles missing req.body gracefully', () => {
    const next = jest.fn();
    validateCreateStudent({ body: undefined }, makeRes(), next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
  });
});
