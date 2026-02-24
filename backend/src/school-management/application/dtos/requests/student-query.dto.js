const toStudentQueryParams = (query) => ({
  page: Math.max(1, parseInt(query.page) || 1),
  limit: Math.min(100, Math.max(1, parseInt(query.limit) || 10)),
  search: query.search || undefined,
  grade: query.grade || undefined,
});

export { toStudentQueryParams };
