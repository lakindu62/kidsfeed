import PDFDocument from 'pdfkit';

const TABLE_BORDER = '#333333';
const HEADER_FILL = '#d1d5db';
const STAT_ROW_FILL = '#f4f4f5';
const LINE_WIDTH = 0.45;

function createPdfBuffer(renderFn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      autoFirstPage: true,
      margin: 40,
      size: 'LETTER',
    });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    renderFn(doc);
    doc.end();
  });
}

function pageInnerBounds(doc) {
  const left = doc.page.margins.left;
  const top = doc.page.margins.top;
  const right = doc.page.width - doc.page.margins.right;
  const bottom = doc.page.height - doc.page.margins.bottom;
  const width = right - left;
  return { left, top, right, bottom, width };
}

function ensureY(doc, y, needed, carry = () => {}) {
  const { bottom } = pageInnerBounds(doc);
  if (y + needed <= bottom) {
    return y;
  }
  doc.addPage();
  carry();
  return pageInnerBounds(doc).top;
}

function sumWidths(widths) {
  return widths.reduce((a, b) => a + b, 0);
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return d.toLocaleDateString();
}

function formatRangeLabel(dateFrom, dateTo) {
  if (!dateFrom && !dateTo) {
    return 'All dates';
  }
  if (dateFrom && dateTo) {
    return `${dateFrom} to ${dateTo}`;
  }
  if (dateFrom) {
    return `From ${dateFrom}`;
  }
  return `Until ${dateTo}`;
}

/** Draw one table row (header or body) with grid lines. Returns y below row. */
function drawTableRow(doc, x, y, colWidths, cells, height, options = {}) {
  const { header = false, fontSize = 8, fill = null } = options;
  const tw = sumWidths(colWidths);

  doc.save();
  doc.lineWidth(LINE_WIDTH).strokeColor(TABLE_BORDER);
  if (fill) {
    doc.fillColor(fill).rect(x, y, tw, height).fill();
  }
  doc.rect(x, y, tw, height).stroke();

  let cx = x;
  for (let i = 1; i < colWidths.length; i += 1) {
    cx += colWidths[i - 1];
    doc
      .moveTo(cx, y)
      .lineTo(cx, y + height)
      .stroke();
  }

  cx = x;
  doc.fillColor('#111827');
  doc.font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize);
  const padX = 5;
  const textY = y + (height - fontSize) / 2 - 1;
  cells.forEach((cell, i) => {
    const w = colWidths[i];
    doc.text(String(cell ?? ''), cx + padX, textY, {
      width: w - padX * 2,
      ellipsis: true,
      lineBreak: false,
    });
    cx += w;
  });
  doc.restore();

  return y + height;
}

/**
 * Renders a titled statistics block as a two-column table (label | value).
 */
function drawStatsBlock(doc, x, y, title, pairs) {
  const { width } = pageInnerBounds(doc);
  const labelW = Math.min(280, width * 0.62);
  const valueW = width - labelW;
  const rowH = 20;
  const headerH = 22;
  let cy = y;

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#166534');
  doc.text(title, x, cy);
  cy += headerH - 4;

  cy = drawTableRow(doc, x, cy, [labelW, valueW], ['Metric', 'Value'], rowH, {
    header: true,
    fontSize: 9,
    fill: HEADER_FILL,
  });

  pairs.forEach(([label, value], idx) => {
    const fill = idx % 2 === 0 ? STAT_ROW_FILL : '#ffffff';
    cy = drawTableRow(doc, x, cy, [labelW, valueW], [label, value], rowH, {
      fontSize: 9,
      fill,
    });
  });

  return cy + 14;
}

function drawReportHeader(
  doc,
  y,
  title,
  schoolName,
  periodLine,
  generatedLine
) {
  const { left, width } = pageInnerBounds(doc);
  let cy = y;
  doc.font('Helvetica-Bold').fontSize(17).fillColor('#14532d');
  doc.text(title, left, cy, { width, align: 'center' });
  cy += 26;
  doc.font('Helvetica').fontSize(11).fillColor('#374151');
  doc.text(`School: ${schoolName}`, left, cy, { width, align: 'center' });
  cy += 16;
  doc.fontSize(10).fillColor('#6b7280');
  doc.text(periodLine, left, cy, { width, align: 'center' });
  cy += 14;
  doc.fontSize(9);
  doc.text(generatedLine, left, cy, { width, align: 'center' });
  return cy + 28;
}

function computeSessionSummaryStats(rows) {
  const byStatus = {};
  let sumPlanned = 0;
  let sumServed = 0;
  let sumPresent = 0;
  let sumExcused = 0;
  let sumNoShow = 0;

  rows.forEach((r) => {
    const st = String(r.status || 'UNKNOWN');
    byStatus[st] = (byStatus[st] || 0) + 1;
    sumPlanned += Number(r.plannedHeadcount) || 0;
    sumServed += Number(r.actualServedCount) || 0;
    sumPresent += Number(r.present) || 0;
    sumExcused += Number(r.excused) || 0;
    sumNoShow += Number(r.noShow) || 0;
  });

  const marked = sumPresent + sumExcused + sumNoShow;
  const serveRate =
    sumPlanned > 0 ? `${((sumServed / sumPlanned) * 100).toFixed(1)}%` : '—';
  const presentOfPlanned =
    sumPlanned > 0 ? `${((sumPresent / sumPlanned) * 100).toFixed(1)}%` : '—';

  return {
    sessionCount: rows.length,
    byStatus,
    sumPlanned,
    sumServed,
    sumPresent,
    sumExcused,
    sumNoShow,
    marked,
    serveRate,
    presentOfPlanned,
  };
}

