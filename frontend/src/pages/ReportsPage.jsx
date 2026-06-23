import { useState } from 'react';
import { Download, Eye, X, Users, ArrowLeft } from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';
import './ReportsPage.css';
import { percent } from '../utils/attendance.js';
import { buildReportSummary, downloadMonthlyReportPdf, formatMonth } from '../utils/reportPdf.js';
import { config } from '../config.js';
import { mongoId } from '../utils/api.js';

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
  const [reportType, setReportType] = useState('monthly'); // 'monthly' or 'yearly'
  const [month, setMonth] = useState('2026-06');
  const [year, setYear] = useState('2026');
  const [className, setClassName] = useState('all');
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const navigate = useNavigate();

  const classOptions = [
    'all',
    ...new Set([
      ...classGroups.map((item) => item.name),
      ...students.map((student) => student.className),
      ...photos.map((photo) => photo.className).filter(Boolean)
    ])
  ];

  const filteredStudents = students.filter((student) => {
    const classMatch = className === 'all' || student.className === className;
    return classMatch;
  });

  const filteredPhotos = photos.filter((photo) => {
    const classMatch = className === 'all' || photo.className === className || String(photo.caption || '').includes(className);
    return classMatch;
  });

  const chartData = filteredStudents.map((student) => ({ name: student.name.split(' ')[0], attendance: percent(student) }));
  const report = buildReportSummary(filteredStudents, filteredPhotos, volunteers);
  const hasReportData = filteredStudents.length > 0 || filteredPhotos.length > 0 || volunteers.length > 0;

  // Get unique classes for the class-based view
  const uniqueClasses = className === 'all'
    ? [...new Map(classGroups.map(item => [mongoId(item), item])).values()]
    : classGroups.filter(c => c.name === className);

  return (
    <section className="section tinted">
      <div className="container page-hero with-action">
        <div>
          <span className="eyebrow">Analytics</span>
          <h2>Consolidated operational reviews, attendance metrics, and compliance audits.</h2>
          <p>Specify month or year and class scope to export audited PDF reports and view administrative data tables.</p>
        </div>
        <div className="filter-bar">
          <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
            <option value="monthly">Monthly Report</option>
            <option value="yearly">Yearly Report</option>
          </select>
          {reportType === 'monthly' ? (
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          ) : (
            <input type="number" value={year} onChange={(event) => setYear(event.target.value)} placeholder="Year" />
          )}
          <select value={className} onChange={(event) => setClassName(event.target.value)}>
            {classOptions.map((item) => <option key={item} value={item}>{item === 'all' ? 'All classes' : item}</option>)}
          </select>
          <button
            className="secondary-button"
            onClick={() => downloadMonthlyReportPdf({ students: filteredStudents, photos: filteredPhotos, volunteers, month: reportType === 'monthly' ? month : year, center: '', className })}
          >
            <Download size={18} /> Download PDF
          </button>
        </div>
      </div>

      {uniqueClasses.length > 0 && (
        <div className="container">
          <div className="reports-class-grid">
            {uniqueClasses.map((classItem) => {
              const classStudents = students.filter(s => s.classId === mongoId(classItem) || s.className === classItem.name);
              const avgAttendance = classStudents.length > 0
                ? Math.round(classStudents.reduce((sum, s) => sum + percent(s), 0) / classStudents.length)
                : 0;
              return (
                <div
                  key={mongoId(classItem)}
                  className="class-card"
                  onClick={() => navigate(`${config.routes.students}/${mongoId(classItem)}`)}
                >
                  <div className="class-card-header">
                    <div className="class-card-icon"><Users size={24} /></div>
                    <div className="class-card-info">
                      <h3>{classItem.name}</h3>
                      {classItem.teacher && <p>{classItem.teacher}</p>}
                    </div>
                  </div>
                  {classItem.description && <p className="class-card-description">{classItem.description}</p>}
                  <div className="class-card-footer">
                    <span className="class-card-count">{classStudents.length} Students</span>
                    <span className="class-card-count">{avgAttendance}% Avg Attendance</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasReportData ? (
        <div className="container report-layout">
          {filteredStudents.length ? (
            <div className="chart-card">
              <h3>{reportType === 'monthly' ? formatMonth(month) : `${year} Yearly`} Attendance Breakdown</h3>
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
              headers={['Student', 'Class', 'Attended', 'Total Classes', 'Attendance', 'Status']}
              rows={filteredStudents.map((student) => {
                const value = percent(student);
                return [
                  student.name,
                  student.className,
                  student.attendanceStats?.attended ?? student.attended ?? 0,
                  student.attendanceStats?.conducted ?? student.conducted ?? 0,
                  `${value}%`,
                  value > 60 ? 'Good' : value >= 50 ? 'Watch' : 'Intervention'
                ];
              })}
            />
          ) : (
            <EmptyState title="No student attendance rows" text="Choose a class with marked students." />
          )}
        </div>
        {report.interventionStudents.length > 0 && (
          <div className="table-card">
            <h3>Student Support Table</h3>
            <ResponsiveTable
              headers={['Student', 'Guardian', 'Contact', 'Latest Note']}
              rows={report.interventionStudents.map((student) => [
                student.name,
                student.guardianName,
                student.guardianContact,
                student.note
              ])}
            />
          </div>
        )}
        {volunteers.length > 0 && (
          <div className="table-card">
            <h3>Volunteer Contribution Table</h3>
            <ResponsiveTable
              headers={['Volunteer', 'Role', 'Availability', 'Hours']}
              rows={volunteers.map((volunteer) => [
                volunteer.name,
                volunteer.role,
                volunteer.availability,
                `${volunteer.hours || volunteer.activityLogs?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0}h`
              ])}
            />
          </div>
        )}
        {filteredPhotos.length > 0 && (
          <div className="table-card">
            <h3>Activity Photo Proof Table</h3>
            <ResponsiveTable
              headers={['Date', 'Activity', 'Caption', 'Image']}
              rows={filteredPhotos.map((photo) => [
                photoDate(photo),
                photoActivity(photo),
                photo.caption || '-',
                <button className="secondary-button compact-button" onClick={() => setPreviewPhoto(photo)} type="button" key={photo.id || photo._id}>
                  <Eye size={16} /> Preview
                </button>
              ])}
            />
          </div>
        )}
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
              <span>{photoDate(previewPhoto)}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
