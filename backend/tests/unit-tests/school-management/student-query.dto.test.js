import { toStudentQueryParams } from '../../../src/school-management/application/dtos/requests/student-query.dto.js';

describe('toStudentQueryParams', () => {
  it('returns defaults when query is empty', () => {
    const result = toStudentQueryParams({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.search).toBeUndefined();
    expect(result.grade).toBeUndefined();
  });

  it('parses page and limit from strings', () => {
    const result = toStudentQueryParams({ page: '3', limit: '25' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(25);
  });

  it('clamps page to minimum of 1', () => {
    expect(toStudentQueryParams({ page: '0' }).page).toBe(1);
    expect(toStudentQueryParams({ page: '-5' }).page).toBe(1);
  });

  it('caps limit at 100', () => {
    expect(toStudentQueryParams({ limit: '200' }).limit).toBe(100);
  });

  it('treats limit=0 as falsy and falls back to default of 10', () => {
    // parseInt('0') = 0 which is falsy, so the || 10 default kicks in
    expect(toStudentQueryParams({ limit: '0' }).limit).toBe(10);
  });

  it('enforces minimum limit of 1 for positive values', () => {
    expect(toStudentQueryParams({ limit: '1' }).limit).toBe(1);
  });

  it('passes through search and grade', () => {
    const result = toStudentQueryParams({ search: 'Alice', grade: 'Grade 3' });
    expect(result.search).toBe('Alice');
    expect(result.grade).toBe('Grade 3');
  });

  it('returns undefined for empty string search/grade', () => {
    const result = toStudentQueryParams({ search: '', grade: '' });
    expect(result.search).toBeUndefined();
    expect(result.grade).toBeUndefined();
  });
});
