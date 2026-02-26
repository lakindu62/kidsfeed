import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify/sync';

const CSV_TEMPLATE_HEADERS = [
  'firstName',
  'lastName',
  'studentId',
  'gradeLevel',
  'age',
  'guardianName',
  'guardianPhone',
  'guardianEmail',
  'emergencyContactName',
  'emergencyContactPhone',
  'status',
];

const parseCSVBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    parse(
      buffer,
      {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      },
      (err, records) => {
        if (err) return reject(err);
        resolve(records);
      }
    );
  });
};

const generateCSVTemplate = () => {
  const header = CSV_TEMPLATE_HEADERS.join(',');
  const example =
    'John,Doe,STU-0001,5,10,Jane Doe,555-1234,jane@example.com,Bob Doe,555-5678,active';
  return `${header}\n${example}\n`;
};

const recordsToCSV = (records, columns) => {
  return stringify(records, { header: true, columns });
};

export { parseCSVBuffer, generateCSVTemplate, recordsToCSV, CSV_TEMPLATE_HEADERS };
