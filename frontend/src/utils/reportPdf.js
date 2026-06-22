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
  const width = doc.internal.pageSize.getWidth() - 84;
  
  // 1. Dark Spruce Green banner background
  doc.setFillColor(18, 60, 52); // #123C34
  doc.roundedRect(42, 34, width, 90, 8, 8, 'F');
  
  // 2. Gold decorative line at the bottom of the banner
  doc.setFillColor(166, 141, 113); // #A68D71
  doc.rect(42, 120, width, 4, 'F');
  
  // 3. Left content: Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(197, 168, 128); // Light Gold #C5A880
  doc.text('UPAY NGO — OPERATIONAL DATA PORTAL', 58, 60);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 58, 84);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(210, 220, 218);
  doc.text(subtitle, 58, 102, { maxWidth: 310 });
  
  // 4. Right content: Month & Metadata Box
  doc.setFillColor(25, 75, 66); // Lighter green for contrast
  doc.roundedRect(doc.internal.pageSize.getWidth() - 192, 46, 138, 66, 4, 4, 'F');
  
  doc.setTextColor(197, 168, 128); // Light Gold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(monthLabel, doc.internal.pageSize.getWidth() - 180, 62);
  
  doc.setTextColor(230, 240, 238);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  const splitFilters = doc.splitTextToSize(filtersText, 120);
  doc.text(splitFilters, doc.internal.pageSize.getWidth() - 180, 78);
}

function addSectionTitle(doc, title, y, color = [18, 60, 52]) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y > pageHeight - 110) {
    doc.addPage();
    y = 60;
  }
  
  // Clean left vertical gold badge bar
  doc.setFillColor(166, 141, 113); // Sand Gold #A68D71
  doc.rect(42, y - 11, 4, 15, 'F');
  
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title, 52, y);
  
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.line(42, y + 6, doc.internal.pageSize.getWidth() - 42, y + 6);
  
  return y + 18;
}

function addMetricGrid(doc, metrics, startY) {
  const columns = 2;
  const gap = 12;
  const cardWidth = (doc.internal.pageSize.getWidth() - 84 - gap) / columns;
  const cardHeight = 52;
  
  metrics.forEach((metric, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = 42 + column * (cardWidth + gap);
    const y = startY + row * (cardHeight + gap);
    
    // Draw card background
    doc.setFillColor(250, 250, 249);
    doc.roundedRect(x, y, cardWidth, cardHeight, 6, 6, 'F');
    
    // Draw card border
    doc.setDrawColor(230, 230, 227);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, y, cardWidth, cardHeight, 6, 6, 'S');
    
    // Color-coded left indicator line
    let stripeColor = [18, 60, 52]; // Spruce Green
    if (metric.label.toLowerCase().includes('alert') || metric.label.toLowerCase().includes('intervention')) {
      stripeColor = [197, 34, 31]; // Alert Red
    } else if (metric.label.toLowerCase().includes('attendance')) {
      stripeColor = [166, 141, 113]; // Sand Gold
    }
    
    doc.setFillColor(stripeColor[0], stripeColor[1], stripeColor[2]);
    doc.rect(x, y + 4, 3, cardHeight - 8, 'F');
    
    // Write metric value
    doc.setTextColor(40, 50, 48);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(String(metric.value), x + 16, y + 22);
    
    // Write metric label
    doc.setTextColor(100, 110, 108);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(metric.label, x + 16, y + 38);
  });
  
  return startY + Math.ceil(metrics.length / columns) * (cardHeight + gap) - gap;
}

