import PDFDocument from 'pdfkit';
import { recordsToCSV } from './csv-parser.service.js';

const generatePDFBuffer = (renderFn) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: true, margin: 40 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    renderFn(doc);
    doc.end();
  });
};

const generateDistrictReportPDF = async (school, students) => {
  return generatePDFBuffer((doc) => {
    doc.fontSize(20).text(`District Report — ${school.schoolName}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`District: ${school.districtNumber}`);
    if (school.region) doc.text(`Region: ${school.region}`);
    doc.text(`Total Students: ${students.length}`);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text('Student Summary', { underline: true });
    doc.moveDown(0.5);

    students.forEach((s, idx) => {
      doc
        .fontSize(10)
        .text(
          `${idx + 1}. ${s.firstName} ${s.lastName} | ID: ${s.studentId} | Grade: ${s.gradeLevel || 'N/A'} | Status: ${s.status}`
        );
    });
  });
};

const generateQRCardsPDF = async (students) => {
  return generatePDFBuffer((doc) => {
    doc.fontSize(16).text('QR Cards', { align: 'center' });
    doc.moveDown();

    students.forEach((student, idx) => {
      if (idx > 0 && idx % 10 === 0) doc.addPage();

      doc.fontSize(12).text(`${student.firstName} ${student.lastName}`);
      doc.fontSize(10).text(`ID: ${student.studentId}`);
      if (student.gradeLevel) doc.text(`Grade: ${student.gradeLevel}`);
      doc.text(`QR Status: ${student.qrStatus}`);

      if (student.qrCode) {
        const base64Data = student.qrCode.replace(/^data:image\/png;base64,/, '');
        const imgBuffer = Buffer.from(base64Data, 'base64');
        try {
          doc.image(imgBuffer, { width: 80, height: 80 });
        } catch {
          doc.text('[QR code image unavailable]');
        }
      }

      doc.moveDown(1);
    });
  });
};

const generateCSVExport = (records, columns) => {
  return recordsToCSV(records, columns);
};

export { generateDistrictReportPDF, generateQRCardsPDF, generateCSVExport };
