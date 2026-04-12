import { jest } from '@jest/globals';
import { validateDietaryUpdate } from '../../../src/school-management/presentation/validators/dietary.validator.js';
import { AppError } from '../../../src/school-management/application/errors/app-error.js';
import { DIETARY_TAGS } from '../../../src/school-management/application/constants/dietary-restriction.js';

function makeReq(body) {
  return { body };
}

describe('validateDietaryUpdate', () => {
  it('calls next() when dietaryTags is a valid array of known tags', () => {
    const next = jest.fn();
    validateDietaryUpdate(
      makeReq({ dietaryTags: ['Halal', 'Vegetarian'] }),
      {},
      next
    );
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when dietaryTags is an empty array', () => {
    const next = jest.fn();
    validateDietaryUpdate(makeReq({ dietaryTags: [] }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when dietaryTags is not provided at all', () => {
    const next = jest.fn();
    validateDietaryUpdate(makeReq({ kitchenNotes: 'No nuts' }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(AppError) when dietaryTags is not an array', () => {
    const next = jest.fn();
    validateDietaryUpdate(makeReq({ dietaryTags: 'Halal' }), {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.errors.some((e) => e.field === 'dietaryTags')).toBe(true);
  });

  it('calls next(AppError) when dietaryTags contains invalid tags', () => {
    const next = jest.fn();
    validateDietaryUpdate(
      makeReq({ dietaryTags: ['Halal', 'Pizza-Free'] }),
      {},
      next
    );
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.errors[0].message).toContain('Pizza-Free');
  });

  it('accepts all defined DIETARY_TAGS', () => {
    const next = jest.fn();
    validateDietaryUpdate(makeReq({ dietaryTags: DIETARY_TAGS }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('handles missing req.body gracefully', () => {
    const next = jest.fn();
    validateDietaryUpdate({ body: undefined }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
});
