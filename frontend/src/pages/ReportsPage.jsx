import { useState } from 'react';
import { BarChart3, CalendarDays, Download, Eye, FileText, Filter, Users, X } from 'lucide-react';
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
    ...new Set(classGroups.map((item) => item.name))
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
  const reportTitle = reportType === 'monthly' ? formatMonth(month) : reportType === 'yearly' ? `${year} Yearly` : 'Overall';

  // Get unique classes for the class-based view
  const uniqueClasses = className === 'all'
    ? [...new Map(classGroups.map(item => [mongoId(item), item])).values()]
    : classGroups.filter(c => c.name === className);

  return (
    <section className="section reports-page">
      <div className="container page-hero reports-hero">
        <div className="reports-hero-copy">
          <span className="eyebrow">Analytics</span>
          <h2>Reports dashboard</h2>
          <p>Review class attendance, intervention alerts, volunteer contribution, and activity proof in one export-ready workspace.</p>
        </div>

        <div className="reports-control-panel" aria-label="Report filters">
          <div className="reports-control-title">
            <Filter size={18} />
            <span>Report settings</span>
          </div>
          <div className="reports-control-grid">
            <label>
              <span>Report type</span>
              <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
                <option value="monthly">Monthly Report</option>
                <option value="yearly">Yearly Report</option>
                <option value="overall">Overall Report</option>
              </select>
            </label>
            {reportType === 'monthly' ? (
              <label>
                <span>Month</span>
                <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
              </label>
            ) : reportType === 'yearly' ? (
              <label>
                <span>Year</span>
                <input type="number" value={year} onChange={(event) => setYear(event.target.value)} placeholder="Year" />
              </label>
            ) : (
              <div className="reports-control-note">
                <CalendarDays size={18} />
                <span>All available records</span>
              </div>
            )}
            <label>
              <span>Class</span>
              <select value={className} onChange={(event) => setClassName(event.target.value)}>
                {classOptions.map((item) => <option key={item} value={item}>{item === 'all' ? 'All classes' : item}</option>)}
              </select>
            </label>
          </div>
          <button
            className="primary-button reports-download-button"
            onClick={() => downloadMonthlyReportPdf({ students: filteredStudents, photos: filteredPhotos, volunteers, month: reportType === 'monthly' ? month : year, center: '', className })}
          >
            <Download size={18} /> Download PDF
          </button>
        </div>
      </div>

      {uniqueClasses.length > 0 && (
        <div className="container reports-section">
          <div className="reports-section-heading">
            <div>
              <span className="eyebrow">Class scope</span>
              <h3>{className === 'all' ? 'All active classes' : className}</h3>
            </div>
            <span className="reports-pill">{uniqueClasses.length} {uniqueClasses.length === 1 ? 'class' : 'classes'}</span>
          </div>
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
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`${config.routes.students}/${mongoId(classItem)}`);
                    }
                  }}
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
                    <span><strong>{classStudents.length}</strong> Students</span>
                    <span><strong>{avgAttendance}%</strong> Avg attendance</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasReportData ? (
        <div className="container report-layout reports-section">
          {filteredStudents.length ? (
            <div className="chart-card">
              <div className="reports-card-heading">
                <div>
                  <span className="eyebrow">Attendance</span>
                  <h3>{reportTitle} breakdown</h3>
                </div>
                <BarChart3 size={22} />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#123C34" stopOpacity={0.95}/>
                      <stop offset="100%" stopColor="#A68D71" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(18, 60, 52, 0.1)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#5A5A57' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5A5A57' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(18, 60, 52, 0.14)',
                      borderRadius: '12px',
                      color: '#1A1A1A',
                      boxShadow: '0 18px 40px -28px rgba(18, 60, 52, 0.45)'
                    }}
                    cursor={{ fill: 'rgba(18, 60, 52, 0.04)' }}
                  />
                  <Bar
                    dataKey="attendance"
                    fill="url(#colorAttendance)"
                    radius={[12, 12, 4, 4]}
                    animationDuration={1500}
                    animationEasing="ease-out"
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No attendance graph yet" text="Select a class with attendance records to show chart details." />
          )}
          <div className="report-cards">
            <div className="report-summary-card">
              <FileText size={20} />
              <span>Current view</span>
              <strong>{reportTitle}</strong>
              <p>{className === 'all' ? 'All classes included' : className}</p>
            </div>
            {uniqueClasses.length > 0 && <Metric value={uniqueClasses.length} label="total classes" />}
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

      {hasReportData && <div className="container formal-report-preview reports-section">
        <div className="table-card">
          <div className="reports-card-heading">
            <div>
              <span className="eyebrow">Records</span>
              <h3>Student Attendance</h3>
            </div>
          </div>
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
            <div className="reports-card-heading">
              <div>
                <span className="eyebrow">Support</span>
                <h3>Intervention Watchlist</h3>
              </div>
            </div>
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
            <div className="reports-card-heading">
              <div>
                <span className="eyebrow">People</span>
                <h3>Volunteer Contribution</h3>
              </div>
            </div>
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
            <div className="reports-card-heading">
              <div>
                <span className="eyebrow">Evidence</span>
                <h3>Activity Photo Proof</h3>
              </div>
            </div>
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
