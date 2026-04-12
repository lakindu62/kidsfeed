import { jest } from '@jest/globals';
import { validateUpdateStudent } from '../../../src/school-management/presentation/validators/update-student.validator.js';
import { AppError } from '../../../src/school-management/application/errors/app-error.js';

function makeReq(body) {
  return { body };
}

describe('validateUpdateStudent', () => {
  it('calls next() when body has no status field', () => {
    const next = jest.fn();
    validateUpdateStudent(makeReq({ firstName: 'Alice' }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when status is "active"', () => {
    const next = jest.fn();
    validateUpdateStudent(makeReq({ status: 'active' }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when status is "draft"', () => {
    const next = jest.fn();
    validateUpdateStudent(makeReq({ status: 'draft' }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(AppError) when status is invalid', () => {
    const next = jest.fn();
    validateUpdateStudent(makeReq({ status: 'invalid-status' }), {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.errors.some((e) => e.field === 'status')).toBe(true);
  });

  it('handles missing req.body gracefully', () => {
    const next = jest.fn();
    validateUpdateStudent({ body: undefined }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
});