function computeNoShowStats(rows) {
  const byMeal = {};
  const byEmail = {};
  rows.forEach((r) => {
    const meal = String(r.mealType || '—');
    byMeal[meal] = (byMeal[meal] || 0) + 1;
    const em = r.emailLogStatus ? String(r.emailLogStatus) : '—';
    byEmail[em] = (byEmail[em] || 0) + 1;
  });
  return { total: rows.length, byMeal, byEmail };
}

function computeRosterStats(roster) {
  const c = {
    PRESENT: 0,
    EXCUSED: 0,
    NO_SHOW: 0,
    NOT_MARKED: 0,
  };
  roster.forEach((r) => {
    const s = String(r.status || '');
    if (s === 'PRESENT') {
      c.PRESENT += 1;
    } else if (s === 'EXCUSED') {
      c.EXCUSED += 1;
    } else if (s === 'NO_SHOW') {
      c.NO_SHOW += 1;
    } else {
      c.NOT_MARKED += 1;
    }
  });
  return {
    ...c,
    total: roster.length,
    marked: c.PRESENT + c.EXCUSED + c.NO_SHOW,
  };
}

function sessionSummaryStatPairs(stats) {
  const statusLine = Object.entries(stats.byStatus)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');

  return [
    ['Meal sessions in report', String(stats.sessionCount)],
    ['Sum of planned headcount', String(stats.sumPlanned)],
    ['Sum of recorded served (session field)', String(stats.sumServed)],
    ['Total present (attendance rows)', String(stats.sumPresent)],
    ['Total excused (attendance rows)', String(stats.sumExcused)],
    ['Total no-show (attendance rows)', String(stats.sumNoShow)],
    ['All marked attendance rows', String(stats.marked)],
    ['Sessions by status', statusLine || '—'],
    ['Served ÷ planned (aggregate)', stats.serveRate],
    ['Present ÷ planned (aggregate)', stats.presentOfPlanned],
  ];
}

function noShowStatPairs(stats) {
  const mealLines = Object.entries(stats.byMeal)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');
  const emailLines = Object.entries(stats.byEmail)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');

  return [
    ['Total no-show records', String(stats.total)],
    ['By meal type', mealLines || '—'],
    ['Guardian email log status', emailLines || '—'],
  ];
}

function rosterStatPairs(stats) {
  const pct = (n) =>
    stats.total > 0 ? `${((n / stats.total) * 100).toFixed(1)}%` : '—';
  return [
    ['Students on roster', String(stats.total)],
    ['Present', `${stats.PRESENT} (${pct(stats.PRESENT)})`],
    ['Excused', `${stats.EXCUSED} (${pct(stats.EXCUSED)})`],
    ['No-show', `${stats.NO_SHOW} (${pct(stats.NO_SHOW)})`],
    ['Not marked', `${stats.NOT_MARKED} (${pct(stats.NOT_MARKED)})`],
    ['Rows with any mark', String(stats.marked)],
  ];
}

/**
 * Paginated data table with repeating header row.
 */
function renderDataTable(
  doc,
  startY,
  colWidths,
  headerCells,
  bodyRows,
  rowOptions
) {
  const { left, width } = pageInnerBounds(doc);
  const { bottom } = pageInnerBounds(doc);
  const rowH = rowOptions?.rowH ?? 17;
  const headerH = rowOptions?.headerH ?? 20;
  const fontSize = rowOptions?.fontSize ?? 7;
  const tableW = sumWidths(colWidths);
  const x = left;

  let y = startY;
  const drawPageHeader = () => {
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#374151');
    doc.text('Detail table (continued)', left, y);
    y += 16;
    y = drawTableRow(doc, x, y, colWidths, headerCells, headerH, {
      header: true,
      fontSize: fontSize + 1,
      fill: HEADER_FILL,
    });
  };

  y = drawTableRow(doc, x, y, colWidths, headerCells, headerH, {
    header: true,
    fontSize: fontSize + 1,
    fill: HEADER_FILL,
  });

  bodyRows.forEach((cells, idx) => {
    const fill = idx % 2 === 0 ? '#fafafa' : '#ffffff';
    if (y + rowH > bottom) {
      doc.addPage();
      y = pageInnerBounds(doc).top;
      drawPageHeader();
    }
    y = drawTableRow(doc, x, y, colWidths, cells, rowH, {
      fontSize,
      fill,
    });
  });

  return y + 10;
}

