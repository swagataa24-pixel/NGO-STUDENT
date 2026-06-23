import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, ChevronLeft, GraduationCap, Pencil, Trash2, Users } from 'lucide-react';
import { EmptyState } from '../components/EmptyState.jsx';
import { config } from '../config.js';
import { apiRequest, mongoId } from '../utils/api.js';
import './VolunteerDetailPage.css';

function volunteerHours(volunteer) {
  if (Number.isFinite(Number(volunteer?.hours))) return Number(volunteer.hours);
  return (volunteer?.activityLogs || []).reduce((sum, item) => sum + (Number(item?.hours) || 0), 0);
}

function matchesTeacher(classItem, volunteerName) {
  const teacher = String(classItem?.teacher || '').trim().toLowerCase();
  const name = String(volunteerName || '').trim().toLowerCase();
  return Boolean(teacher && name && teacher === name);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function VolunteerDetailPage({ volunteers, setVolunteers, students, classes, attendanceSessions, dataStatus, refreshData }) {
  const { volunteerId } = useParams();
  const navigate = useNavigate();

  const selectedVolunteer = volunteers.find((item) => mongoId(item) === volunteerId);

  const volunteerClasses = useMemo(() => {
    if (!selectedVolunteer) return [];
    return classes.filter((classItem) => matchesTeacher(classItem, selectedVolunteer.name));
  }, [classes, selectedVolunteer]);

  const volunteerStudents = useMemo(() => {
    if (!selectedVolunteer) return [];
    const classNames = new Set(volunteerClasses.map((item) => item.name));
    return students.filter((student) => classNames.has(student.className));
  }, [students, volunteerClasses, selectedVolunteer]);

  const volunteerAttendance = useMemo(() => {
    if (!selectedVolunteer) return [];
    const classNames = new Set(volunteerClasses.map((item) => item.name));
    return attendanceSessions.filter((session) => classNames.has(session.className));
  }, [attendanceSessions, volunteerClasses, selectedVolunteer]);

  const deleteVolunteer = async (volunteerId) => {
    if (!window.confirm('Delete this volunteer record? This cannot be undone.')) return;
    try {
      await apiRequest(`${config.apiRoutes.volunteers}/${volunteerId}`, { method: 'DELETE' });
      setVolunteers((items) => items.filter((item) => mongoId(item) !== volunteerId));
      navigate(config.routes.volunteers);
    } catch (error) {
      console.error('Error deleting volunteer:', error);
    }
  };

  if (!selectedVolunteer) {
    return (
      <section className="section">
        <div className="container page-hero">
          <Link to={config.routes.volunteers} className="eyebrow link-button">
            <ChevronLeft size={16} /> Back to volunteers
          </Link>
          <h2>Volunteer not found</h2>
          <p>The volunteer you're looking for doesn't exist or has been removed.</p>
        </div>
        <div className="container">
          <EmptyState
            title="Volunteer not found"
            text="Please return to the volunteers list."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="section theme-admin-dark">
      <div className="container page-hero with-action">
        <div>
          <Link to={config.routes.volunteers} className="eyebrow link-button">
            <ChevronLeft size={16} /> Back to volunteers
          </Link>
          <h2>{selectedVolunteer.name}</h2>
          <p>{selectedVolunteer.role || 'Volunteer Educator'} · {selectedVolunteer.assignedCenter || 'Unassigned center'}</p>
        </div>
        <div className="volunteer-hero-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              // TODO: Implement edit volunteer functionality or redirect
              navigate(`${config.routes.volunteers}`);
            }}
          >
            <Pencil size={16} /> Edit
          </button>
          <button
            className="secondary-button danger-button"
            type="button"
            onClick={() => deleteVolunteer(mongoId(selectedVolunteer))}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {(dataStatus?.loading || dataStatus?.error) && (
        <div className="container data-status-row">
          {dataStatus?.loading && <span className="data-status">Loading records from backend...</span>}
          {dataStatus?.error && <span className="data-status error">{dataStatus.error}</span>}
        </div>
      )}

      <div className="container volunteer-detail-grid">
        <article className="soft-card volunteer-panel-card volunteer-summary-card">
          <div className="volunteer-summary-stats">
            <div>
              <strong>{volunteerHours(selectedVolunteer)}h</strong>
              <span>Logged hours</span>
            </div>
            <div>
              <strong>{volunteerClasses.length}</strong>
              <span>Classes</span>
            </div>
            <div>
              <strong>{volunteerStudents.length}</strong>
              <span>Students</span>
            </div>
            <div>
              <strong>{volunteerAttendance.length}</strong>
              <span>Attendance sessions</span>
            </div>
          </div>

          <div className="volunteer-contact-grid">
            <div>
              <span>Email</span>
              <strong>{selectedVolunteer.email || '—'}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{selectedVolunteer.phone || '—'}</strong>
            </div>
            <div>
              <span>Availability</span>
              <strong>{selectedVolunteer.availability || '—'}</strong>
            </div>
          </div>
        </article>

        <section className="soft-card volunteer-detail-card">
          <div className="detail-card-heading">
            <BookOpen size={18} />
            <h4>Assigned classes</h4>
            <span>{volunteerClasses.length}</span>
          </div>
          {volunteerClasses.length ? (
            <div className="detail-table-wrap">
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Center</th>
                    <th>Students</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteerClasses.map((classItem) => {
                    const count = students.filter((student) => student.className === classItem.name).length;
                    return (
                      <tr key={mongoId(classItem)}>
                        <td>{classItem.name}</td>
                        <td>{classItem.center || classItem.centerId || '—'}</td>
                        <td>{count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="detail-empty">
              No classes linked yet. Go to the <Link to={config.routes.students}>Students page</Link> and set{' '}
              <strong>{selectedVolunteer.name}</strong> as the teacher when creating or editing a class.
            </p>
          )}
        </section>

        <section className="soft-card volunteer-detail-card">
          <div className="detail-card-heading">
            <GraduationCap size={18} />
            <h4>Students under this volunteer</h4>
            <span>{volunteerStudents.length}</span>
          </div>
          {volunteerStudents.length ? (
            <div className="detail-table-wrap">
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Age</th>
                    <th>Guardian</th>
                    <th>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteerStudents.map((student) => {
                    const attended = student.attendanceStats?.attended ?? 0;
                    const conducted = student.attendanceStats?.conducted ?? 0;
                    const percentage = conducted > 0 ? Math.round((attended / conducted) * 100) : 0;
                    return (
                      <tr key={mongoId(student)}>
                        <td>{student.name}</td>
                        <td>{student.className}</td>
                        <td>{student.age || '—'}</td>
                        <td>{student.guardianName || '—'}</td>
                        <td>
                          {percentage}%
                          <small style={{ display: 'block', color: 'var(--text-muted)' }}>
                            {attended}/{conducted} sessions
                          </small>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="detail-empty">
              Students appear here once they are enrolled in classes taught by this volunteer.
            </p>
          )}
        </section>

        <section className="soft-card volunteer-detail-card">
          <div className="detail-card-heading">
            <Users size={18} />
            <h4>Attendance history</h4>
            <span>{volunteerAttendance.length}</span>
          </div>
          {volunteerAttendance.length ? (
            <div className="detail-table-wrap">
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Class</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteerAttendance.map((session) => (
                    <tr key={mongoId(session)}>
                      <td>{formatDate(session.date)}</td>
                      <td>{session.className}</td>
                      <td style={{ color: 'var(--success-fg)' }}>{session.presentCount}</td>
                      <td style={{ color: 'var(--risk-fg)' }}>{session.absentCount}</td>
                      <td>{session.totalStudents}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="detail-empty">
              No attendance sessions recorded yet for this volunteer's classes.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
