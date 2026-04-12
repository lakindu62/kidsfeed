import { AppError } from '../../../src/school-management/application/errors/app-error.js';

describe('AppError', () => {
  it('sets statusCode, message, and defaults errors to []', () => {
    const err = new AppError(404, 'Not found');
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.errors).toEqual([]);
  });

  it('accepts a custom errors array', () => {
    const errors = [{ field: 'name', message: 'Required' }];
    const err = new AppError(400, 'Validation failed', errors);
    expect(err.statusCode).toBe(400);
    expect(err.errors).toEqual(errors);
  });

  it('is instanceof Error', () => {
    expect(new AppError(500, 'Internal')).toBeInstanceOf(Error);
  });
});
