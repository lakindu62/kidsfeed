import { parseCSVBuffer } from '../../infrastructure/services/csv-parser.service.js';
import { findByStudentId, bulkCreateStudents } from '../../infrastructure/repositories/student.repository.js';
import { findSchoolById } from '../../infrastructure/repositories/school.repository.js';
import { toBulkStudentData } from '../dtos/requests/bulk-import-students.dto.js';
import { AppError } from '../errors/app-error.js';

// In-memory store for import sessions (keyed by importToken)
const importSessions = new Map();

const VALID_STATUSES = ['active', 'draft'];

const validateRow = async (row, rowIndex, existingIds) => {
  const errors = [];

  if (!row.firstName || row.firstName.trim() === '') {
    errors.push({ row: rowIndex, field: 'firstName', message: 'First name is required' });
  }
  if (!row.lastName || row.lastName.trim() === '') {
    errors.push({ row: rowIndex, field: 'lastName', message: 'Last name is required' });
  }
  if (!row.studentId || row.studentId.trim() === '') {
    errors.push({ row: rowIndex, field: 'studentId', message: 'Student ID is required' });
  } else if (existingIds.has(row.studentId)) {
    errors.push({ row: rowIndex, field: 'studentId', message: 'Duplicate student ID' });
  }
  if (row.status && !VALID_STATUSES.includes(row.status)) {
    errors.push({ row: rowIndex, field: 'status', message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  return errors;
};

const previewImport = async (schoolId, fileBuffer) => {
  const school = await findSchoolById(schoolId);
  if (!school) throw new AppError(404, 'School not found');

  const rows = await parseCSVBuffer(fileBuffer);

  const allErrors = [];
  const validRows = [];
  const seenIds = new Set();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-based + header row

    // Check for duplicate within the file itself
    if (row.studentId && seenIds.has(row.studentId)) {
      allErrors.push({ row: rowNum, field: 'studentId', message: 'Duplicate student ID in file' });
      continue;
    }

    // Check existing in DB
    const existingInDb = row.studentId ? await findByStudentId(row.studentId) : null;
    const existingIds = new Set();
    if (existingInDb) existingIds.add(row.studentId);

    const rowErrors = await validateRow(row, rowNum, existingIds);

    if (rowErrors.length > 0) {
      allErrors.push(...rowErrors);
    } else {
      if (row.studentId) seenIds.add(row.studentId);
      validRows.push(row);
    }
  }

  const importToken = `${schoolId}-${Date.now()}`;
  importSessions.set(importToken, { schoolId, validRows, expiresAt: Date.now() + 30 * 60 * 1000 });

  return {
    importToken,
    totalRows: rows.length,
    validRows: validRows.length,
    errorCount: allErrors.length,
    preview: validRows.slice(0, 5),
    errors: allErrors,
  };
};

const confirmImport = async (schoolId, importToken) => {
  const session = importSessions.get(importToken);
  if (!session) throw new AppError(400, 'Import session not found or expired');
  if (session.schoolId !== schoolId) throw new AppError(403, 'Import token does not match school');
  if (Date.now() > session.expiresAt) {
    importSessions.delete(importToken);
    throw new AppError(400, 'Import session expired');
  }

  const students = session.validRows.map((row) => toBulkStudentData(row, schoolId));
  const created = await bulkCreateStudents(students);
  importSessions.delete(importToken);

  return { imported: created.length };
};

export { previewImport, confirmImport };
