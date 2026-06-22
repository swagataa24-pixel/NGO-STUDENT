import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { percent } from './attendance.js';

export function formatMonth(monthValue) {
  const date = monthValue ? new Date(`${monthValue}-01T00:00:00`) : new Date();
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function safeNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function safeText(value, fallback = '-') {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function collectVolunteerHours(volunteer) {
  if (Number.isFinite(Number(volunteer?.hours))) {
    return Number(volunteer.hours);
  }

  return (volunteer?.activityLogs || []).reduce((sum, item) => sum + safeNumber(item?.hours), 0);
}

function addHeader(doc, title, subtitle, monthLabel, filtersText) {
  doc.setFillColor(151, 179, 174);
  doc.roundedRect(36, 34, doc.internal.pageSize.getWidth() - 72, 86, 18, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(title, 56, 64);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 56, 84, { maxWidth: 360 });
  doc.setFont('helvetica', 'bold');
  doc.text(monthLabel, doc.internal.pageSize.getWidth() - 160, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(filtersText, 130), doc.internal.pageSize.getWidth() - 160, 78);
}

function addSectionTitle(doc, title, y, color = [36, 49, 47]) {
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, 42, y);
  doc.setDrawColor(214, 203, 191);
  doc.line(42, y + 5, doc.internal.pageSize.getWidth() - 42, y + 5);
  return y + 20;
}

function addMetricGrid(doc, metrics, startY) {
  const columns = 2;
  const gap = 14;
  const cardWidth = (doc.internal.pageSize.getWidth() - 84 - gap) / columns;
  const cardHeight = 58;
  metrics.forEach((metric, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = 42 + column * (cardWidth + gap);
    const y = startY + row * (cardHeight + gap);
    doc.setFillColor(metric.fill[0], metric.fill[1], metric.fill[2]);
    doc.roundedRect(x, y, cardWidth, cardHeight, 12, 12, 'F');
    doc.setTextColor(metric.text[0], metric.text[1], metric.text[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(String(metric.value), x + 12, y + 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(metric.label, x + 12, y + 40);
  });
  return startY + Math.ceil(metrics.length / columns) * (cardHeight + gap) - gap;
}

function addTable(doc, { title, head, body, startY, headFill, theme = 'striped', rowsPerPageNote }) {
  const headingY = addSectionTitle(doc, title, startY);
  autoTable(doc, {
    startY: headingY,
    head: [head],
    body,
    theme,
    headStyles: { fillColor: headFill, textColor: 255 },
    styles: { font: 'helvetica', fontSize: 8.6, cellPadding: 5, overflow: 'linebreak' },
    margin: { left: 42, right: 42 },
    didDrawPage(data) {
      if (rowsPerPageNote && data.pageNumber > 1) {
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(rowsPerPageNote, 42, 24);
      }
    }
  });
  return doc.lastAutoTable.finalY + 18;
}

export function buildReportSummary(students, photos, volunteers = []) {
  const conductedValues = students.map((student) => Number(student.conducted || 0));
  const totalClasses = conductedValues.length ? Math.max(...conductedValues) : 0;
  const totalPresent = students.reduce((sum, student) => sum + safeNumber(student.attended), 0);
  const totalConducted = students.reduce((sum, student) => sum + safeNumber(student.conducted), 0);
  const totalAbsent = Math.max(totalConducted - totalPresent, 0);
  const averageAttendance = Math.round((totalPresent / Math.max(totalConducted, 1)) * 100);
  const interventionStudents = students.filter((student) => percent(student) < 40);

  return {
    totalClasses,
    totalPresent,
    totalAbsent,
    averageAttendance,
    interventionStudents,
    photoCount: photos.length,
    volunteerHours: volunteers.reduce((sum, item) => sum + collectVolunteerHours(item), 0)
  };
}

export function downloadMonthlyReportPdf({ students, photos, volunteers = [], month, center, className, teacher }) {
  const report = buildReportSummary(students, photos, volunteers);
  const titleMonth = formatMonth(month);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 42;
  const filtersText = [`Center: ${center === 'all' ? 'All Centers' : center}`, `Class: ${className === 'all' ? 'All Classes' : className}`, `Teacher: ${teacher || 'All Teachers'}`].join('\n');

  const attendanceRows = students.length
    ? students.map((student) => {
        const value = percent(student);
        return [
          safeText(student.name),
          safeText(student.className),
          safeText(student.center),
          safeNumber(student.attended),
          safeNumber(student.conducted),
          `${value}%`,
          value > 50 ? 'Good' : value >= 40 ? 'Watch' : 'Intervention'
        ];
      })
    : [['No student records found', '-', '-', '-', '-', '-', '-']];

  const supportRows = report.interventionStudents.length
    ? report.interventionStudents.map((student) => [
        safeText(student.name),
        safeText(student.guardianName),
        safeText(student.guardianContact),
        safeText(student.note)
      ])
    : [['No students below 40% attendance', '-', '-', '-']];

  const volunteerRows = volunteers.length
    ? volunteers.map((volunteer) => [
        safeText(volunteer.name),
        safeText(volunteer.role),
        safeText(volunteer.center || volunteer.assignedCenter),
        safeText(volunteer.availability),
        `${collectVolunteerHours(volunteer)}h`
      ])
    : [['No volunteer records found', '-', '-', '-', '-']];

  const photoRows = photos.length
    ? photos.map((photo) => [safeText(photo.date), safeText(photo.center), safeText(photo.activity), safeText(photo.caption)])
    : [['No activity photos linked yet', '-', '-', '-']];

  doc.setProperties({
    title: `UPAY Monthly Report - ${titleMonth}`,
    subject: 'Attendance, student progress, volunteer contribution, and activity proof',
    author: 'UPAY NGO'
  });

  addHeader(
    doc,
    'UPAY NGO Monthly Education Report',
    'Attendance, student progress, volunteer contribution, and activity proof are summarized in one operational view.',
    titleMonth,
    filtersText
  );

  let cursorY = 144;
  cursorY = addMetricGrid(doc, [
    { label: 'Total classes conducted', value: report.totalClasses, fill: [210, 224, 211], text: [36, 49, 47] },
    { label: 'Active students', value: students.length, fill: [240, 221, 214], text: [36, 49, 47] },
    { label: 'Average attendance', value: `${report.averageAttendance}%`, fill: [242, 195, 185], text: [109, 47, 43] },
    { label: 'Intervention alerts', value: report.interventionStudents.length, fill: [214, 203, 191], text: [36, 49, 47] },
    { label: 'Volunteer hours', value: `${report.volunteerHours}h`, fill: [210, 224, 211], text: [36, 49, 47] },
    { label: 'Linked photos', value: report.photoCount, fill: [240, 238, 234], text: [36, 49, 47] }
  ], cursorY);

  cursorY = addSectionTitle(doc, 'Executive summary', cursorY + 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(88);
  doc.text(
    `${students.length} students, ${report.totalPresent} present records, ${report.totalAbsent} absent records, and ${report.photoCount} photo proofs are captured in this report.`,
    42,
    cursorY + 20,
    { maxWidth: doc.internal.pageSize.getWidth() - 84 }
  );

  cursorY = addTable(doc, {
    title: 'Student attendance details',
    head: ['Student', 'Class', 'Center', 'Attended', 'Total Classes', 'Attendance %', 'Status'],
    body: attendanceRows,
    startY: cursorY + 42,
    headFill: [36, 49, 47]
  });

  cursorY = addTable(doc, {
    title: 'Students needing support',
    head: ['Student', 'Guardian', 'Contact', 'Latest Note'],
    body: supportRows,
    startY: cursorY + 16,
    headFill: [242, 195, 185],
    theme: 'grid'
  });

  cursorY = addTable(doc, {
    title: 'Volunteer contribution',
    head: ['Volunteer', 'Role', 'Assigned Center', 'Availability', 'Monthly Hours'],
    body: volunteerRows,
    startY: cursorY + 16,
    headFill: [151, 179, 174]
  });

  cursorY = addTable(doc, {
    title: 'Activity photo proof',
    head: ['Activity Date', 'Center', 'Activity', 'Caption'],
    body: photoRows,
    startY: cursorY + 16,
    headFill: [214, 203, 191],
    theme: 'grid'
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(36, 49, 47);
  doc.text('Operational notes', 42, cursorY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(90);
  doc.text(
    'Use this report as the monthly record for planning class improvements, reviewing volunteer engagement, and tracking intervention follow-up.',
    42,
    cursorY + 22,
    { maxWidth: doc.internal.pageSize.getWidth() - 84 }
  );

  const pageCount = doc.internal.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(214, 203, 191);
    doc.line(42, 806, pageWidth - 42, 806);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('UPAY NGO - Confidential operational report', margin, 822);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin - 54, 822);
  }

  doc.save(`UPAY-Monthly-Report-${month || 'current'}.pdf`);
}