function addTable(doc, { title, head, body, startY, headFill, columnStyles }) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (startY > pageHeight - 110) {
    doc.addPage();
    startY = 60;
  }

  const headingY = addSectionTitle(doc, title, startY);

  autoTable(doc, {
    startY: headingY,
    head: [head],
    body,
    theme: 'plain',
    headStyles: { 
      fillColor: headFill || [18, 60, 52], 
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 7, bottom: 7, left: 6, right: 6 }
    },
    bodyStyles: {
      textColor: [60, 70, 68],
      fontSize: 8.5,
      cellPadding: { top: 6, bottom: 6, left: 6, right: 6 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 249]
    },
    styles: {
      font: 'helvetica',
      lineColor: [230, 232, 230],
      lineWidth: 0.5
    },
    columnStyles,
    margin: { left: 42, right: 42 },
    didParseCell(data) {
      data.cell.styles.lineWidth = 0.5;
      data.cell.styles.lineColor = [230, 232, 230];
    }
  });

  return doc.lastAutoTable.finalY + 22;
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
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const filtersText = [
    `Class: ${className === 'all' ? 'All Classes' : className}`,
    `Teacher: ${teacher || 'All Teachers'}`
  ].join('\n');

  // Format attendance data with colored status cells
  const attendanceRows = students.length
    ? students.map((student) => {
        const value = percent(student);
        let statusBadge = 'Intervention';
        let statusStyles = { textColor: [197, 34, 31], fillColor: [252, 232, 230], fontStyle: 'bold', halign: 'center' };
        if (value > 50) {
          statusBadge = 'Good';
          statusStyles = { textColor: [19, 115, 51], fillColor: [230, 244, 234], fontStyle: 'bold', halign: 'center' };
        } else if (value >= 40) {
          statusBadge = 'Watch';
          statusStyles = { textColor: [176, 96, 0], fillColor: [254, 247, 224], fontStyle: 'bold', halign: 'center' };
        }
        return [
          safeText(student.name),
          safeText(student.className),
          { content: safeNumber(student.attended), styles: { halign: 'center' } },
          { content: safeNumber(student.conducted), styles: { halign: 'center' } },
          { content: `${value}%`, styles: { halign: 'center', fontStyle: 'bold' } },
          { content: statusBadge, styles: statusStyles }
        ];
      })
    : [
        [
          {
            content: 'No student records found',
            colSpan: 6,
            styles: { halign: 'center', textColor: [120, 120, 120] }
          }
        ]
      ];

  const supportRows = report.interventionStudents.length
    ? report.interventionStudents.map((student) => [
        safeText(student.name),
        safeText(student.guardianName),
        safeText(student.guardianContact),
        safeText(student.note)
      ])
    : [
        [
          {
            content: 'No students below 40% attendance',
            colSpan: 4,
            styles: { halign: 'center', textColor: [120, 120, 120] }
          }
        ]
      ];

  const volunteerRows = volunteers.length
    ? volunteers.map((volunteer) => [
        safeText(volunteer.name),
        safeText(volunteer.role),
        safeText(volunteer.availability),
        { content: `${collectVolunteerHours(volunteer)}h`, styles: { halign: 'center' } }
      ])
    : [
        [
          {
            content: 'No volunteer records found',
            colSpan: 4,
            styles: { halign: 'center', textColor: [120, 120, 120] }
          }
        ]
      ];

  const photoRows = photos.length
    ? photos.map((photo) => [
        safeText(photo.date),
        safeText(photo.activity),
        safeText(photo.caption)
      ])
    : [
        [
          {
            content: 'No activity photos linked yet',
            colSpan: 3,
            styles: { halign: 'center', textColor: [120, 120, 120] }
          }
        ]
      ];

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
    { label: 'Total classes conducted', value: report.totalClasses },
    { label: 'Active students', value: students.length },
    { label: 'Average attendance', value: `${report.averageAttendance}%` },
    { label: 'Intervention alerts', value: report.interventionStudents.length },
    { label: 'Volunteer hours', value: `${report.volunteerHours}h` },
    { label: 'Linked photos', value: report.photoCount }
  ], cursorY);

  cursorY = addSectionTitle(doc, 'Executive summary', cursorY + 24);
  
  const summaryText = `${students.length} active students, ${report.totalPresent} present records, and ${report.totalAbsent} absent records are accounted for in this period. A total of ${report.photoCount} photo proofs and ${report.volunteerHours} volunteer hours have been registered.`;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(80, 90, 88);
  
  const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 84);
  doc.text(splitSummary, 42, cursorY + 10);
  
  const summaryHeight = splitSummary.length * 13.5;
  cursorY = cursorY + 10 + summaryHeight + 20;

  // Table 1: Student Attendance Details
  cursorY = addTable(doc, {
    title: 'Student attendance details',
    head: ['Student', 'Class', 'Attended', 'Total Classes', 'Attendance %', 'Status'],
    body: attendanceRows,
    startY: cursorY,
    headFill: [18, 60, 52],
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 80 },
      2: { cellWidth: 60 },
      3: { cellWidth: 60 },
      4: { cellWidth: 70 },
      5: { cellWidth: 92 }
    }
  });

  // Table 2: Students Needing Support
  cursorY = addTable(doc, {
    title: 'Students needing support',
    head: ['Student', 'Guardian', 'Contact', 'Latest Note'],
    body: supportRows,
    startY: cursorY,
    headFill: [142, 60, 50], // Muted warning red
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 100 },
      2: { cellWidth: 82 },
      3: { cellWidth: 210 }
    }
  });

  // Table 3: Volunteer Contribution
  cursorY = addTable(doc, {
    title: 'Volunteer contribution',
    head: ['Volunteer', 'Role', 'Availability', 'Monthly Hours'],
    body: volunteerRows,
    startY: cursorY,
    headFill: [166, 141, 113], // Sand Gold
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 120 },
      2: { cellWidth: 150 },
      3: { cellWidth: 92 }
    }
  });

  // Table 4: Activity Photo Proof
  cursorY = addTable(doc, {
    title: 'Activity photo proof',
    head: ['Activity Date', 'Activity', 'Caption'],
    body: photoRows,
    startY: cursorY,
    headFill: [90, 115, 110], // Muted Green-Grey
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 150 },
      2: { cellWidth: 272 }
    }
  });

  // Operational notes callout box
  const notesTitle = 'Operational notes';
  const notesText = 'This document serves as the official monthly record for planning academic improvements, evaluating volunteer contributions, and tracking student intervention protocols.';
  
  if (cursorY > pageHeight - 110) {
    doc.addPage();
    cursorY = 60;
  }
  
  // Callout background
  doc.setFillColor(250, 250, 249);
  doc.roundedRect(42, cursorY, pageWidth - 84, 54, 4, 4, 'F');
  
  // Callout border
  doc.setDrawColor(230, 230, 227);
  doc.setLineWidth(0.6);
  doc.roundedRect(42, cursorY, pageWidth - 84, 54, 4, 4, 'S');
  
  // Left vertical gold accent
  doc.setFillColor(166, 141, 113);
  doc.rect(42, cursorY, 3, 54, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(18, 60, 52); // Spruce green
  doc.text(notesTitle, 54, cursorY + 18);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 110, 108);
  const splitNotes = doc.splitTextToSize(notesText, pageWidth - 108);
  doc.text(splitNotes, 54, cursorY + 32);

  // Add running headers & footers to all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    
    // Page 2+ Running Header
    if (page > 1) {
      doc.setFillColor(18, 60, 52); // Spruce Green
      doc.rect(42, 30, pageWidth - 84, 4, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(120, 130, 128);
      doc.setFont('helvetica', 'normal');
      doc.text(`Monthly Progress Report — ${titleMonth}`, 42, 24);
    }
    
    // Bottom footer line
    doc.setDrawColor(230, 230, 227);
    doc.setLineWidth(0.5);
    doc.line(42, 806, pageWidth - 42, 806);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 128);
    doc.text('UPAY NGO — Confidential Operational Report', margin, 822);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin - 54, 822);
  }

  doc.save(`UPAY-Monthly-Report-${month || 'current'}.pdf`);
}
