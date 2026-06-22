import { useState } from 'react';
import { Download } from 'lucide-react';
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
import { ResponsiveTable } from '../components/ResponsiveTable.jsx';
import { percent } from '../utils/attendance.js';
import { buildReportSummary, downloadMonthlyReportPdf, formatMonth } from '../utils/reportPdf.js';

export function ReportsPage({ students, photos, volunteers = [] }) {
  const [month, setMonth] = useState('2026-06');
  const [center, setCenter] = useState('all');
  const [className, setClassName] = useState('all');
  const [teacher, setTeacher] = useState('');
  const centers = ['all', ...new Set(students.map((student) => student.center))];
  const classes = ['all', ...new Set(students.map((student) => student.className))];
  const filteredStudents = students.filter((student) => {
    const centerMatch = center === 'all' || student.center === center;
    const classMatch = className === 'all' || student.className === className;
    return centerMatch && classMatch;
  });
  const chartData = filteredStudents.map((student) => ({ name: student.name.split(' ')[0], attendance: percent(student) }));
  const report = buildReportSummary(filteredStudents, photos, volunteers);

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
            {classes.map((item) => <option key={item} value={item}>{item === 'all' ? 'All classes' : item}</option>)}
          </select>
          <input value={teacher} onChange={(event) => setTeacher(event.target.value)} placeholder="Teacher" />
          <button
            className="secondary-button"
            onClick={() => downloadMonthlyReportPdf({ students: filteredStudents, photos, volunteers, month, center, className, teacher })}
          >
            <Download size={18} /> Download PDF
          </button>
        </div>
      </div>
      <div className="container report-layout">
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
        <div className="report-cards">
          <Metric value={report.totalClasses} label="total classes" />
          <Metric value={`${filteredStudents.length}`} label="student records" />
          <Metric value={`${report.averageAttendance}%`} label="average attendance" />
          <Metric value={`${report.interventionStudents.length}`} label="intervention alerts" />
          <Metric value={`${report.volunteerHours}h`} label="volunteer hours" />
          <Metric value={report.photoCount} label="linked photos" />
        </div>
      </div>
      <div className="container formal-report-preview">
        <div className="table-card">
          <h3>Student Attendance Table</h3>
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
            headers={['Date', 'Center', 'Activity', 'Caption']}
            rows={photos.map((photo) => [photo.date, photo.center, photo.activity, photo.caption])}
          />
        </div>
      </div>
    </section>
  );
}