export async function generateMealSessionSummaryPdf({
  schoolName,
  rows,
  dateFrom,
  dateTo,
}) {
  return createPdfBuffer((doc) => {
    const { left, top, width } = pageInnerBounds(doc);
    let y = top;

    y = drawReportHeader(
      doc,
      y,
      'Meal session attendance summary',
      schoolName,
      `Reporting period: ${formatRangeLabel(dateFrom, dateTo)}`,
      `Generated: ${new Date().toLocaleString()}`
    );

    if (!rows.length) {
      doc.font('Helvetica').fontSize(11).fillColor('#6b7280');
      doc.text('No meal sessions found for this filter.', left, y, { width });
      return;
    }

    const stats = computeSessionSummaryStats(rows);
    y = ensureY(doc, y, 120, () => {});
    y = drawStatsBlock(
      doc,
      left,
      y,
      'Summary statistics',
      sessionSummaryStatPairs(stats)
    );

    const colWidths = [70, 66, 60, 54, 54, 52, 52, 124];
    const headerCells = [
      'Date',
      'Meal',
      'Status',
      'Planned',
      'Served',
      'Present',
      'Excused',
      'No-show',
    ];
    const bodyRows = rows.map((r) => [
      formatDate(r.date),
      String(r.mealType || '—'),
      String(r.status || '—'),
      String(r.plannedHeadcount ?? 0),
      String(r.actualServedCount ?? 0),
      String(r.present ?? 0),
      String(r.excused ?? 0),
      String(r.noShow ?? 0),
    ]);

    y = ensureY(doc, y, 40, () => {});
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#166534');
    doc.text('Session detail', left, y);
    y += 18;

    renderDataTable(doc, y, colWidths, headerCells, bodyRows, {
      rowH: 18,
      headerH: 22,
      fontSize: 8,
    });
  });
}

export async function generateNoShowReportPdf({
  schoolName,
  rows,
  dateFrom,
  dateTo,
}) {
  return createPdfBuffer((doc) => {
    const { left, top, width } = pageInnerBounds(doc);
    let y = top;

    y = drawReportHeader(
      doc,
      y,
      'No-show report',
      schoolName,
      `Reporting period: ${formatRangeLabel(dateFrom, dateTo)}`,
      `Generated: ${new Date().toLocaleString()}`
    );

    if (!rows.length) {
      doc.font('Helvetica').fontSize(11).fillColor('#6b7280');
      doc.text('No no-show records for this filter.', left, y, { width });
      return;
    }

    const stats = computeNoShowStats(rows);
    y = ensureY(doc, y, 100, () => {});
    y = drawStatsBlock(
      doc,
      left,
      y,
      'Summary statistics',
      noShowStatPairs(stats)
    );

    const colWidths = [64, 56, 72, 118, 126, 96];
    const headerCells = [
      'Session date',
      'Meal',
      'Student ID',
      'Name',
      'Guardian email',
      'Email log',
    ];
    const bodyRows = rows.map((r) => {
      const emailLog = r.emailLogStatus
        ? `${r.emailLogStatus}${
            r.emailLogSkipReason ? ` (${r.emailLogSkipReason})` : ''
          }`
        : '—';
      return [
        formatDate(r.sessionDate),
        String(r.mealType || '—'),
        String(r.studentId),
        String(r.studentName || '—'),
        String(r.guardianEmail || '—'),
        emailLog,
      ];
    });

    y = ensureY(doc, y, 40, () => {});
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#166534');
    doc.text('No-show detail', left, y);
    y += 18;

    renderDataTable(doc, y, colWidths, headerCells, bodyRows, {
      rowH: 20,
      headerH: 22,
      fontSize: 7,
    });
  });
}

export async function generateSessionRosterPdf({
  schoolName,
  sessionLabel,
  mealType,
  sessionDate,
  sessionStatus,
  roster,
}) {
  return createPdfBuffer((doc) => {
    const { left, top, width } = pageInnerBounds(doc);
    let y = top;

    y = drawReportHeader(
      doc,
      y,
      'Session attendance roster',
      schoolName,
      `${formatDate(sessionDate)} · ${String(mealType || 'meal')} · ${String(sessionStatus || '—')}`,
      `Session ID: ${sessionLabel} · Generated: ${new Date().toLocaleString()}`
    );

    if (!roster.length) {
      doc.font('Helvetica').fontSize(11).fillColor('#6b7280');
      doc.text('No students in roster.', left, y, { width });
      return;
    }

    const stats = computeRosterStats(roster);
    y = ensureY(doc, y, 100, () => {});
    y = drawStatsBlock(
      doc,
      left,
      y,
      'Roster statistics',
      rosterStatPairs(stats)
    );

    const colWidths = [100, 332, 100];
    const headerCells = ['Student ID', 'Name', 'Status'];
    const bodyRows = roster.map((row) => {
      const name =
        row.fullName ||
        [row.firstName, row.lastName].filter(Boolean).join(' ').trim() ||
        '—';
      return [String(row.studentId), name, String(row.status || '—')];
    });

    y = ensureY(doc, y, 40, () => {});
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#166534');
    doc.text('Roster detail', left, y);
    y += 18;

    renderDataTable(doc, y, colWidths, headerCells, bodyRows, {
      rowH: 18,
      headerH: 22,
      fontSize: 9,
    });
  });
}
