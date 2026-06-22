import { useState } from 'react';
import { Download, Eye, X } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Metric } from '../components/Metric.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { ResponsiveTable } from '../components/ResponsiveTable.jsx';
import { percent } from '../utils/attendance.js';
import { buildReportSummary, downloadMonthlyReportPdf, formatMonth } from '../utils/reportPdf.js';

function photoDate(photo) {
  return photo.date || (photo.activityDate ? new Date(photo.activityDate).toISOString().slice(0, 10) : '-');
}

function photoCenter(photo) {
  return photo.center || photo.centerId || '-';
}

function photoActivity(photo) {
  return photo.activity || photo.caption || 'Class proof';
}

export function ReportsPage({ students, photos, volunteers = [], classes: classGroups = [] }) {
  const [month, setMonth] = useState('2026-06');
  const [center, setCenter] = useState('all');
  const [className, setClassName] = useState('all');
  const [teacher, setTeacher] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const centers = ['all', ...new Set(students.map((student) => student.center))];
  const classOptions = [
    'all',
    ...new Set([
      ...classGroups.map((item) => item.name),
      ...students.map((student) => student.className),
      ...photos.map((photo) => photo.className).filter(Boolean)
    ])
  ];
  const filteredStudents = students.filter((student) => {
    const centerMatch = center === 'all' || student.center === center;
    const classMatch = className === 'all' || student.className === className;
    return centerMatch && classMatch;
  });
  const filteredPhotos = photos.filter((photo) => {
    const centerMatch = center === 'all' || photoCenter(photo) === center || photo.centerId === center;
    const classMatch = className === 'all' || photo.className === className || String(photo.caption || '').includes(className);
    return centerMatch && classMatch;
  });
  const chartData = filteredStudents.map((student) => ({ name: student.name.split(' ')[0], attendance: percent(student) }));
  const report = buildReportSummary(filteredStudents, filteredPhotos, volunteers);
  const hasReportData = filteredStudents.length > 0 || filteredPhotos.length > 0 || volunteers.length > 0;

  return (
    <section className="section tinted">
      <div className="container page-hero with-action">
        <div>
          <span className="eyebrow">Reports</span>
          <h2>Formal monthly center review with attendance, classes, volunteers, and proof.</h2>
          <p>Refine the month, center, class, and teacher before downloading a PDF or reviewing the data tables below.</p>
        </div>
        <div className="filter-bar">
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          <select value={center} onChange={(event) => setCenter(event.target.value)}>
            {centers.map((item) => <option key={item} value={item}>{item === 'all' ? 'All centers' : item}</option>)}
          </select>
          <select value={className} onChange={(event) => setClassName(event.target.value)}>
            {classOptions.map((item) => <option key={item} value={item}>{item === 'all' ? 'All classes' : item}</option>)}
          </select>
          <input value={teacher} onChange={(event) => setTeacher(event.target.value)} placeholder="Teacher" />
          <button
            className="secondary-button"
            onClick={() => downloadMonthlyReportPdf({ students: filteredStudents, photos: filteredPhotos, volunteers, month, center, className, teacher })}
          >
            <Download size={18} /> Download PDF
          </button>
        </div>
      </div>
      {hasReportData ? (
        <div className="container report-layout">
          {filteredStudents.length ? (
            <div className="chart-card">
              <h3>{formatMonth(month)} attendance breakdown</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d6cbbf" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="attendance" fill="#97B3AE" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No attendance graph yet" text="Select a class with attendance records to show chart details." />
          )}
          <div className="report-cards">
            {report.totalClasses > 0 && <Metric value={report.totalClasses} label="total classes" />}
            {filteredStudents.length > 0 && <Metric value={`${filteredStudents.length}`} label="student records" />}
            {filteredStudents.length > 0 && <Metric value={`${report.averageAttendance}%`} label="average attendance" />}
            {report.interventionStudents.length > 0 && <Metric value={`${report.interventionStudents.length}`} label="intervention alerts" />}
            {report.volunteerHours > 0 && <Metric value={`${report.volunteerHours}h`} label="volunteer hours" />}
            {report.photoCount > 0 && <Metric value={report.photoCount} label="linked photos" />}
          </div>
        </div>
      ) : (
        <div className="container">
          <EmptyState title="No report data yet" text="Take attendance or link a class photo proof to generate charts and details." />
        </div>
      )}

      {hasReportData && <div className="container formal-report-preview">
        <div className="table-card">
          <h3>Student Attendance Table</h3>
          {filteredStudents.length ? (
            <ResponsiveTable
              headers={['Student', 'Class', 'Center', 'Attended', 'Total Classes', 'Attendance', 'Status']}
              rows={filteredStudents.map((student) => {
                const value = percent(student);
                return [
                  student.name,
                  student.className,
                  student.center,
                  student.attended,
                  student.conducted,
                  `${value}%`,
                  value > 50 ? 'Good' : value >= 40 ? 'Watch' : 'Intervention'
                ];
              })}
            />
          ) : (
            <EmptyState title="No student attendance rows" text="Choose a class with marked students." />
          )}
        </div>
        <div className="table-card">
          <h3>Student Support Table</h3>
          <ResponsiveTable
            headers={['Student', 'Guardian', 'Contact', 'Latest Note']}
            rows={
              report.interventionStudents.length
                ? report.interventionStudents.map((student) => [
                    student.name,
                    student.guardianName,
                    student.guardianContact,
                    student.note
                  ])
                : [['No students below 40% attendance', '-', '-', '-']]
            }
          />
        </div>
        <div className="table-card">
          <h3>Volunteer Contribution Table</h3>
          <ResponsiveTable
            headers={['Volunteer', 'Role', 'Center', 'Availability', 'Hours']}
            rows={volunteers.map((volunteer) => [
              volunteer.name,
              volunteer.role,
              volunteer.center || volunteer.assignedCenter,
              volunteer.availability,
              `${volunteer.hours || volunteer.activityLogs?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0}h`
            ])}
          />
        </div>
        <div className="table-card">
          <h3>Activity Photo Proof Table</h3>
          <ResponsiveTable
            headers={['Date', 'Center', 'Activity', 'Caption', 'Image']}
            rows={
              filteredPhotos.length
                ? filteredPhotos.map((photo) => [
                    photoDate(photo),
                    photoCenter(photo),
                    photoActivity(photo),
                    photo.caption || '-',
                    <button className="secondary-button compact-button" onClick={() => setPreviewPhoto(photo)} type="button" key={photo.id || photo._id}>
                      <Eye size={16} /> Preview
                    </button>
                  ])
                : [['No linked photos yet', '-', '-', '-', '-']]
            }
          />
        </div>
      </div>}

      {previewPhoto && (
        <div className="image-preview-modal" role="dialog" aria-modal="true" aria-label="Linked photo preview">
          <div className="image-preview-card">
            <button className="icon-button image-preview-close" onClick={() => setPreviewPhoto(null)} aria-label="Close preview" type="button">
              <X size={18} />
            </button>
            <img src={previewPhoto.imageUrl} alt={previewPhoto.caption || 'Linked class proof'} />
            <div>
              <strong>{previewPhoto.caption || 'Linked class proof'}</strong>
              <span>{photoCenter(previewPhoto)} · {photoDate(previewPhoto)}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
