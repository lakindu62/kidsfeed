import { toStudentResponse } from './student-response.dto.js';

const toStudentListResponse = (data, total, page, limit) => ({
  data: data.map(toStudentResponse),
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
});

export { toStudentListResponse };
